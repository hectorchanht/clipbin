import { clientIp, json, rateLimit, sha256hex } from '../_lib.js';

/**
 * POST /api/verify-tip — verify a Gumroad tip-jar license key so a tipper
 * can hide the sponsored strip.
 *
 * Body: { licenseKey }. Always 200 with one of:
 *   { ok: true }              — valid tip-jar license (Gumroad verified)
 *   { ok: true, admin: true } — admin master key (hash match, no Gumroad call)
 *   { ok: false }             — invalid, refunded, or unverifiable
 *
 * No login required (tippers may not have accounts). The key is never
 * logged or echoed back. Fails closed on any network/API error.
 */

const ADMIN_KEY_SHA256 = '67d2d8519b0160af28a8d8f6c3cc97d810fda37161d2b10b1359d480c4ecad77';
const PRODUCT_PERMALINK = 'clipbin-tip';
const MAX_KEY_LEN = 200;

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false });
  }
  const key = typeof body?.licenseKey === 'string' ? body.licenseKey.trim() : '';
  if (!key || key.length > MAX_KEY_LEN) return json({ ok: false });

  // Light anti-brute-force: 10 attempts per minute per IP.
  try {
    const allowed = await rateLimit(env, 'verify-tip:' + clientIp(request), 10, 60_000);
    if (!allowed) return json({ ok: false });
  } catch {
    // A D1 hiccup must not block verification.
  }

  // Admin master key — verified by SHA-256 hash, never calls Gumroad.
  if ((await sha256hex(key)) === ADMIN_KEY_SHA256) {
    return json({ ok: true, admin: true });
  }

  // Real tip-jar key: verify against Gumroad's license API (no token needed).
  const form = new URLSearchParams();
  form.set('product_permalink', PRODUCT_PERMALINK);
  form.set('license_key', key);
  let gumroad;
  try {
    const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal: AbortSignal.timeout(15_000),
    });
    // Gumroad answers even failures as JSON (e.g. HTTP 404 + { success: false }).
    gumroad = await res.json();
  } catch {
    return json({ ok: false }); // network/API error: fail closed
  }
  if (gumroad?.success === true) {
    const p = gumroad.purchase || {};
    if (p.refunded !== true && p.chargebacked !== true) return json({ ok: true });
  }
  return json({ ok: false });
}
