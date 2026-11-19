
const CACHE_NAME = "dailycart-v2";
const LEGACY_CACHE_PREFIXES = ["QuickBite-", "quickbite-"];
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.add(OFFLINE_URL);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter(
            (name) =>
              (
                name.startsWith("dailycart-") ||
                LEGACY_CACHE_PREFIXES.some((prefix) =>
                  name.startsWith(prefix)
                )
              ) &&
              name !== CACHE_NAME
          )
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

  // Never intercept API requests or sensitive data requests.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigation: network first, offline page as fallback.
  // This also handles login, orders and tracking pages.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const offlinePage = await cache.match(OFFLINE_URL);

        return (
          offlinePage ||
          new Response("You are offline. Please try again.", {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
            },
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
        if (cachedResponse) {
          return cachedResponse;
        }

        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }

        return response;
      })
    );
  }
});
