/**
 * PostHog product analytics for Clipbin.
 *
 * All events land in the ONE shared dawn-studio PostHog project, so every
 * event must carry the super property { app: 'clipbin' } — registered once
 * right after init below.
 *
 * Browser-only: this module must never run under SSR (this app is
 * client-only, but the guards below make that explicit).
 *
 * Key/host resolution: REACT_APP_POSTHOG_KEY / REACT_APP_POSTHOG_HOST first,
 * falling back to the shared public project credentials.
 *
 * PRIVACY: never pass paste contents, emails, names, license keys, tokens,
 * or any other PII/secrets as event names or properties.
 */
import posthog from 'posthog-js';

// Public client key for the shared dawn-studio PostHog project — safe to
// embed in the frontend bundle.
const DEFAULT_KEY = 'phc_Dn2EebGR8eVrLKfQwArtfwxE4cUKQq2NPhwMRph4LqUf';
const DEFAULT_HOST = 'https://us.i.posthog.com';

const FIRST_OPEN_KEY = 'clipbin_posthog_first_open';

let initialized = false;

const trackFirstOpen = () => {
  try {
    if (window.localStorage.getItem(FIRST_OPEN_KEY)) return;
    window.localStorage.setItem(FIRST_OPEN_KEY, '1');
    const url = new URL(window.location.href);
    track('app_first_open', {
      referrer: document.referrer || undefined,
      utm_source: url.searchParams.get('utm_source') || undefined,
      locale: navigator.language || undefined,
    });
  } catch {
    /* analytics must never break the app */
  }
};

/** Call once at app startup (browser only). Safe to call twice. */
export const initAnalytics = () => {
  if (initialized || typeof window === 'undefined') return;
  const key = process.env.REACT_APP_POSTHOG_KEY || DEFAULT_KEY;
  const host = process.env.REACT_APP_POSTHOG_HOST || DEFAULT_HOST;
  if (!key) return;
  try {
    posthog.init(key, {
      api_host: host,
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: true,
      disable_session_recording: true, // session replay OFF (privacy + cost)
    });
    // Super property so the shared-project data stays queryable per app.
    posthog.register({ app: 'clipbin' });
    initialized = true;
    trackFirstOpen();
  } catch {
    /* analytics must never break the app */
  }
};

/**
 * Capture a custom event. No-op until initAnalytics() runs.
 * NEVER pass paste contents, emails, keys, or other PII in props.
 */
export const track = (event, props) => {
  if (!initialized || typeof window === 'undefined') return;
  try {
    posthog.capture(event, props);
  } catch {
    /* analytics must never break the app */
  }
};

const analytics = { initAnalytics, track };
export default analytics;
