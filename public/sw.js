
const CACHE_NAME = "quickbite-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.add(OFFLINE_URL);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name.startsWith("quickbite-") && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle same-origin GET requests.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Never cache APIs, authentication or order-related requests.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/orders") ||
    url.pathname.startsWith("/track-order")
  ) {
    return;
  }

  // Navigation: network first, offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        return (
          (await caches.match(OFFLINE_URL)) ||
          new Response("You are offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain" }
          })
        );
      })
    );

    return;
  }

  // Cache successful same-origin static assets.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(request).then(async (cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }

        return response;
      })
    );
  }
});
