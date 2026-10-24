// Clipbin service worker — offline app-shell cache (PWA sweep 2026-10-24).
// Navigations: network-first so new deploys land immediately; offline falls
// back to the cached shell. Hashed /static/ assets + images: stale-while-
// revalidate. /api/ (Pages Functions) and non-GET requests are NEVER
// intercepted, so clipboard sync traffic always goes straight to network.
const CACHE = "clipbin-v1";
const CORE = [
  "/",
  "/manifest.json",
  "/logo192.png",
  "/logo512.png",
  "/favicon-32.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() =>
          caches.match("/").then((shell) => shell || caches.match(request))
        )
    );
    return;
  }

  const cacheable =
    url.pathname.startsWith("/static/") ||
    url.pathname === "/manifest.json" ||
    /\.(?:png|jpg|jpeg|svg|ico|webp|css|js|woff2?)$/.test(url.pathname);
  if (cacheable) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
