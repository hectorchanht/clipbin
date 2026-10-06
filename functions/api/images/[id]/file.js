import { requireUser } from '../../../_lib.js';

/**
 * GET /api/images/:id/file — streams the image from the private R2 bucket.
 * Auth is checked per request, so no signed URLs are needed.
 */
export async function onRequestGet(context) {
  const { env, params } = context;
  const user = await requireUser(context);
  if (!user) return new Response('Not logged in.', { status: 401 });
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return new Response('Invalid id.', { status: 400 });

  const row = await env.DB.prepare('SELECT r2_key, mime FROM images WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .first();
  if (!row) return new Response('Not found.', { status: 404 });

  const obj = await env.IMAGES.get(row.r2_key);
  if (!obj) return new Response('Not found.', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Content-Type', row.mime);
  headers.set('Cache-Control', 'private, max-age=3600');
  return new Response(obj.body, { headers });
}
