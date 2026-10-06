/**
 * Minimal fetch client for the Cloudflare Pages Functions backend (/api/*).
 * When the backend is unreachable (e.g. a static mirror without Functions),
 * the app falls back to localStorage-only mode — checkBackend() detects this.
 */

let backendAvailable = null;

export const checkBackend = async () => {
  if (backendAvailable !== null) return backendAvailable;
  try {
    if (typeof fetch === 'undefined') throw new Error('no fetch');
    const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
    backendAvailable = res.status !== 404;
  } catch {
    backendAvailable = false;
  }
  return backendAvailable;
};

/** Test hook: reset the cached detection (used by tests). */
export const _resetBackendCache = () => {
  backendAvailable = null;
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Call the backend API. Throws ApiError with the server's message on failure.
 * Pass { form: FormData } for multipart uploads (no JSON content-type).
 */
export const api = async (path, { method = 'GET', body, form } = {}) => {
  const init = { method, credentials: 'same-origin' };
  if (form) {
    init.body = form;
  } else {
    init.headers = { 'Content-Type': 'application/json' };
    if (body !== undefined) init.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`/api${path}`, init);
  } catch (e) {
    throw new ApiError('Could not reach the server. Check your connection.', 0);
  }
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new ApiError(data.error || `Request failed (HTTP ${res.status}).`, res.status);
  }
  return data;
};
