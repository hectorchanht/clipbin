import { bad, json, randomToken, setSessionCookie, sha256hex } from '../../_lib.js';

/**
 * POST /api/auth/verify  { token }
 * Redeems a magic-link token: marks it used, creates the user on first
 * login, and establishes a 30-day session (httpOnly cookie).
 * Called by the SPA (user gesture), not by following the email link
 * directly — so mail-scanner prefetching can't burn the single-use token.
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return bad('Invalid request.');
  }
  const token = String(body.token || '');
  if (!/^[0-9a-f]{64}$/.test(token)) return bad('This login link is invalid or expired.', 400);

  const hash = await sha256hex('magic:' + token);
  const row = await env.DB.prepare(
    'SELECT email, expires_at, used FROM magic_tokens WHERE token_hash = ?'
  )
    .bind(hash)
    .first();
  if (!row || row.used || row.expires_at < Date.now()) {
    return bad('This login link is invalid or expired.', 400);
  }
  await env.DB.prepare('UPDATE magic_tokens SET used = 1 WHERE token_hash = ?').bind(hash).run();

  let user = await env.DB.prepare('SELECT id, email FROM users WHERE email = ?')
    .bind(row.email)
    .first();
  if (!user) {
    const id = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO users (id, email) VALUES (?, ?)').bind(id, row.email).run();
    user = { id, email: row.email };
  }

  const sessionToken = randomToken(32);
  const sessionHash = await sha256hex('session:' + sessionToken);
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionHash, user.id, Date.now() + 30 * 24 * 3600 * 1000)
    .run();

  return json({ user: { id: user.id, email: user.email } }, 200, {
    'Set-Cookie': setSessionCookie(sessionToken),
  });
}
