import { ApiError, _resetBackendCache, api, checkBackend } from './apiClient';

beforeEach(() => {
  _resetBackendCache();
  delete global.fetch;
});

test('checkBackend is false when fetch is unavailable', async () => {
  await expect(checkBackend()).resolves.toBe(false);
});

test('checkBackend is true when the session endpoint answers', async () => {
  global.fetch = jest.fn(async () => ({ status: 401 }));
  await expect(checkBackend()).resolves.toBe(true);
});

test('checkBackend is false on 404 (static host without Functions)', async () => {
  global.fetch = jest.fn(async () => ({ status: 404 }));
  await expect(checkBackend()).resolves.toBe(false);
});

test('api returns parsed JSON on success', async () => {
  global.fetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ items: [1, 2] }),
  }));
  await expect(api('/clips')).resolves.toEqual({ items: [1, 2] });
  expect(global.fetch).toHaveBeenCalledWith(
    '/api/clips',
    expect.objectContaining({ method: 'GET', credentials: 'same-origin' })
  );
});

test('api throws ApiError with the server message on failure', async () => {
  global.fetch = jest.fn(async () => ({
    ok: false,
    status: 429,
    json: async () => ({ error: 'Too many requests' }),
  }));
  const err = await api('/auth/magic-link', { method: 'POST', body: { email: 'a@b.c' } }).catch((e) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect(err.message).toMatch(/too many requests/i);
  expect(err.status).toBe(429);
});

test('api throws ApiError when the network fails', async () => {
  global.fetch = jest.fn(async () => {
    throw new TypeError('fetch failed');
  });
  await expect(api('/clips')).rejects.toThrow(/could not reach the server/i);
});
