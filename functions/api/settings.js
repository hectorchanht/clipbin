import { bad, json, requireUser } from '../../_lib.js';

const KNOWN_KEYS = ['isAuthHidden', 'isSettingHidden', 'currentPage', 'pageSize', 'isEditing'];

/** GET /api/settings — the user's persisted UI settings. */
export async function onRequestGet(context) {
  const user = await requireUser(context);
  if (!user) return bad('Not logged in.', 401);
  const row = await context.env.DB.prepare('SELECT data FROM settings WHERE user_id = ?')
    .bind(user.id)
    .first();
  let settings = {};
  try {
    settings = row ? JSON.parse(row.data) : {};
  } catch {
    settings = {};
  }
  return json({ settings });
}

/** PUT /api/settings — persist UI settings (only known keys). */
export async function onRequestPut(context) {
  const { request, env } = context;
  const user = await requireUser(context);
  if (!user) return bad('Not logged in.', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return bad('Invalid JSON.');
  }
  const picked = {};
  for (const k of KNOWN_KEYS) {
    if (body[k] !== undefined) picked[k] = body[k];
  }
  const data = JSON.stringify(picked);
  await env.DB.prepare(
    `INSERT INTO settings (user_id, data) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET data = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`
  )
    .bind(user.id, data, data)
    .run();
  return json({ ok: true });
}
