// COMPVSS offline-first service worker — LYTEHAUS Technologies
// Caches the mobile shell + gate scan + offline fallback page.

const VERSION = "v1";
const STATIC_CACHE = `compvss-static-${VERSION}`;
const RUNTIME_CACHE = `compvss-runtime-${VERSION}`;

const PRECACHE = [
  "/m",
  "/m/gate",
  "/m/shift",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Network-first for API
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req).catch(() =>
        new Response(JSON.stringify({ ok: false, error: { code: "offline", message: "Offline" } }), {
          status: 503,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    return;
  }

  // Stale-while-revalidate for shell
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached || caches.match("/m"));
      return cached || network;
    }),
  );
});

// Web Push (Phase 2.3) — display a notification on incoming push.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "LYTEHAUS", body: event.data.text() };
  }
  const title = payload.title || "LYTEHAUS";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    tag: payload.tag,
    data: payload.data || {},
  };
  if (payload.url) options.data.url = payload.url;
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/m";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((tabs) => {
      const tab = tabs.find((t) => t.url.includes(url));
      if (tab) return tab.focus();
      return self.clients.openWindow(url);
    }),
  );
});
