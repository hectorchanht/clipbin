import {
  bad,
  clientIp,
  isValidEmail,
  json,
  randomToken,
  rateLimit,
  sendMagicLinkEmail,
  sha256hex,
} from '../../_lib.js';

/**
 * POST /api/auth/magic-link  { email }
 * Creates a single-use 15-minute login token and emails it via Resend.
 * Rate limits are ours now: 3 per email / 10 min, 10 per IP / 10 min.
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return bad('Invalid JSON.');
  }
  const email = String(body.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) return bad('Enter a valid email address.');

  const ip = clientIp(request);
  const [okEmail, okIp] = await Promise.all([
    rateLimit(env, `ml:email:${email}`, 3, 10 * 60 * 1000),
    rateLimit(env, `ml:ip:${ip}`, 10, 10 * 60 * 1000),
  ]);
  if (!okEmail || !okIp) {
    return bad('Too many requests — please wait a few minutes and try again.', 429);
  }

  if (!env.RESEND_API_KEY) {
    return bad('Email sending is not configured.', 500);
  }

  const token = randomToken(32);
  const tokenHash = await sha256hex('magic:' + token);
  const expiresAt = Date.now() + 15 * 60 * 1000;
  await env.DB.prepare('INSERT INTO magic_tokens (token_hash, email, expires_at) VALUES (?, ?, ?)')
    .bind(tokenHash, email, expiresAt)
    .run();

  const origin = new URL(request.url).origin;
  const link = `${origin}/?magic=${token}`;
  try {
    await sendMagicLinkEmail(env, email, link);
  } catch (e) {
    await env.DB.prepare('DELETE FROM magic_tokens WHERE token_hash = ?').bind(tokenHash).run();
    // TEMP DEBUG (revert after diagnosing): surface the Resend error.
    return bad('DEBUG send failed: ' + String((e && e.message) || e).slice(0, 200), 500);
  }
  return json({ ok: true });
}
