import { json, requireUser } from '../../_lib.js';

/** GET /api/auth/session — returns the logged-in user or 401. */
export async function onRequestGet(context) {
  const user = await requireUser(context);
  if (!user) return json({ user: null }, 401);
  return json({ user });
}
