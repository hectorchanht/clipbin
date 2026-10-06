import { api, checkBackend } from './apiClient';

const LOCAL_KEY = 'clipbin-images';
const LOCAL_ID_KEY = 'clipbin-images-id';
// localStorage is ~5MB total — keep single images well under that.
export const MAX_LOCAL_IMAGE_BYTES = 2 * 1024 * 1024;

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

/**
 * Save an image File. Logged in (and backend reachable) → multipart upload
 * to the private R2 bucket via /api; otherwise a data URL in localStorage
 * (with a size guard).
 */
export const postImage = async (file, userId) => {
  if (!file || typeof file.type !== 'string' || !file.type.startsWith('image/')) {
    throw new Error('That file is not an image.');
  }

  const backend = await checkBackend();
  if (!userId || !backend) {
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

  const form = new FormData();
  form.append('file', file);
  try {
    const objUrl = URL.createObjectURL(file);
    const dims = await getImageDims(objUrl);
    URL.revokeObjectURL(objUrl);
    if (dims.w) {
      form.append('width', String(dims.w));
      form.append('height', String(dims.h));
    }
  } catch {
    /* dims are best-effort */
  }
  const { id, url } = await api('/images', { method: 'POST', form });
  return { id, url, mime: file.type, size_bytes: file.size };
};

/**
 * One page of images, newest first, each with a viewable `url`
 * (served by the backend from the private R2 bucket, auth-checked).
 */
export const getImages = async ({ page, pageSize, userId }) => {
  const p = page > 0 ? page : 1;
  const size = pageSize > 0 ? pageSize : 12;

  const backend = await checkBackend();
  if (!userId || !backend) {
    const start = (p - 1) * size;
    const slice = readLocal().slice(start, start + size + 1);
    return {
      items: slice.slice(0, size).map((r) => ({ ...r, url: r.dataUrl })),
      hasMore: slice.length > size,
    };
  }

  const { items, hasMore } = await api(`/images?page=${p}&pageSize=${size}`);
  return { items, hasMore };
};

export const deleteImage = async (rec, userId) => {
  if (!rec) {
    throw new Error('Nothing to delete.');
  }
  const backend = await checkBackend();
  if (!userId || !backend) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(readLocal().filter((r) => r.id !== rec.id)));
    return;
  }
  await api(`/images/${rec.id}`, { method: 'DELETE' });
};

/** Copy an image URL's bytes to the system clipboard. */
export const copyImageToClipboard = async (url, mime) => {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('Image copy is not supported in this browser.');
  }
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) {
    throw new Error('Could not fetch the image to copy it.');
  }
  const blob = await res.blob();
  await navigator.clipboard.write([new ClipboardItem({ [blob.type || mime || 'image/png']: blob })]);
};
