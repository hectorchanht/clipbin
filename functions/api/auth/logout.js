import { clearSessionCookie, getSessionToken, json, sha256hex } from '../../_lib.js';

/** POST /api/auth/logout — destroys the session and clears the cookie. */
export async function onRequestPost(context) {
  const { env, request } = context;
  const token = getSessionToken(request);
  if (token && /^[0-9a-f]{64}$/.test(token)) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?')
      .bind(await sha256hex('session:' + token))
      .run();
  }
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}
