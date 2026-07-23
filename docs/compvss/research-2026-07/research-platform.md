# Cross-Cutting Mobile SaaS Platform Best Practices — Research Findings

**Date:** 2026-07-23 · **Scope:** what defines category leaders in mobile SaaS regardless of vertical, mapped against COMPVSS (offline-first field PWA for live-event crews).
**COMPVSS ground truth verified in-repo:** `public/service-worker.js` (509 lines, v7 — IndexedDB outbox for 5 queueable POST endpoints, background-sync + explicit drain, runtime cache cap 120 entries, precache limited to `/offline.html`+manifest to avoid caching auth redirects); `src/lib/offline/queue.ts` (localStorage FIFO for server-action payloads — chat, daily-log — idempotent on client id, ordered drain, explicitly "not a general-purpose sync engine"); `docs/compvss/KIT_CANON.md` (kit SSOT: 6-tab IA, ActionBar, Sheet grammar, Rose credential w/ single-use refresh-on-open QR, native Capacitor permission prompts anticipated); `docs/compvss/WEB_APP_STRATEGY.md` (breakpoint-adaptive single shell; Capacitor wrapper over `compvss.atlvs.pro/m` treated as live packaging path).

Legend for feasibility: **PWA-today** = shippable in the current web app · **Capacitor** = needs the hybrid wrapper · **Native** = needs a real native app.

---

## A. Offline-first architecture

### 1. Local-first reads: render from a device store, never a spinner
- **Pattern:** The defining trait of Linear/Figma/Superhuman-class apps is that *reads never wait on the network* — UI renders from a local replica (IndexedDB/SQLite) and the network is a background concern. Interaction latency is bounded by local write speed (sub-ms), not RTT (50–300ms).
- **Exemplars/evidence:** Linear's sync engine (custom object graph in IndexedDB, delta packets), Figma LiveGraph, Asana LunaDB; the Ink & Switch "Local-first software" essay (Kleppmann et al., 2019) defines the seven ideals (fast, multi-device, offline, collaborative, longevity, privacy, user control). Sources: inkandswitch.com/essay/local-first, stack.convex.dev/object-sync-engine, powersync.com/blog/local-first-is-a-big-deal-especially-for-the-web.
- **PWA feasibility:** PWA-today — IndexedDB + SW is exactly how Linear's web client works. Storage-eviction risk on iOS (7-day heuristic for non-installed Safari; installed home-screen apps are exempted from the 7-day cap but storage is still evictable under pressure; `navigator.storage.persist()` helps on Android, is a no-op on iOS).
- **COMPVSS status:** GAP (partial). COMPVSS is *offline-capable for writes* (outbox) and *cache-stale for reads* (SW runtime cache of HTML), but not local-first: pages are server components; a cold offline open serves whatever HTML the runtime cache happens to hold (cap 120 entries) or `/offline.html`. There is no queryable local replica of tasks/shifts/assignments. This is the single biggest architectural distance between COMPVSS and the leaders.

### 2. Durable write outbox with idempotency keys and ordered replay
- **Pattern:** Queue mutations locally with a stable client-generated id (dedupe + server idempotency), replay FIFO per channel on reconnect, stop the drain on first failure so ordering holds. Replicache formalizes this as the "mutation queue + server reconciliation" model borrowed from multiplayer games.
- **Exemplars/evidence:** Replicache push/pull protocol (replicache.dev); WatermelonDB `synchronize()` (pull-changes/push-changes with `last_pulled_at`); PowerSync upload queue. All three converge on: client-ids, monotonic ordering, server as authority.
- **PWA feasibility:** PWA-today. Background Sync API is Chromium-only; iOS needs foreground drain on `online`/visibilitychange — COMPVSS already does both (sync event + `QUEUE_DRAIN` message).
- **COMPVSS status:** STRONG. Two-tier outbox (IndexedDB in SW for queueable POSTs; localStorage FIFO for server-action payloads) with idempotent enqueue, ordered drain, first-failure stop, per-endpoint cap 500 with oldest-eviction, and a combined `<SyncBanner>` count. Matches leader discipline for its scope. Residual gaps: localStorage tier is lossy under storage pressure (acknowledged in-code); no server-side idempotency-key contract documented for the replayed endpoints (double-submit after a mid-flight crash is theoretically possible); no per-item retry backoff/poison-row handling beyond the cap.

### 3. Server-authoritative conflict resolution, not academic CRDTs
- **Pattern:** The leaders converged on *server reconciliation with intent-preserving mutations* (Replicache) or *last-write-wins ordered by server/Lamport timestamp per field* (Linear, Figma, Notion) — NOT general CRDTs. CRDTs pay a large complexity/metadata tax that only pure peer-to-peer apps need; with a central server, replaying named mutations ("assign task X to user Y") against fresh state is easier to reason about and audit.
- **Evidence:** Figma's "How Figma's multiplayer technology works" (per-property LWW); Linear sync deep-dives; Replicache design doc; Convex object-sync-engine essay. Sources: birjob.com/blog/local-first-software-2026, tushar.ai/posts/replicache.
- **PWA feasibility:** PWA-today (it's a protocol design question, not a platform one).
- **COMPVSS status:** ADEQUATE for current write shapes. Queued writes are append-only events (punches, scans, chat messages, daily logs) — naturally conflict-free; the FSMs (`NEXT_FULFILLMENT_STATES` etc.) reject illegal stale transitions server-side, which *is* server reconciliation. If COMPVSS ever queues *edits* to shared records offline, it will need mutation-intent replay + a conflict surface; nothing exists for that today.

### 4. Honest sync-status UX: pending count, per-item state, never silent loss
- **Pattern:** Leaders surface sync state as a first-class UI element: a pending-writes indicator, per-item "queued/sending/failed" chips, an explicit conflict/failure inbox (never a silent drop). Superhuman's offline mode and Linear's sync indicator are the references; local-first literature calls this "sync transparency."
- **Evidence:** Linear shows offline banner + queued badge; Superhuman queues sends with visible "will send when online". Ink & Switch ideal #1/#3 imply user-visible confidence.
- **PWA feasibility:** PWA-today.
- **COMPVSS status:** PARTIAL. `<SyncBanner>` reports a combined pending count and `OUTBOX_EVENT` refreshes chrome immediately — good. Gaps: no per-item state on the record itself (a queued punch looks identical to a synced one after submit), no failure surface when a replayed row is rejected server-side (a 4xx on drain = row dropped or stuck, invisibly), and the localStorage tier's "write lost rather than throwing" fallback is silent loss by design.

### 5. Cache with provenance: show data age when serving stale
- **Pattern:** Field apps that serve cached reads stamp them ("as of 10:42, offline") so a gate lead never acts on silently stale occupancy/roster data. This is standard in field-service design guidance and in offline-first UX writing (stale-while-revalidate + freshness indicator).
- **PWA feasibility:** PWA-today.
- **COMPVSS status:** PARTIAL. The SW already stamps `x-sw-cached-at` on runtime-cache entries — the plumbing exists — but no visible "data as of" treatment on served-stale pages was evident. Cheap win: read the header client-side and render an age chip when it's present.

---

## B. PWA vs native decision frame (2025–26)

### 6. The 2026 decision frame: PWA until a required capability forces Capacitor; native only when the platform is the product
- **Pattern:** Consensus frame: (a) PWA when web APIs cover the need — cheapest distribution, instant updates, one codebase; (b) Capacitor when you need native APIs (reliable push on iOS, NFC, background location, biometrics, widgets) *without* leaving the web codebase — same app, wrapped; (c) full native only when performance/platform integration is the product. The dominant 2025-26 motion is *hybrid adoption*: ship PWA, add Capacitor selectively.
- **Evidence:** ourcodeworld.com/articles/read/3646 (PWA vs Capacitor vs Native 2026); mobiloud.com/blog/progressive-web-apps-ios; capgo.app on PWA→Capacitor.
- **COMPVSS status:** ALIGNED. COMPVSS is exactly on this curve: PWA shipped, Capacitor wrapper acknowledged as the packaging path (WEB_APP_STRATEGY §1 "Capacitor over compvss.atlvs.pro/m", KIT_CANON's native permission prompts, `pro.atlvs.compvss` bundle id reserved, `cap sync` in Phase 5). The known NFC-impossible-in-WebView finding already matches the industry frame (NFC = Capacitor plugin territory; Web NFC is Android-Chrome-only and absent in iOS Safari/WKWebView).

### 7. iOS PWA reality check: push/badging work but only when installed; EU carve-outs; no install prompt
- **Pattern & evidence (2026 state):** iOS 16.4+ home-screen web apps get Web Push (APNs-backed, must be user-visible) and the Badging API (requires notification permission). Hard limits remain: push/badging only for *installed* apps (Safari tab gets nothing); no `beforeinstallprompt` — install is a manual Share→Add-to-Home-Screen; ~50MB opaque cache limits and evictable storage; no Web Bluetooth/NFC/background geolocation/Background Sync; in the EU DMA fallout, iOS home-screen web apps briefly regressed to Safari-tab shortcuts (restored, but the episode is the canonical platform-risk citation). Sources: magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide, webscraft.org PWA-push-iOS-2026, developer.apple.com forums re beforeinstallprompt.
- **Implication:** leaders treat *iOS installed-PWA* as a distinct support tier and instrument it (`display-mode: standalone` media query + `navigator.standalone`).
- **COMPVSS status:** PARTIAL. Web push with per-kind opt-outs is implemented (leader-grade preference model); SW registered only on the compvss origin (correct scoping). Unverified/likely gaps: no dedicated iOS add-to-home-screen education flow (the conversion surface iOS demands), no Badging API usage found in skim, no installed-vs-tab telemetry split. Push *reliability* on iOS field devices (Apple may coalesce/throttle web push; delivery is best-effort) is the strongest single argument for the Capacitor wrapper: native APNs push is materially more reliable for time-critical crew calls.

### 8. Tailored install prompting: `beforeinstallprompt` deferral on Android, educational overlay on iOS, prompt at a value moment
- **Pattern:** Capture `beforeinstallprompt`, `preventDefault()`, and re-offer install from an in-app button at a moment of demonstrated value (after first successful shift check-in, not on first paint). On iOS, a platform-detected educational banner walking through Share→Add to Home Screen. Track `appinstalled` + standalone sessions.
- **Evidence:** web.dev/learn/pwa/installation-prompt; love2dev beforeinstallprompt guide.
- **PWA feasibility:** PWA-today.
- **COMPVSS status:** UNKNOWN/LIKELY GAP — no install-prompt orchestration surfaced in the skim; the kit onboarding flow (splash→OTP→Rose) is the natural home for a "put COMPVSS on your home screen" step, and for field crews install-rate is a precondition for push at all on iOS.

---

## C. Performance budgets

### 9. Cold-start and LCP budgets set on mid-range Android, enforced in CI
- **Pattern:** Leaders budget against the P75 *mid-range Android* device (Pixel-4a/Moto-G class), not flagships: cold start (TTID) < 2s, LCP < 2.5s on 4G/mid-device, JS bundle budgets per route, and regression gates in CI (Lighthouse CI / size-limit). Field-app twist: budgets must hold on venue Wi-Fi/congested LTE, so leaders test under throttled network profiles.
- **Evidence:** uxcam.com performance-metrics 2026 (2,000ms cold-start budget mid-tier; ≤10ms budget per new feature), digia.tech app-startup guide, Core Web Vitals thresholds (LCP 2.5s, INP 200ms at P75).
- **PWA feasibility:** PWA-today (web is actually easier to budget-gate than native).
- **COMPVSS status:** PARTIAL. Repo history shows perf-adjacent discipline (loading.tsx×26 added to fix perceived lag, table virtualization planned in WEB_APP_STRATEGY Phase 5) but no evidence of numeric budgets or a Lighthouse/bundle-size CI gate for the `/m` shell. Server-component pages mean network-bound navigations — precisely what mid-range-Android budgets punish.

### 10. Tap-to-feedback < 100ms via optimistic UI; INP < 200ms
- **Pattern:** Any tap acknowledges within 100ms (perception threshold) even if completion takes longer: optimistic state flip + skeleton/spinner only past ~300ms. INP (the Core Web Vital that replaced FID) good-threshold is 200ms at P75, and mobile INP runs 60–80% worse than desktop — leaders chase main-thread yield, not just bundle size. Optimistic writes are the mechanism that decouples feedback from RTT.
- **Evidence:** hashmeta.com INP guide 2025, simonhearne.com/2021/optimistic-ui-patterns, speedcurve INP explainer.
- **PWA feasibility:** PWA-today.
- **COMPVSS status:** PARTIAL. Offline-queued flows are optimistic by construction (enqueue = instant ack). But most `/m` mutations are Next server actions with `useActionState` — feedback waits on the round trip unless the pending UI is instant; the 26 loading.tsx additions treat navigation, not in-page action latency. No INP monitoring (RUM) found.

### 11. Skeletons, perceived-performance choreography, and offline-tolerant navigation
- **Pattern:** Standard leader kit: route-level skeletons matching final layout (no CLS), stale-while-revalidate for shell chrome, prefetch of likely-next routes, and animation only where it masks latency.
- **COMPVSS status:** STRONG on skeletons (Skeleton primitives + `.ps-skel` shimmer + the loading.tsx sweep); SWR-style freshness handled by SW network-first-with-cache-fallback for HTML. Prefetch discipline unverified.

---

## D. Push notification strategy

### 12. Notification taxonomy with per-category opt-outs — user-controlled, honored server-side
- **Pattern:** Leaders categorize every notification into a typed taxonomy (transactional/operational vs digest vs promotional), expose per-category toggles, and enforce them at send time server-side (not client filtering). Slack's granular per-channel/keyword preferences are the reference implementation.
- **Evidence:** Braze/OneSignal 2026 best-practice guides; userpilot push-best-practices.
- **COMPVSS status:** STRONG — this is a leader-grade implementation: `PushKind` on every send, `notification_kind_catalog` as the SSOT the `/m/settings/notifications` matrix renders from, `sendPushTo/Bulk` short-circuiting opted-out users server-side, `kind` omitted only for non-disableable system pings. (Known defect from memory: `notify()` gates on a retired ui_state store, killing 7 time/pay events — the *architecture* is right, one code path is dead.)

### 13. Quiet hours, frequency caps, and digest collapsing
- **Pattern:** Hold non-urgent pushes in a user-local quiet window (e.g. 22:00–07:00), cap sends/day, collapse bursts into digests that elevate one high-signal item. Field-ops twist: *show-day override* — during an active event, operational pushes (crew call, gate incident) bypass quiet hours; the leaders model urgency as a per-category attribute, not a global setting.
- **Evidence:** OneSignal 2026 guide (hold 22:00–07:00 local, ≤3/day), reteno.com digest guidance.
- **PWA feasibility:** PWA-today (server-side scheduling).
- **COMPVSS status:** GAP. Per-kind opt-out exists; quiet hours, caps, digesting, and urgency tiers do not (no evidence in the matrix). For a live-event product, the show-day-override version of this is a differentiator that fits the existing `show_day_mode` flag.

### 14. Every push deep-links to the actionable record
- **Pattern:** Tap → the exact record with the action affordance ready (approve, acknowledge, navigate) — never the app home. On the web this means the push payload carries a canonical URL and the SW `notificationclick` focuses-or-opens it; leaders also add action buttons on the notification itself (approve/decline inline).
- **COMPVSS status:** MOSTLY THERE presumed (payloads carry record context; verify each `sendPushTo` call site passes a URL). Notification *action buttons* (Web Push supports them on Android; iOS web push does not) — unexploited.

---

## E. Home-screen / widget / App-Intents surface area

### 15. Glanceable OS surfaces: widgets, App Intents, app shortcuts, badges
- **Pattern:** iOS leaders expose capabilities through App Intents once and get Siri, Spotlight, interactive widgets, Control Center, and Shortcuts "for free" (WWDC 24/25 direction; iOS 26 widens the surfaces). Android equivalents: Glance widgets + app shortcuts (long-press). For a field app the natural widgets are: next shift / clock-in state, today's schedule, open-incidents count. Icon badging = the minimum viable glanceable surface.
- **Evidence:** developer.apple.com WWDC24 10210 (App Intents), blakecrosley.com iOS-26 widget surface, Android appwidgets docs.
- **PWA feasibility:** **Capacitor/native only** for widgets and App Intents (no web API exists or is on a standards track). PWA-today: Badging API (`navigator.setAppBadge`) works on installed iOS 16.4+/Android PWAs; Web App Manifest `shortcuts` gives long-press quick actions on Android (ignored on iOS).
- **COMPVSS status:** GAP (known: no widgets). PWA-cheap wins available now: manifest `shortcuts` (Clock in · Scan · Inbox), `setAppBadge` for unread inbox/pending approvals. Widgets/App Intents are the strongest *feature* argument (after push reliability and NFC) for the Capacitor build.

---

## F. Auth for frequent re-entry + shared devices

### 16. Passkeys/biometric unlock for frequent re-entry; long sessions with step-up
- **Pattern:** Leaders minimize re-auth friction: long-lived refresh sessions + biometric-gated re-entry (Face/Touch ID) and passkeys replacing passwords. On the web, WebAuthn passkeys work in installed PWAs on iOS/Android today (synced via iCloud Keychain/Google Password Manager); "biometric app-lock on foreground" (the banking-app pattern) is native/Capacitor territory (`capacitor-native-biometric`). 2026 consensus: passkey adoption is now table stakes for frontline suites.
- **Evidence:** getflip.com/blog/passkey-login (frontline passkey guide 2026), corbado.com passkeys-vs-local-biometrics.
- **PWA feasibility:** Passkeys = PWA-today (WebAuthn). Foreground biometric lock, credential-in-secure-enclave = Capacitor.
- **COMPVSS status:** GAP (known: no biometrics). Auth is the kit OTP/email flow + Supabase cookie sessions. Passkey enrollment after first OTP login is shippable in the PWA now and is the single highest-leverage auth upgrade for muddy-thumb field re-entry.

### 17. Shared-device / kiosk session model
- **Pattern:** Deskless leaders support a *shared-terminal mode*: a device-bound kiosk session with fast user switching (badge/QR/PIN per action), per-action attribution, aggressive idle logout, and no personal credential resident on the shared device. FIDO's answer is cross-device passkey auth (QR + proximity) or server-side identity-bound biometrics; workforce products ship "kiosk clock-in" as a distinct app mode. Android "dedicated device" (lock task) mode / iOS Single App Mode handle the OS layer for owned hardware.
- **Evidence:** oloid.com shared-device passkeys guide; Flip frontline passkey guide (QR sign-in on borrowed terminals).
- **PWA feasibility:** Session model + QR-per-action = PWA-today (COMPVSS's Rose flip-to-QR with single-use refresh-on-open token is exactly the right primitive). OS-level kiosk pinning = MDM/native.
- **COMPVSS status:** GAP (known: no kiosk). Notably the buddy-punch finding from the repo's own audit (checkin gated on `time:write` with no owner check) is the exact class of bug a per-action-attribution kiosk model prevents. The Rose credential + scan endpoints mean much of the substrate exists; missing is a kiosk shell (device session, roster switcher, idle reset).

---

## G. Field capture excellence

### 18. Camera-first capture: photo as the primary record, metadata auto-attached
- **Pattern:** The CompanyCam-class pattern: capture is one tap from anywhere; the photo *is* the record — GPS + timestamp + project auto-attached at capture, then context (checklist item, incident, asset) is layered on. Report generation flows *from* capture, never the reverse. Legally-defensible = verifiable capture-time metadata.
- **Evidence:** companycam.com photo-documentation guide; goaudits/sitecapture roundups; photoidapp.net markup guide.
- **PWA feasibility:** PWA-today for `getUserMedia`/`<input capture>`, EXIF-preserving upload, and geolocation-at-capture (foreground). Gaps vs native: no background upload of large batches when the app closes (iOS), no camera hardware controls; Capacitor Camera plugin fixes both.
- **COMPVSS status:** PARTIAL. `docs/compvss/PHOTO_CAPTURE_BACKLOG.md` exists (capture is a known workstream); scan flows (QR/barcode via camera) are strong. A universal "capture" affordance in the tab bar / ActionBar with auto-context is the leader move.

### 19. Photo annotation/markup before submit
- **Pattern:** Draw arrows/circles/text on the photo at capture time (canvas overlay), because context decays in minutes on a job site. Standard in every leading inspection app.
- **PWA feasibility:** PWA-today (canvas). 
- **COMPVSS status:** GAP — no markup surface found; belongs in the incident/asset photo flows. Cheap: a shared `<PhotoMarkup>` sheet (kit Sheet grammar) writing a flattened image.

### 20. Voice input and dictation as a first-class field input
- **Pattern:** Field workers type badly in gloves/rain; leaders offer voice on every long-text field (incident narrative, daily log). Baseline: OS keyboard dictation works in PWAs for free. Next tier: in-app speech capture with the Web Speech API (SpeechRecognition — Chromium + iOS Safari 14.5+, quality varies, requires network on most platforms) or recorded-audio→server Whisper.
- **PWA feasibility:** Baseline PWA-today; high-quality/offline recognition = server-side Whisper (PWA-today via MediaRecorder upload) or on-device via Capacitor plugin.
- **COMPVSS status:** GAP — no voice affordance found beyond OS keyboard defaults.

### 21. Structured-first forms: minimize typing with pickers, defaults, scan-to-fill
- **Pattern:** Field-app guidance is unanimous: replace typing with taps — pickers, chips, smart defaults from context (project, location, last entry), scan-to-fill (barcode → asset form). 
- **COMPVSS status:** STRONG — the kit's FormScreen ≤5-field sheet rule, searchable picker threshold (>8 options), cost-code picker drawers, and UPC scan-to-fulfill are exactly this discipline.

---

## H. AI in mobile field apps

### 22. Voice-to-structured-report: dictate → structured form fields
- **Pattern:** The 2025 breakout field-AI pattern ("Voice to Form", Salesforce; InspectFast/Inspect Genie): tech speaks a natural summary; the system maps it to the structured form. Architecture consensus: *transcription on-device or at-edge* (predictable latency, works offline), *semantic field-mapping server-side* (LLM). Photos auto-linked to voice notes by timestamp.
- **Evidence:** engineering.salesforce.com "Delivering low-latency voice-to-form AI in real-world field conditions"; inspectfast.ai 2025 guide.
- **PWA feasibility:** Hybrid: record + upload + server LLM mapping = PWA-today (Anthropic API already integrated in the repo); true on-device transcription = Capacitor/native (or wait for on-device Web Speech / WebGPU Whisper, which is still not field-reliable on mid-range Android).
- **COMPVSS status:** GAP with substrate ready. Aurora (AI tab + chat) exists as a preview; the incident/daily-log/inspection forms + `ai/chat` streaming route are the pieces; missing is the voice-capture → schema-mapped-draft flow. This is the most differentiating near-term AI investment for a field product.

### 23. AI answers grounded in org data, with citations and confidence, never auto-applied
- **Pattern:** Leaders' mobile assistants act as retrieval over the user's operational data ("when is my call time", "what's the rigging SOP") with visible sourcing; suggestions require human confirmation for any mutation. On-device vs server split: server for anything org-scoped (RLS must apply); on-device only for private drafting.
- **COMPVSS status:** ALIGNED in principle — the console's "Copilot Suggests" rail is explicitly derived-counts/never-auto-applies, and the theme ships an AI surface kit (`kit-ai.css` with citation/confidence primitives). Aurora's grounding depth on `/m` unverified.

---

## I. Accessibility & environment

### 24. Environmental ruggedness: glove-size targets, sunlight contrast, one-handed reach, haptics
- **Pattern:** Field leaders exceed the HIG 44pt / Material 48dp floors for primary actions (56px+ for gloved use), hold AAA-ish (7:1) contrast for critical text in sunlight, keep primary actions in the bottom thumb zone, avoid gesture-only affordances (wet/gloved swipes fail — always a button alternative), and use haptics + sound as confirmation channels when the screen is unreadable (`navigator.vibrate` is Android-only on the web; iOS haptics need native).
- **Evidence:** team400.ai field-service design patterns; deliveredsocial field-app design; Apple HIG/Material touch-target guidance.
- **PWA feasibility:** All PWA-today except iOS haptics (Capacitor Haptics plugin).
- **COMPVSS status:** STRONG on fundamentals — 44px floor *enforced by a font-floor/inline guard*, fixed-dark high-contrast surfaces, bottom tab bar + bottom-sheet grammar = thumb-zone-correct, AA contrast machine-checked (`contrast.test.ts`). Gaps: no oversized "glove mode" density option (the density axis — compact/cozy/spacious — is the natural carrier), no haptic confirmations, dark-only field surfaces are good at night but *light/max-brightness* mode is what direct sunlight actually wants — worth a "daylight" appearance toggle.

### 25. One-tap emergency and degraded-mode paths
- **Pattern:** Safety-critical field apps keep the emergency card and core day-of info (schedule, site map, contacts) reachable in ≤1 tap and cached offline unconditionally — the "it must work when everything else is broken" tier.
- **COMPVSS status:** MOSTLY THERE — emergency card is a canonical full-screen kit surface; verify it (and the guide/`/m/guide`) is in the SW precache tier rather than runtime-cache-lottery (current precache is only `/offline.html` + manifest, so a never-visited emergency card is NOT available offline — real gap given auth-redirect constraints; consider an unauthenticated static emergency/venue-info page that can be precached, or client-side cache-on-login).

---

## J. Adoption metrics & telemetry

### 26. Activation defined as first *field value*, not signup; TTFV instrumented
- **Pattern:** Leaders define an activation event that equals real value (first clock-in, first completed task, first scan — not account creation), measure time-to-first-value from invite, and treat onboarding as the funnel to that event. Deskless twist: activation often happens on day 1 of an event, so TTFV is measured in minutes and the invite→first-action path must survive a parking-lot cell connection.
- **Evidence:** whatfix product-adoption metrics 2026; userpilot activation guides.
- **COMPVSS status:** GAP — audit_log + notifications exist but no product-analytics layer (no event taxonomy, no funnels) was evident for `/m`. The kit onboarding flow gives clean funnel step boundaries already.

### 27. Retention measured on schedule-aware cohorts (deskless D30 ≠ consumer D30)
- **Pattern:** Consumer D30 benchmarks (~5–11% by vertical) mislead for deskless tools: crew usage is *shift-shaped* — the honest metrics are WAU/scheduled-worker, usage-on-shift-days, and org-level seat activation, plus D30 for habit surfaces (inbox, feed). Leaders segment retention by role and by event-cycle phase.
- **Evidence:** prooflytics/plotline D7-D30 benchmarks (and their explicit caveat that category context dominates); pushwoosh retention 2026.
- **COMPVSS status:** GAP — same missing analytics layer; the schedule data to compute "of crew scheduled today, % who opened /m" is all in-house (shifts, assignments), which is an advantage over generic tools.

### 28. Privacy-respecting telemetry: opt-in/masked, self-hosted-capable, aggregate-first
- **Pattern:** 2025-26 leader posture: product telemetry with PII masking by default, EU-friendly hosting or self-host (PostHog pattern: load opted-out, opt in on consent), autocapture restrained to interaction metadata, and feature-flag/adoption tracking tied to the event taxonomy. Web-vitals RUM (LCP/INP per route on real field devices) rides the same pipe.
- **Evidence:** posthog.com/docs/privacy; respectlytics minimal-collection argument.
- **PWA feasibility:** PWA-today.
- **COMPVSS status:** GAP — no RUM/product analytics found; recommend one taxonomy doc (events named like `m.clock.punch`, `m.scan.accepted`) + PostHog-style opt-in wiring + web-vitals reporting, respecting the existing per-kind-preference philosophy the push system already demonstrates.

---

## Summary scorecard (COMPVSS vs leader bar)

| # | Practice | COMPVSS | Path |
|---|----------|---------|------|
| 1 | Local-first read replica | GAP (biggest architectural delta) | PWA-today (IndexedDB replica for schedule/tasks/assignments) |
| 2 | Durable outbox + idempotent replay | STRONG | verify server idempotency keys |
| 3 | Server-reconciliation conflicts | ADEQUATE (append-only writes) | needed only if offline edits arrive |
| 4 | Sync-status transparency | PARTIAL | per-item state + failure surface |
| 5 | Stale-data provenance | PARTIAL (header exists) | render age chip |
| 6 | PWA→Capacitor decision frame | ALIGNED | continue hybrid path |
| 7 | iOS installed-PWA tier | PARTIAL | badging, standalone telemetry; Capacitor for reliable push |
| 8 | Install prompt orchestration | GAP | onboarding step + iOS education |
| 9 | Mid-range-Android budgets in CI | PARTIAL | numeric budgets + Lighthouse gate |
| 10 | <100ms tap feedback / INP | PARTIAL | optimistic action states + RUM |
| 11 | Skeleton choreography | STRONG | — |
| 12 | Per-category push opt-outs | STRONG (leader-grade) | fix dead notify() path |
| 13 | Quiet hours / digests / show-day override | GAP | high-fit differentiator |
| 14 | Deep-link-to-action pushes | MOSTLY | Android action buttons |
| 15 | Widgets / App Intents / badging | GAP | manifest shortcuts + setAppBadge now; widgets = Capacitor |
| 16 | Passkeys + biometric re-entry | GAP | WebAuthn passkeys = PWA-today |
| 17 | Kiosk / shared-device sessions | GAP | Rose QR substrate exists |
| 18 | Camera-first capture | PARTIAL (backlog exists) | universal capture affordance |
| 19 | Photo markup | GAP | canvas sheet, cheap |
| 20 | Voice input on long fields | GAP | Web Speech / MediaRecorder |
| 21 | Structured-first forms | STRONG | — |
| 22 | Voice-to-structured-report | GAP (Aurora substrate ready) | record→Whisper→LLM field-map |
| 23 | Grounded, confirm-before-apply AI | ALIGNED in principle | deepen Aurora grounding |
| 24 | Glove/sunlight/one-hand/haptics | STRONG fundamentals | glove density, daylight mode, haptics (Capacitor for iOS) |
| 25 | Offline emergency tier | GAP (precache too thin) | precacheable emergency/site page |
| 26 | TTFV/activation instrumentation | GAP | event taxonomy + funnel |
| 27 | Schedule-aware retention cohorts | GAP | usage-on-shift-days metric |
| 28 | Privacy-respecting telemetry + RUM | GAP | opt-in PostHog-pattern + web-vitals |

**Key sources:** inkandswitch.com/essay/local-first · replicache.dev · stack.convex.dev/object-sync-engine · powersync.com/blog (local-first series, ElectricSQL comparison) · magicbell.com PWA-iOS-limitations 2026 · ourcodeworld.com PWA-vs-Capacitor-vs-Native 2026 · web.dev/learn/pwa/installation-prompt · uxcam.com performance-metrics 2026 · hashmeta.com INP guide · onesignal.com push best practices 2026 · braze.com push articles · developer.apple.com App Intents (WWDC24) · getflip.com frontline passkey guide 2026 · oloid.com shared-device passkeys · companycam.com photo documentation · engineering.salesforce.com voice-to-form · inspectfast.ai voice inspections 2025 · team400.ai field-service design patterns · whatfix.com adoption metrics · prooflytics.io D7/D30 benchmarks · posthog.com/docs/privacy.
