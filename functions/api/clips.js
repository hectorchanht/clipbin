import { bad, json, requireUser } from '../_lib.js';

/** GET /api/clips?page=&pageSize= — one page of the user's clips, newest first. */
export async function onRequestGet(context) {
  const { request, env } = context;
  const user = await requireUser(context);
  if (!user) return bad('Not logged in.', 401);

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('pageSize') || '10', 10) || 10));
  const start = (page - 1) * pageSize;

  const rows = await env.DB.prepare(
    'SELECT id, val, created_at FROM clips WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?'
  )
    .bind(user.id, pageSize + 1, start)
    .all();
  const all = rows.results || [];
  return json({ items: all.slice(0, pageSize), hasMore: all.length > pageSize });
}

/** POST /api/clips  { val } — save a clip. */
export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await requireUser(context);
  if (!user) return bad('Not logged in.', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return bad('Invalid JSON.');
  }
  const val = String(body.val ?? '').trim();
  if (!val) return bad('Nothing to save — the text is empty.');
  if (val.length > 100000) return bad('Text is too long (100k characters max).');

  const r = await env.DB.prepare('INSERT INTO clips (user_id, val) VALUES (?, ?)').bind(user.id, val).run();
  return json({ ok: true, id: Number(r.meta.last_row_id) });
}

/**
 * DELETE /api/clips — full reset: deletes ALL of the user's clips,
 * images (DB rows + R2 objects), and settings.
 */
export async function onRequestDelete(context) {
  const { env } = context;
  const user = await requireUser(context);
  if (!user) return bad('Not logged in.', 401);

  const imgRows = await env.DB.prepare('SELECT r2_key FROM images WHERE user_id = ?')
    .bind(user.id)
    .all();
  for (const r of imgRows.results || []) {
    await env.IMAGES.delete(r.r2_key);
  }
  await env.DB.batch([
    env.DB.prepare('DELETE FROM images WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM clips WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM settings WHERE user_id = ?').bind(user.id),
  ]);
  return json({ ok: true });
}
