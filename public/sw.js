const CACHE_NAME = "disaster-handbook-v9";
const FONT_ASSETS = [
  "/fonts/NotoSansTC-Regular-subset.ttf",
  "/fonts/NotoSansTC-Bold-subset.ttf",
];
const DATA_ASSETS = [
  "/data/taiwan-shelters.json",
  "/data/taiwan-air-raid.json",
  "/data/taiwan-medical.json",
  "/data/taiwan-aed.json",
  "/data/taiwan-fire-stations.json",
  "/data/taiwan-police-stations.json",
  "/data/taiwan-mrt-shelters.json",
  "/data/taiwan-nursing.json",
  "/data/taiwan-migrant-health-centers.json",
];

// Install: pre-cache fonts + data for offline use
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll([...FONT_ASSETS, ...DATA_ASSETS])),
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
// - Data (.json): stale-while-revalidate (fast + fresh)
// - HTML/pages: network-first (always get latest, cache for offline)
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

  // Data JSON: stale-while-revalidate (serve cache instantly, update in background)
  if (url.pathname.startsWith("/data/") && url.pathname.endsWith(".json")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return res;
        });
        return cached || fetchPromise;
      }),
    );
    return;
  }

  // Everything else (HTML, JS, CSS): network-first
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
