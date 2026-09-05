// Minimal offline-shell service worker — v1 scope, as decided: no background
// sync, no push, no caching of any dynamic content (case status, API
// responses). Deliberately narrow: this only ever intercepts page navigations
// and falls back to a static "you're offline" page when the network is
// unreachable. It must never cache/serve a real case status page, since
// showing a stale cached status offline would be actively misleading for a
// product whose whole point is accurate, current information.

const CACHE_NAME = "casewhy-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  );
});
