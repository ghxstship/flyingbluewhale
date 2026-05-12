// FLYTEHAUS Technologies — COMPVSS offline-first service worker
// Caches the mobile shell + check-in flow + offline fallback page.
//
// Offline queue: clock-punch POSTs to /api/v1/shifts/checkin are
// buffered in IndexedDB when the network is down and replayed on the
// next reconnect via the background-sync event.

const VERSION = "v2";
const STATIC_CACHE = `fth-static-${VERSION}`;
const RUNTIME_CACHE = `fth-runtime-${VERSION}`;
const QUEUE_DB = "fth-punch-queue";
const QUEUE_STORE = "punches";
const SYNC_TAG = "punch-replay";

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

// IndexedDB helpers — single-store FIFO queue.
function openQueueDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueuePunch(body) {
  const db = await openQueueDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    tx.objectStore(QUEUE_STORE).add({ body, enqueued_at: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function drainPunchQueue() {
  const db = await openQueueDb();
  const all = await new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readonly");
    const req = tx.objectStore(QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  let drained = 0;
  for (const row of all) {
    try {
      const res = await fetch("/api/v1/shifts/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: typeof row.body === "string" ? row.body : JSON.stringify(row.body),
      });
      // 4xx is terminal (validation / FSM rejection) — drop the row so
      // we don't loop forever. 5xx and network errors leave it queued
      // for the next sync.
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(QUEUE_STORE, "readwrite");
          tx.objectStore(QUEUE_STORE).delete(row.id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        drained += 1;
      }
    } catch {
      // Still offline. Leave the row. Next sync.
    }
  }
  db.close();
  return drained;
}

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(drainPunchQueue());
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // POST to the clock-punch API: try the network first, queue on
  // failure for background-sync replay. Returns a 202 to the client
  // immediately so the UI can move on; the punch will land on next
  // online sync. Read-only GETs still get the network/offline shim
  // below.
  if (req.method === "POST" && url.pathname === "/api/v1/shifts/checkin") {
    event.respondWith(
      (async () => {
        try {
          const cloned = req.clone();
          const res = await fetch(req);
          if (res.ok) return res;
          // 5xx — queue + report queued.
          if (res.status >= 500) {
            const body = await cloned.clone().text();
            await enqueuePunch(body);
            if (self.registration.sync) {
              try {
                await self.registration.sync.register(SYNC_TAG);
              } catch {}
            }
            return new Response(
              JSON.stringify({ ok: true, queued: true, error: { code: "queued_offline", message: "Punch queued; will sync." } }),
              { status: 202, headers: { "content-type": "application/json" } },
            );
          }
          // 4xx — pass through so the UI shows the rejection.
          return res;
        } catch {
          // Network failure — queue + 202.
          const body = await req.clone().text();
          await enqueuePunch(body);
          if (self.registration.sync) {
            try {
              await self.registration.sync.register(SYNC_TAG);
            } catch {}
          }
          return new Response(
            JSON.stringify({ ok: true, queued: true, error: { code: "queued_offline", message: "Punch queued; will sync." } }),
            { status: 202, headers: { "content-type": "application/json" } },
          );
        }
      })(),
    );
    return;
  }

  if (req.method !== "GET") return;

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
    payload = { title: "FLYTEHAUS", body: event.data.text() };
  }
  const title = payload.title || "FLYTEHAUS";
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
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((tabs) => {
      const tab = tabs.find((t) => t.url.includes(url));
      if (tab) return tab.focus();
      return self.clients.openWindow(url);
    }),
  );
});
