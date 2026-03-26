const CACHE_NAME = "disaster-handbook-v6";
const FONT_ASSETS = [
  "/fonts/NotoSansTC-Regular-subset.ttf",
  "/fonts/NotoSansTC-Bold-subset.ttf",
];

// Install: only pre-cache fonts (rarely change, large files)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FONT_ASSETS)),
  );
  self.skipWaiting();
});

// Activate: clean ALL old caches immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch strategy:
// - Fonts (.ttf): cache-first (never change)
// - Data (.json) + HTML/pages: network-first (always get latest, cache for offline)
// - External requests: network only
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // External requests (Nominatim, Google, CDN): network only
  if (url.origin !== self.location.origin) return;

  // Fonts: cache-first (large, rarely change)
  if (url.pathname.endsWith(".ttf")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return res;
        });
      }),
    );
    return;
  }

  // Everything else (HTML, data JSON, JS, CSS): network-first
  // Always try network for latest data; cache as offline fallback
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request)),
  );
});
