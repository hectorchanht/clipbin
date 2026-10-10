/**
 * Sponsored-strip link config (moneyrate-style).
 *
 * Paste a real URL into a slot to make it appear in the strip automatically;
 * leave the string EMPTY to hide that slot. If every URL were empty the
 * strip renders nothing — but the tip jar URL is always set.
 *
 * The tip jar is his own product, so its rel is plain "noopener" — never
 * "sponsored". Referral links use rel="noopener sponsored".
 */
export const sponsoredLinks = {
  tipJar: 'https://dawnlimited.gumroad.com/l/clipbin-tip',
  wise: 'https://wise.com/invite/dic/hotungc3',
  coinbase: 'https://advanced.coinbase.com/join/F95MLKD?src=referral-link',
  binance: 'https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0027L6WVRQ',
  airalo: '',
  koinly: '',
  airwallex: '',
};

export const hasTipJarLink = () => Boolean(sponsoredLinks.tipJar);
export const hasWiseLink = () => Boolean(sponsoredLinks.wise);
export const hasCoinbaseLink = () => Boolean(sponsoredLinks.coinbase);
export const hasBinanceLink = () => Boolean(sponsoredLinks.binance);
export const hasAiraloLink = () => Boolean(sponsoredLinks.airalo);
export const hasKoinlyLink = () => Boolean(sponsoredLinks.koinly);
export const hasAirwallexLink = () => Boolean(sponsoredLinks.airwallex);

/**
 * localStorage flag that hides the strip. Set only via the explicit
 * "Hide sponsored strip" toggle (header ⋯ menu → "Supporter"), available
 * after the tip-jar license key is verified — the strip renders nothing
 * while this is "1". Verification alone never sets it.
 */
export const SPONSORED_HIDDEN_KEY = 'dawn_sponsored_hidden';

/** Custom window event fired whenever the hidden flag changes. */
export const SPONSORED_HIDDEN_EVENT = 'dawn:sponsored-hidden';

export const isSponsoredHidden = () =>
  typeof window !== 'undefined' && window.localStorage.getItem(SPONSORED_HIDDEN_KEY) === '1';

export const setSponsoredHidden = (hidden) => {
  if (typeof window === 'undefined') return;
  if (hidden) window.localStorage.setItem(SPONSORED_HIDDEN_KEY, '1');
  else window.localStorage.removeItem(SPONSORED_HIDDEN_KEY);
  window.dispatchEvent(new CustomEvent(SPONSORED_HIDDEN_EVENT));
};

/**
 * localStorage flag marking a verified tip-jar supporter. Set once, right
 * after the license key verifies — never auto-cleared. The sponsored
 * strip does NOT hide on this flag alone; hiding needs the explicit
 * dawn_sponsored_hidden toggle. Reserved for future supporter feature
 * gating (see isSupporter()).
 */
export const SUPPORTER_KEY = 'dawn_supporter';

export const isSupporter = () =>
  typeof window !== 'undefined' && window.localStorage.getItem(SUPPORTER_KEY) === '1';

export const setSupporter = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SUPPORTER_KEY, '1');
};

/**
 * The user's own tip-jar license key, kept on their own device so the
 * Settings input can be pre-filled (and copied for reuse on another
 * device/app). Never sent anywhere except /api/verify-tip on an explicit
 * Verify click — never auto-submitted.
 */
export const TIP_KEY_STORAGE = 'dawn_tip_license_key';

export const getStoredTipKey = () =>
  typeof window !== 'undefined' ? window.localStorage.getItem(TIP_KEY_STORAGE) || '' : '';

export const setStoredTipKey = (key) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TIP_KEY_STORAGE, key);
};
