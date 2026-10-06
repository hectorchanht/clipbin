import {
  MAX_LOCAL_IMAGE_BYTES,
  deleteImage,
  getImages,
  postImage,
} from './imageStore';

// 1x1 transparent PNG
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const pngBytes = () => Uint8Array.from(atob(PNG_BASE64), (c) => c.charCodeAt(0));
const pngFile = (name = 'tiny.png') => new File([pngBytes()], name, { type: 'image/png' });

// jsdom never decodes images — pretend every image is 4x4.
class MockImage {
  set src(_v) {
    setTimeout(() => this.onload && this.onload(), 0);
  }
  get naturalWidth() {
    return 4;
  }
  get naturalHeight() {
    return 4;
  }
}

beforeEach(() => {
  global.Image = MockImage;
  localStorage.clear();
});

test('postImage stores a local image and getImages pages it', async () => {
  const rec = await postImage(pngFile(), null);
  expect(rec.url.startsWith('data:image/png')).toBe(true);
  expect(rec.width).toBe(4);
  expect(rec.height).toBe(4);
  expect(rec.mime).toBe('image/png');

  await postImage(pngFile('b.png'), null);
  await postImage(pngFile('c.png'), null);

  const page1 = await getImages({ page: 1, pageSize: 2, userId: null });
  expect(page1.items).toHaveLength(2);
  expect(page1.hasMore).toBe(true);
  // newest first
  expect(page1.items[0].id).toBeGreaterThan(page1.items[1].id);

  const page2 = await getImages({ page: 2, pageSize: 2, userId: null });
  expect(page2.items).toHaveLength(1);
  expect(page2.hasMore).toBe(false);
});

test('postImage rejects non-image files', async () => {
  const txt = new File(['hello'], 'note.txt', { type: 'text/plain' });
  await expect(postImage(txt, null)).rejects.toThrow(/not an image/i);
});

test('postImage rejects oversized images in local mode', async () => {
  const big = new File([new Uint8Array(MAX_LOCAL_IMAGE_BYTES + 1)], 'big.png', {
    type: 'image/png',
  });
  await expect(postImage(big, null)).rejects.toThrow(/too big/i);
});

test('deleteImage removes the local image', async () => {
  const rec = await postImage(pngFile(), null);
  await deleteImage(rec, null);
  const { items } = await getImages({ page: 1, pageSize: 10, userId: null });
  expect(items).toHaveLength(0);
});
