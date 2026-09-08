// Offline-shell service worker, plus (round 26) Web Push handling. The v1
// "no push" decision recorded here has been deliberately reversed — round 26
// added real push support on purpose, not as an oversight of this comment.
// Still no background sync and no caching of dynamic content (case status,
// API responses): the fetch handler below only ever intercepts page
// navigations and falls back to a static "you're offline" page when the
// network is unreachable. It must never cache/serve a real case status
// page, since showing a stale cached status offline would be actively
// misleading for a product whose whole point is accurate, current
// information.

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

// Round 26 — a status-change push arrives with a JSON body: { title, body, url }.
// Built by sendPushToUser() (src/lib/push/send.ts) from the same real status
// data the Postmark email is built from — never a stale/cached value.
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/brand/icon-192.png",
      data: { url: payload.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url;
  if (!url) return;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
