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
