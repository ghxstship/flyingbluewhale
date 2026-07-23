// ATLVS Technologies — offline-first service worker (COMPVSS field PWA).
// Caches the mobile shell + check-in flow + offline fallback page, plus a
// dedicated never-trimmed emergency tier (/m/emergency + its reference
// pages) so evac/crisis codes open with zero signal.
//
// Offline queue: POSTs to the queueable field endpoints (clock punches,
// gate scans, ticket check-ins, equipment scans) are buffered in
// IndexedDB when the network is down and replayed FIFO per endpoint on
// the next reconnect via the background-sync event (or an explicit
// QUEUE_DRAIN message from a client, for browsers without sync).

const VERSION = "v8";
const STATIC_CACHE = `atlvs-static-${VERSION}`;
const RUNTIME_CACHE = `atlvs-runtime-${VERSION}`;
const EMERGENCY_CACHE = `atlvs-emergency-${VERSION}`;
const QUEUE_DB = "atlvs-punch-queue";
const QUEUE_STORE = "punches";
const SYNC_TAG = "punch-replay";
const QUEUE_LIMIT = 500; // per-endpoint cap — oldest rows are evicted
const CACHED_AT_HEADER = "x-sw-cached-at";

// POST endpoints that get queue-and-replay treatment when the network
// fails. Rows persisted by ≤v3 carry no `endpoint` field — they were
// always clock punches, so they replay against PUNCH_ENDPOINT.
// Keep in sync with src/lib/offline/outbox.ts (the window-side view of
// the same queue — first-party field UIs submit through it).
const PUNCH_ENDPOINT = "/api/v1/shifts/checkin";
const CLOCK_ENDPOINT = "/api/v1/time/clock"; // free personal clock punch
const QUEUEABLE_ENDPOINTS = [
  PUNCH_ENDPOINT,
  CLOCK_ENDPOINT,
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

// Emergency tier (M0-b F3): the evac / crisis-code reference pages must open
// with ZERO signal. They are auth-gated + org-specific, so they cannot be
// precached at install (the install-time fetch would capture a login
// redirect — see the PRECACHE note above). Instead every successful visit
// stamps the rendered page into the DEDICATED cache below, which is exempt
// from the runtime FIFO trim so a busy shift can never evict it; visiting
// the hub warms the four sub-pages in the background. Offline serves carry
// the CACHED_AT_HEADER age via the existing SERVED_STALE signal.
// Keep in sync with src/lib/offline/emergency-routes.ts (parity-tested in
// src/lib/offline/queueable-endpoints.test.ts).
const EMERGENCY_ROUTES = [
  "/m/emergency",
  "/m/emergency/codes",
  "/m/emergency/fire",
  "/m/emergency/evacuation",
  "/m/emergency/shelter",
];
// Network race budget for emergency navigations — a black-holed radio link
// (no fast failure) must not stall the muster card; past this we serve the
// cached copy with its age.
const EMERGENCY_NETWORK_TIMEOUT_MS = 4000;

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
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE && k !== EMERGENCY_CACHE)
            .map((k) => caches.delete(k)),
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

// The clock-punch APIs accept an `at` timestamp (documented for offline
// replay) — stamp the capture time so a late replay records the real
// punch moment. The scan APIs record time server-side and accept no
// client timestamp, so their bodies are replayed exactly as captured.
function stampCaptureTime(endpoint, body) {
  if (endpoint !== PUNCH_ENDPOINT && endpoint !== CLOCK_ENDPOINT) return body;
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
  } else if (data.type === "SKIP_WAITING") {
    // Kit 32 F4 — the update toast ("New Version · Tap To Reload") posts
    // this to the WAITING worker; activating hands it the page on the
    // client's controllerchange-driven reload.
    self.skipWaiting();
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

  // Document / RSC data requests are NETWORK-FIRST with cache fallback:
  // rosters, schedules, and task lists must be live whenever the network
  // is reachable. Only when the fetch fails do we serve the cached copy,
  // and then we tell the page it's looking at stale data (SERVED_STALE →
  // SyncBanner renders an "offline copy, updated Xm ago" chip). Static
  // assets (hashed /_next/static, images, fonts) keep the faster
  // stale-while-revalidate path below — they are immutable-by-URL.
  const isDocOrData =
    req.mode === "navigate" ||
    req.headers.get("RSC") === "1" ||
    (req.headers.get("accept") || "").includes("text/html");

  // Emergency tier (M0-b F3): the evac / crisis-code reference must open with
  // zero signal. Still network-first — a DECLARED code must never render from
  // a stale copy while the network is reachable — but raced against a short
  // timeout (a black-holed radio link fails slow, not fast), falling back to
  // the dedicated never-trimmed emergency cache. The offline copy carries its
  // age via the same SERVED_STALE signal every stale doc serve uses.
  if (isDocOrData && EMERGENCY_ROUTES.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetchWithTimeout(req, EMERGENCY_NETWORK_TIMEOUT_MS);
          // !res.redirected: an expired session 302s to login — never let the
          // login page become the cached "emergency card".
          if (url.origin === self.location.origin && res.ok && res.status === 200 && !res.redirected) {
            putStamped(req, res.clone(), EMERGENCY_CACHE);
            // A hub visit warms the whole tier: one bar of signal at the gate
            // secures Codes / Fire / Evacuate / Shelter for the tunnels.
            if (req.mode === "navigate" && url.pathname === "/m/emergency") {
              event.waitUntil(warmEmergencyTier());
            }
          }
          return res;
        } catch {
          const emergency = await caches.open(EMERGENCY_CACHE);
          // ignoreVary: warmed entries were stamped from SW-side fetches whose
          // headers differ from a real navigation; the URL is the identity here.
          const cached = (await emergency.match(req, { ignoreVary: true })) || (await caches.match(req));
          if (cached) {
            notifyServedStale(event, url.pathname, cached.headers.get(CACHED_AT_HEADER));
            return cached;
          }
          const offline = await caches.match("/offline.html");
          return (
            offline ||
            new Response("Offline", { status: 503, headers: { "content-type": "text/plain" } })
          );
        }
      })(),
    );
    return;
  }

  if (isDocOrData) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (url.origin === self.location.origin && res.ok && res.status === 200) {
            putStamped(req, res.clone());
          }
          return res;
        } catch {
          const cached = await caches.match(req);
          if (cached) {
            notifyServedStale(event, url.pathname, cached.headers.get(CACHED_AT_HEADER));
            return cached;
          }
          const offline = await caches.match("/offline.html");
          return (
            offline ||
            new Response("Offline", { status: 503, headers: { "content-type": "text/plain" } })
          );
        }
      })(),
    );
    return;
  }

  // Stale-while-revalidate for static shell assets.
  // Guards on cache.put: same-origin only (no third-party responses),
  // 200 OK only (a transient 500/404 page used to get cached and served
  // first on every later visit until revalidation won), and an entry cap
  // so the cache can't grow without bound on a field device.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (url.origin === self.location.origin && res.ok && res.status === 200) {
            putStamped(req, res.clone());
          }
          return res;
        })
        .catch(() => cached || caches.match("/offline.html"));
      return cached || network;
    }),
  );
});

// Store a response in a cache stamped with the capture time so a later
// offline serve can say HOW stale the copy is. The runtime cache (default)
// is FIFO-trimmed; the emergency cache is deliberately NOT — five known
// routes, and eviction is exactly the failure the tier exists to prevent.
function putStamped(req, res, cacheName = RUNTIME_CACHE) {
  return caches
    .open(cacheName)
    .then(async (cache) => {
      const headers = new Headers(res.headers);
      headers.set(CACHED_AT_HEADER, String(Date.now()));
      const body = await res.blob();
      await cache.put(req, new Response(body, { status: res.status, statusText: res.statusText, headers }));
      if (cacheName !== RUNTIME_CACHE) return;
      const keys = await cache.keys();
      if (keys.length > RUNTIME_CACHE_MAX_ENTRIES) {
        // FIFO trim — Cache API keys are insertion-ordered.
        await Promise.all(keys.slice(0, keys.length - RUNTIME_CACHE_MAX_ENTRIES).map((k) => cache.delete(k)));
      }
    })
    .catch(() => {});
}

// Race a fetch against a deadline. An unreachable network usually rejects
// fast; a degraded one (one bar, deep in the venue) can hang for 30s+ —
// past the budget we fall back to the cached copy instead of stalling.
function fetchWithTimeout(req, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    fetch(req).then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

// Fetch + stamp the emergency sub-pages in the background after a hub visit.
// Best-effort per route (a failed warm leaves the visit-time stamp path);
// same-origin fetches carry the session cookies, and `!res.redirected`
// keeps a login redirect out of the tier.
async function warmEmergencyTier() {
  await Promise.all(
    EMERGENCY_ROUTES.filter((p) => p !== "/m/emergency").map(async (path) => {
      try {
        const res = await fetch(path, { headers: { accept: "text/html" } });
        if (res.ok && res.status === 200 && !res.redirected) {
          await putStamped(new Request(path), res, EMERGENCY_CACHE);
        }
      } catch {
        // Offline or blocked — the next online visit warms it.
      }
    }),
  );
}

// Tell the (resulting) client it was just served a cached copy because the
// network failed. For RSC fetches the requesting client already exists; for
// hard navigations the resulting client appears shortly after respondWith
// resolves, so poll briefly.
function notifyServedStale(event, path, cachedAtHeader) {
  const cachedAt = cachedAtHeader ? Number(cachedAtHeader) : null;
  const message = { type: "SERVED_STALE", path, cachedAt: Number.isFinite(cachedAt) ? cachedAt : null };
  event.waitUntil(
    (async () => {
      const id = event.clientId || event.resultingClientId;
      for (let i = 0; i < 8; i++) {
        const client =
          (id && (await self.clients.get(id))) ||
          (event.resultingClientId && (await self.clients.get(event.resultingClientId)));
        if (client) {
          client.postMessage(message);
          return;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      // Last resort: broadcast — a stale banner on a sibling tab is better
      // than an unmarked stale roster on the one that navigated.
      const all = await self.clients.matchAll({ type: "window" });
      for (const c of all) c.postMessage(message);
    })().catch(() => {}),
  );
}

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
