// ATLVS Technologies — offline-first service worker (COMPVSS field PWA).
// Caches the mobile shell + check-in flow + offline fallback page.
//
// Offline queue: POSTs to the queueable field endpoints (clock punches,
// gate scans, ticket check-ins, equipment scans) are buffered in
// IndexedDB when the network is down and replayed FIFO per endpoint on
// the next reconnect via the background-sync event (or an explicit
// QUEUE_DRAIN message from a client, for browsers without sync).

const VERSION = "v5";
const STATIC_CACHE = `atlvs-static-${VERSION}`;
const RUNTIME_CACHE = `atlvs-runtime-${VERSION}`;
const QUEUE_DB = "atlvs-punch-queue";
const QUEUE_STORE = "punches";
const SYNC_TAG = "punch-replay";
const QUEUE_LIMIT = 500; // per-endpoint cap — oldest rows are evicted

// POST endpoints that get queue-and-replay treatment when the network
// fails. Rows persisted by ≤v3 carry no `endpoint` field — they were
// always clock punches, so they replay against PUNCH_ENDPOINT.
const PUNCH_ENDPOINT = "/api/v1/shifts/checkin";
const QUEUEABLE_ENDPOINTS = [
  PUNCH_ENDPOINT,
  "/api/v1/scan", // ticket / assignment check-in
  "/api/v1/accreditation/scan", // gate accreditation decisions
  "/api/v1/equipment/scan", // asset check-in / check-out
];

const PRECACHE = [
  // Static, unauthenticated offline fallback. Do NOT precache auth-gated
  // /m pages here — at install time the cache captures whatever the
  // network returns, which for a logged-out session is a login redirect
  // masquerading as the app shell.
  "/offline.html",
  "/manifest.json",
];

// Cap the runtime cache — field devices accumulate per-user HTML and
// assets indefinitely otherwise. Trimmed oldest-first on insert.
const RUNTIME_CACHE_MAX_ENTRIES = 120;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => {})));
  self.skipWaiting();
});

// One-time legacy-name reconciliation. The pre-brand-sweep SW (≤v2) used
// `fbw-*` IndexedDB + cache identifiers. Drain any leftover queued punches
// from `fbw-punch-queue` into the canonical store on the next activate, then
// drop the legacy DB. Safe to leave indefinitely — `indexedDB.databases()`
// will return [] once the upgrade has run, making subsequent calls cheap
// no-ops.
async function migrateLegacyQueue() {
  let legacy;
  try {
    legacy = await new Promise((resolve, reject) => {
      const req = indexedDB.open("fbw-punch-queue");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onupgradeneeded = () => {
        // Opened a brand-new DB (i.e. legacy never existed) — close + delete.
        const db = req.result;
        db.close();
      };
    });
  } catch {
    return;
  }
  if (!legacy.objectStoreNames.contains(QUEUE_STORE)) {
    legacy.close();
    indexedDB.deleteDatabase("fbw-punch-queue");
    return;
  }
  const rows = await new Promise((resolve, reject) => {
    const tx = legacy.transaction(QUEUE_STORE, "readonly");
    const req = tx.objectStore(QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch(() => []);
  legacy.close();
  if (rows && rows.length) {
    const target = await openQueueDb();
    await Promise.all(
      rows.map(
        (row) =>
          new Promise((resolve, reject) => {
            const tx = target.transaction(QUEUE_STORE, "readwrite");
            tx.objectStore(QUEUE_STORE).add({ body: row.body, enqueued_at: row.enqueued_at ?? Date.now() });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          }),
      ),
    );
    target.close();
  }
  indexedDB.deleteDatabase("fbw-punch-queue");
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k)),
        ),
      ),
      migrateLegacyQueue().catch(() => {}),
    ]),
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

function getAllRows(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readonly");
    const req = tx.objectStore(QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// The clock-punch API accepts an `at` timestamp (documented for offline
// replay) — stamp the capture time so a late replay records the real
// punch moment. The scan APIs record time server-side and accept no
// client timestamp, so their bodies are replayed exactly as captured.
function stampCaptureTime(endpoint, body) {
  if (endpoint !== PUNCH_ENDPOINT) return body;
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && !parsed.at) {
      parsed.at = new Date().toISOString();
      return JSON.stringify(parsed);
    }
  } catch {
    // Unparseable body — replay as-is; the API will reject it itself.
  }
  return body;
}

async function enqueueRequest(endpoint, body) {
  const db = await openQueueDb();
  // Per-endpoint cap: evict the oldest rows for this endpoint to make
  // room so one saturated queue can't grow unbounded.
  const rows = await getAllRows(db).catch(() => []);
  const mine = rows.filter((r) => (r.endpoint || PUNCH_ENDPOINT) === endpoint);
  const evict = mine.length >= QUEUE_LIMIT ? mine.slice(0, mine.length - QUEUE_LIMIT + 1) : [];
  await new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    const store = tx.objectStore(QUEUE_STORE);
    for (const row of evict) store.delete(row.id);
    store.add({ endpoint, body: stampCaptureTime(endpoint, body), enqueued_at: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function drainQueue() {
  const db = await openQueueDb();
  const all = await getAllRows(db);
  // Endpoints that hit a retryable failure this pass — skip their
  // remaining rows so replay stays strictly FIFO per endpoint.
  const blocked = new Set();
  let drained = 0;
  for (const row of all) {
    const endpoint = row.endpoint || PUNCH_ENDPOINT;
    if (blocked.has(endpoint)) continue;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: typeof row.body === "string" ? row.body : JSON.stringify(row.body),
      });
      // 4xx is terminal (validation / FSM rejection) — drop the row so
      // we don't loop forever. 429 (a drained burst can trip the scan
      // rate budget), 5xx and network errors leave it queued for the
      // next sync.
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(QUEUE_STORE, "readwrite");
          tx.objectStore(QUEUE_STORE).delete(row.id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        drained += 1;
      } else {
        blocked.add(endpoint);
      }
    } catch {
      // Still offline. Leave the row. Next sync.
      blocked.add(endpoint);
    }
  }
  db.close();
  return drained;
}

async function queueCounts() {
  const db = await openQueueDb();
  const all = await getAllRows(db).catch(() => []);
  db.close();
  const counts = {};
  for (const row of all) {
    const endpoint = row.endpoint || PUNCH_ENDPOINT;
    counts[endpoint] = (counts[endpoint] || 0) + 1;
  }
  return { counts, total: all.length };
}

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(drainQueue());
  }
});

// Client protocol (see src/lib/offline/queue-status.ts):
//   { type: "QUEUE_STATUS" } → replies { type: "QUEUE_STATUS", counts, total }
//     on the provided MessageChannel port (or the source client).
//   { type: "QUEUE_DRAIN" }  → replays the queue now. Covers browsers
//     without background sync (iOS Safari) when a client sees `online`.
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  if (data.type === "QUEUE_STATUS") {
    event.waitUntil(
      queueCounts()
        .then((status) => {
          const reply = { type: "QUEUE_STATUS", counts: status.counts, total: status.total };
          if (event.ports && event.ports[0]) event.ports[0].postMessage(reply);
          else if (event.source) event.source.postMessage(reply);
        })
        .catch(() => {}),
    );
  } else if (data.type === "QUEUE_DRAIN") {
    event.waitUntil(drainQueue().catch(() => {}));
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // POST to a queueable field API (clock punch, gate scan, ticket
  // check-in, equipment scan): try the network first, queue on failure
  // for background-sync replay. Returns a 202 to the client immediately
  // so the UI can move on; the request will land on next online sync.
  // Read-only GETs still get the network/offline shim below.
  if (req.method === "POST" && QUEUEABLE_ENDPOINTS.includes(url.pathname)) {
    const queuedResponse = () =>
      new Response(
        JSON.stringify({ ok: true, queued: true, error: { code: "queued_offline", message: "Queued; will sync when online." } }),
        { status: 202, headers: { "content-type": "application/json" } },
      );
    event.respondWith(
      (async () => {
        try {
          const cloned = req.clone();
          const res = await fetch(req);
          if (res.ok) return res;
          // 5xx — queue + report queued.
          if (res.status >= 500) {
            const body = await cloned.clone().text();
            await enqueueRequest(url.pathname, body);
            if (self.registration.sync) {
              try {
                await self.registration.sync.register(SYNC_TAG);
              } catch {}
            }
            return queuedResponse();
          }
          // 4xx — pass through so the UI shows the rejection.
          return res;
        } catch {
          // Network failure — queue + 202.
          const body = await req.clone().text();
          await enqueueRequest(url.pathname, body);
          if (self.registration.sync) {
            try {
              await self.registration.sync.register(SYNC_TAG);
            } catch {}
          }
          return queuedResponse();
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

  // Stale-while-revalidate for shell.
  // Guards on cache.put: same-origin only (no third-party responses),
  // 200 OK only (a transient 500/404 page used to get cached and served
  // first on every later visit until revalidation won), and an entry cap
  // so the cache can't grow without bound on a field device.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (url.origin === self.location.origin && res.ok && res.status === 200) {
            const copy = res.clone();
            caches
              .open(RUNTIME_CACHE)
              .then(async (cache) => {
                await cache.put(req, copy);
                const keys = await cache.keys();
                if (keys.length > RUNTIME_CACHE_MAX_ENTRIES) {
                  // FIFO trim — Cache API keys are insertion-ordered.
                  await Promise.all(
                    keys.slice(0, keys.length - RUNTIME_CACHE_MAX_ENTRIES).map((k) => cache.delete(k)),
                  );
                }
              })
              .catch(() => {});
          }
          return res;
        })
        .catch(() => cached || caches.match("/offline.html"));
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
    payload = { title: "ATLVS", body: event.data.text() };
  }
  const title = payload.title || "ATLVS";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    tag: payload.tag,
    data: payload.data || {},
  };
  if (payload.url) options.data.url = payload.url;
  // P2.a — actionable notifications. Render up to 2 action buttons and stash
  // each one's dispatch descriptor (endpoint + body) in data keyed by action
  // id so notificationclick can POST it without opening the app.
  if (Array.isArray(payload.actions) && payload.actions.length) {
    const list = payload.actions.slice(0, 2);
    options.actions = list.map((a) => ({ action: a.action, title: a.title }));
    options.data.actions = {};
    for (const a of list) {
      options.data.actions[a.action] = { endpoint: a.endpoint, body: a.body || null };
    }
  }
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};

  // P2.a — an action button was tapped: POST its descriptor (cookies
  // included) and surface a short result toast instead of opening the app.
  const actionId = event.action;
  if (actionId && data.actions && data.actions[actionId]) {
    const spec = data.actions[actionId];
    event.waitUntil(
      fetch(spec.endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: spec.body ? JSON.stringify(spec.body) : undefined,
      })
        .then((res) =>
          self.registration.showNotification("ATLVS", {
            body: res.ok ? "Done." : "Couldn't complete that — open the app to retry.",
            icon: "/icon-192.png",
            tag: (event.notification.tag || "action") + "-result",
          }),
        )
        .catch(() =>
          self.registration.showNotification("ATLVS", {
            body: "Offline — open the app to retry.",
            icon: "/icon-192.png",
            tag: (event.notification.tag || "action") + "-result",
          }),
        ),
    );
    return;
  }

  // Default: focus an existing tab on the target URL or open a new one.
  const url = data.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((tabs) => {
      const tab = tabs.find((t) => t.url.includes(url));
      if (tab) return tab.focus();
      return self.clients.openWindow(url);
    }),
  );
});
