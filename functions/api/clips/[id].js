import { bad, json, requireUser } from '../../_lib.js';

function validId(params) {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** PATCH /api/clips/:id  { val } — edit a clip. */
export async function onRequestPatch(context) {
  const { request, env, params } = context;
  const user = await requireUser(context);
  if (!user) return bad('Not logged in.', 401);
  const id = validId(params);
  if (!id) return bad('Invalid id.');

  let body;
  try {
    body = await request.json();
  } catch {
    return bad('Invalid JSON.');
  }
  const val = String(body.val ?? '').trim();
  if (!val) return bad('Nothing to save — the text is empty.');
  if (val.length > 100000) return bad('Text is too long (100k characters max).');

  const r = await env.DB.prepare('UPDATE clips SET val = ? WHERE id = ? AND user_id = ?')
    .bind(val, id, user.id)
    .run();
  if (r.meta.changes === 0) return bad('Entry not found.', 404);
  return json({ ok: true });
}

/** DELETE /api/clips/:id — delete a clip. */
export async function onRequestDelete(context) {
  const { env, params } = context;
  const user = await requireUser(context);
  if (!user) return bad('Not logged in.', 401);
  const id = validId(params);
  if (!id) return bad('Invalid id.');

  const r = await env.DB.prepare('DELETE FROM clips WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .run();
  if (r.meta.changes === 0) return bad('Entry not found.', 404);
  return json({ ok: true });
}
