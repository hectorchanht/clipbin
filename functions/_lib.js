/**
 * Shared helpers for the Clipbin Pages Functions backend.
 * Auth model: passwordless magic links. Sessions are opaque random tokens
 * (SHA-256 hashed at rest) in D1, carried in an httpOnly cookie.
 * (Files/dirs starting with `_` are not routed by Pages Functions.)
 */

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

export const bad = (message, status = 400) => json({ error: message }, status);

export function randomToken(bytes = 32) {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export async function sha256hex(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function getSessionToken(request) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/(?:^|;\s*)clipbin_session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Returns { id, email } for a valid session, else null. */
export async function requireUser(context) {
  const { request, env } = context;
  const token = getSessionToken(request);
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const hash = await sha256hex('session:' + token);
  const row = await env.DB.prepare(
    'SELECT s.user_id AS id, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'
  )
    .bind(hash, Date.now())
    .first();
  return row ? { id: row.id, email: row.email } : null;
}

export function setSessionCookie(token) {
  return [
    `clipbin_session=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${30 * 24 * 3600}`,
  ].join('; ');
}

export function clearSessionCookie() {
  return 'clipbin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

/** Fixed-window rate limiter backed by D1. Returns true when allowed. */
export async function rateLimit(env, key, max, windowMs) {
  const now = Date.now();
  const row = await env.DB.prepare('SELECT count, window_start FROM rate_limits WHERE key = ?')
    .bind(key)
    .first();
  if (!row || now - row.window_start > windowMs) {
    await env.DB.prepare('INSERT OR REPLACE INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)')
      .bind(key, now)
      .run();
    return true;
  }
  if (row.count >= max) return false;
  await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
  return true;
}

export function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendMagicLinkEmail(env, to, link) {
  // Default From: the apex hectorchan.com is the freshly-verified Resend entry
  // (the mail.hectorchan.com subdomain shows Verified in the dashboard but the
  // API rejects it). env.MAGIC_LINK_FROM still overrides when set.
  const from = env.MAGIC_LINK_FROM || 'Clipbin <login@hectorchan.com>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Your Clipbin login link',
      html: `<p>Click the link below to log in to Clipbin. It expires in 15 minutes and can only be used once.</p><p><a href="${link}">Log in to Clipbin</a></p><p>If you didn't request this, just ignore this email.</p>`,
      text: `Log in to Clipbin (expires in 15 minutes, single use): ${link}`,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Email send failed: HTTP ${res.status} ${t.slice(0, 200)}`);
  }
}
