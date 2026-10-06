import { bad, json, requireUser } from '../../_lib.js';

/** DELETE /api/images/:id — deletes the DB row and the R2 object. */
export async function onRequestDelete(context) {
  const { env, params } = context;
  const user = await requireUser(context);
  if (!user) return bad('Not logged in.', 401);
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return bad('Invalid id.');

  const row = await env.DB.prepare('SELECT r2_key FROM images WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .first();
  if (!row) return bad('Image not found.', 404);

  await env.DB.prepare('DELETE FROM images WHERE id = ?').bind(id).run();
  await env.IMAGES.delete(row.r2_key);
  return json({ ok: true });
}
