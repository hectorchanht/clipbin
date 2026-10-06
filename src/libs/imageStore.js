import { supabase } from './supabaseClient';

export const IMAGE_BUCKET = 'clipbin-images';
export const IMAGE_TABLE = 'clipbin-images';
const LOCAL_KEY = 'clipbin-images';
const LOCAL_ID_KEY = 'clipbin-images-id';
// localStorage is ~5MB total — keep single images well under that.
export const MAX_LOCAL_IMAGE_BYTES = 2 * 1024 * 1024;

const uuid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const readLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) ?? [];
  } catch {
    return [];
  }
};

const readLocalId = () => {
  try {
    return Number(JSON.parse(localStorage.getItem(LOCAL_ID_KEY)) ?? 0);
  } catch {
    return 0;
  }
};

/** Best-effort image dimensions; resolves {} when the image can't be decoded. */
export const getImageDims = (src) =>
  new Promise((resolve) => {
    let done = false;
    const finish = (value) => {
      if (!done) {
        done = true;
        resolve(value);
      }
    };
    try {
      const img = new Image();
      img.onload = () => finish({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => finish({});
      img.src = src;
      // Never hang when the image can't be decoded (e.g. jsdom).
      setTimeout(() => finish({}), 3000);
    } catch {
      finish({});
    }
  });

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('Could not read the image file.'));
    fr.readAsDataURL(file);
  });

const cleanExt = (name) =>
  ((name || '').split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';

/**
 * Save an image File. Cloud mode uploads to the private Supabase Storage
 * bucket and records a metadata row; local mode stores a data URL in
 * localStorage (with a size guard).
 */
export const postImage = async (file, userId) => {
  if (!file || typeof file.type !== 'string' || !file.type.startsWith('image/')) {
    throw new Error('That file is not an image.');
  }

  if (!userId) {
    if (file.size > MAX_LOCAL_IMAGE_BYTES) {
      throw new Error('Image is too big for local mode (>2MB) — log in to save it to the cloud.');
    }
    const dataUrl = await readAsDataUrl(file);
    const dims = await getImageDims(dataUrl);
    const id = readLocalId();
    const rec = {
      id,
      dataUrl,
      mime: file.type,
      size_bytes: file.size,
      width: dims.w ?? null,
      height: dims.h ?? null,
      created_at: new Date().toISOString(),
      user_id: 'localStorage',
    };
    const all = readLocal();
    localStorage.setItem(LOCAL_KEY, JSON.stringify([rec, ...all]));
    localStorage.setItem(LOCAL_ID_KEY, JSON.stringify(id + 1));
    return { ...rec, url: dataUrl };
  }

  const path = `${userId}/${uuid()}.${cleanExt(file.name)}`;
  const { error: upErr } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) {
    throw new Error(upErr.message);
  }

  let dims = {};
  try {
    const objUrl = URL.createObjectURL(file);
    dims = await getImageDims(objUrl);
    URL.revokeObjectURL(objUrl);
  } catch {
    dims = {};
  }

  const { data, error } = await supabase
    .from(IMAGE_TABLE)
    .insert({
      user_id: userId,
      storage_path: path,
      mime: file.type,
      size_bytes: file.size,
      width: dims.w ?? null,
      height: dims.h ?? null,
    })
    .select()
    .single();

  if (error) {
    // Don't orphan the uploaded file when the row insert fails.
    await supabase.storage.from(IMAGE_BUCKET).remove([path]);
    throw new Error(error.message);
  }
  return data;
};

/**
 * One page of images, newest first, each with a viewable `url`.
 * Cloud URLs are 1-hour signed URLs (bucket is private).
 */
export const getImages = async ({ page, pageSize, userId }) => {
  const p = page > 0 ? page : 1;
  const size = pageSize > 0 ? pageSize : 12;
  const start = (p - 1) * size;

  if (!userId) {
    const slice = readLocal().slice(start, start + size + 1);
    return {
      items: slice.slice(0, size).map((r) => ({ ...r, url: r.dataUrl })),
      hasMore: slice.length > size,
    };
  }

  const { data, error } = await supabase
    .from(IMAGE_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(start, start + size); // inclusive end => size + 1 rows

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const items = await Promise.all(
    rows.slice(0, size).map(async (r) => {
      const { data: urlData, error: urlError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .createSignedUrl(r.storage_path, 3600);
      if (urlError) {
        throw new Error(urlError.message);
      }
      return { ...r, url: urlData.signedUrl };
    })
  );
  return { items, hasMore: rows.length > size };
};

export const deleteImage = async (rec, userId) => {
  if (!rec) {
    throw new Error('Nothing to delete.');
  }
  if (!userId) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(readLocal().filter((r) => r.id !== rec.id)));
    return;
  }
  const { error } = await supabase
    .from(IMAGE_TABLE)
    .delete()
    .eq('id', rec.id)
    .eq('user_id', userId);
  if (error) {
    throw new Error(error.message);
  }
  if (rec.storage_path) {
    await supabase.storage.from(IMAGE_BUCKET).remove([rec.storage_path]);
  }
};

/** Copy an image URL's bytes to the system clipboard. */
export const copyImageToClipboard = async (url, mime) => {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('Image copy is not supported in this browser.');
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Could not fetch the image to copy it.');
  }
  const blob = await res.blob();
  await navigator.clipboard.write([new ClipboardItem({ [blob.type || mime || 'image/png']: blob })]);
};
