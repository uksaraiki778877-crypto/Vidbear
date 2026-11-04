
const CACHE_NAME = "vidbear-v1";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(["/", "/manifest.json"])
    )
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method === "GET") {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request);
      })
    );
  }
});

