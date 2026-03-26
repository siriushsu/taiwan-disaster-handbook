const CACHE_NAME = "disaster-handbook-v5";
const STATIC_ASSETS = [
  "/manifest.json",
  "/fonts/NotoSansTC-Regular-subset.ttf",
  "/fonts/NotoSansTC-Bold-subset.ttf",
  "/data/taiwan-shelters.json",
  "/data/taiwan-medical.json",
  "/data/taiwan-air-raid.json",
  "/data/taiwan-aed.json",
  "/data/taiwan-fire-stations.json",
  "/data/taiwan-police-stations.json",
];

// Install: cache static assets (fonts + data only, NOT HTML pages)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// Activate: clean old caches immediately
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
// - HTML/pages: network-first (always get latest, fallback to cache if offline)
// - Static assets (fonts, data, JS, CSS): cache-first
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // External requests (Nominatim etc): network only
  if (url.origin !== self.location.origin) return;

  // HTML pages: network-first so updates are always visible
  if (
    event.request.mode === "navigate" ||
    event.request.headers.get("accept")?.includes("text/html")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (
          res.ok &&
          (url.pathname.endsWith(".ttf") ||
            url.pathname.endsWith(".json") ||
            url.pathname.endsWith(".js") ||
            url.pathname.endsWith(".css") ||
            url.pathname.startsWith("/data/"))
        ) {
          const clone = res.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
        }
        return res;
      });
    }),
  );
});
