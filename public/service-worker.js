// flyingbluewhale offline-first service worker
// Caches the mobile shell + check-in flow + offline fallback page.

const VERSION = "v1";
const STATIC_CACHE = `fbw-static-${VERSION}`;
const RUNTIME_CACHE = `fbw-runtime-${VERSION}`;

const PRECACHE = [
  "/",
  "/m",
  "/m/check-in",
  "/m/tasks",
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
