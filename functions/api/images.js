import { bad, json, randomToken, requireUser } from '../_lib.js';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** GET /api/images?page=&pageSize= — one page of the user's images, newest first. */
export async function onRequestGet(context) {
  const { request, env } = context;
  const user = await requireUser(context);
  if (!user) return bad('Not logged in.', 401);

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const pageSize = Math.min(48, Math.max(1, parseInt(url.searchParams.get('pageSize') || '12', 10) || 12));
  const start = (page - 1) * pageSize;

  const rows = await env.DB.prepare(
    'SELECT id, mime, size_bytes, width, height, created_at FROM images WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?'
  )
    .bind(user.id, pageSize + 1, start)
    .all();
  const all = rows.results || [];
  const items = all.slice(0, pageSize).map((r) => ({ ...r, url: `/api/images/${r.id}/file` }));
  return json({ items, hasMore: all.length > pageSize });
}

/** POST /api/images — multipart upload (fields: file, width?, height?). */
export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await requireUser(context);
  if (!user) return bad('Not logged in.', 401);

  let form;
  try {
    form = await request.formData();
  } catch {
    return bad('Invalid upload.');
  }
  const file = form.get('file');
  if (!file || typeof file.type !== 'string' || !file.type.startsWith('image/')) {
    return bad('That file is not an image.');
  }
  if (file.size > MAX_IMAGE_BYTES) return bad('Image is too big (10MB max).');

  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const key = `${user.id}/${randomToken(16)}.${ext}`;
  await env.IMAGES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const width = Number(form.get('width')) || null;
  const height = Number(form.get('height')) || null;
  const r = await env.DB.prepare(
    'INSERT INTO images (user_id, r2_key, mime, size_bytes, width, height) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(user.id, key, file.type, file.size, width, height)
    .run();
  const id = Number(r.meta.last_row_id);
  return json({ ok: true, id, url: `/api/images/${id}/file` });
}
