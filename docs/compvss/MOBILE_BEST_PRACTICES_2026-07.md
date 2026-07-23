# COMPVSS · Mobile SaaS Best Practices — Ranked List + Implementation Plan

**Date:** 2026-07-23 · **Status: RATIFIED 2026-07-23 — owner ruling: fix the
defects now, implement Tier 1 now, Tiers 2-4 to the BACKLOG.** M0 (F1-F3) +
the Tier-1 six are IN EXECUTION. Everything from Rank 7 down, the M2-M4
phases, and decisions D1-D5 constitute the standing backlog; telemetry
(Rank 7) is the recommended first backlog pull since Tier-1 exit metrics
depend on it.

Method: four research passes over the category leaders — construction/PM
(Procore, Autodesk Construction Cloud, Fieldwire, Raken, CompanyCam,
Buildertrend, SafetyCulture + Asana/monday/ClickUp/Linear mobile), workforce
(Connecteam, Deputy, When I Work, 7shifts, Homebase, Workyard, Blink,
Beekeeper, Legion, Quinyx, UKG, Jolt), asset/inventory/maintenance (Sortly,
EZO, Asset Panda, MaintainX, UpKeep, Limble, Cheqroom, Flex, Current RMS,
Samsara, ShareMyToolbox, Scandit/Zebra), and cross-cutting mobile platform
(local-first sync, PWA-vs-native 2026, performance budgets, push discipline,
auth, capture, telemetry). **97 practices cataloged, every one verified
against the actual `/m` codebase** so the ranking below contains only real
gaps. Full evidence + sources: the four `research-*.md` files (scratchpad
artifacts; key sources reproduced in each section here).

## Where COMPVSS already meets or beats the leader bar

Credibility first — these are NOT gaps and need no work: the durable
two-tier offline outbox with idempotent ordered replay; per-kind
server-enforced push opt-outs (ahead of most leaders); geofenced clock with
break punch; structured-first forms; skeleton choreography + loading
boundaries; the 44px touch floor + fixed-dark scan surfaces (glove/sunlight
fundamentals); universal barcode decode + UPC scan-to-fulfill; shift swaps,
feed/kudos/badges, per-audience guides; the PWA→Capacitor hybrid frame the
industry converged on; honest capability claims (the universal-capture audit
already stripped cosmetic scanner modes).

## Fix-now defects (found during research; not features — no review dependency)

| # | Defect | Evidence |
|---|---|---|
| F1 | **Field custody moves bypass the `asset_movements` ledger** — `/m/inventory/actions.ts` writes `assets` directly because the ledger was unwritable from the field. The custody chain has a hole exactly where custody physically changes hands. Fix the RLS/write path. | asset research #21 |
| F2 | **`notify()` push is dead for 7 time/pay events** (gates on the retired `ui_state.notifications` store) — known in memory, still unfixed. | platform research #12 |
| F3 | **The emergency surface is not guaranteed offline** — SW precache holds only `/offline.html` + manifest. A crew member underground cannot rely on evac/crisis codes. Add a precacheable emergency tier. | platform research #25 |

---

## The ranked list

Scoring: **Field impact** (does it change a shift?) × **Evidence** (published
numbers or leader convergence) × **Differentiation** (event-production fit no
horizontal leader has) × **PWA feasibility today**, discounted by effort.

### Tier 1 — Do first (highest leverage, PWA-today, small-to-medium lift)

| Rank | Practice | Exemplars / evidence | Why it wins for event crews | COMPVSS status |
|---|---|---|---|---|
| 1 | **Global offline outbox drainer + photo queue everywhere** — replay regardless of which form is mounted; extend the photo queue beyond daily-log to incidents, lost-found, handover, custody | Procore/ACC/Fieldwire offline doctrine | Incidents and handovers fail hard offline today; "the app the crew trusts underground" is the whole PWA promise | Queue exists; drainer is form-mounted only |
| 2 | **Push discipline engine**: sender-side tiers (interrupt / ambient / digest), quiet hours with a safety-bypass lane, and a **show-day override tier** riding the existing `show_day_mode` | Linear's consequence-tiering; OneSignal/Braze discipline; Deputy/WIW send-taxonomies | Trust is the budget every other notification spends; show-day override is an event-native differentiator no horizontal leader has | Opt-outs leader-grade; sender side absent |
| 3 | **Voice capture, tier 1: dictation on long fields** (MediaRecorder → server transcription; Web Speech unreliable in WebViews) | Procore Quick Capture: **≥50% capture-time cut, 3× faster item creation** — the biggest published number in the category | Gloved hands, moving crews, 2am incident reports | Absent; Anthropic pipeline ready |
| 4 | **Kiosk / shared-device punch mode** (site tablet: PIN/QR self-serve punch for crew without phones) | Deputy, Homebase, WIW, SmartBarrel all ship it | Event-day gate throughput + no-phone day labor; the buddy-punch fix already established the auth discipline it needs | Missing; Rose single-use QR + `/m/door` are the substrate |
| 5 | **Camera-first capture + GPS auto-filing** (shoot first; venue geofence files it — no project picker) | CompanyCam's core adoption mechanic; 60-80% higher crew adoption claimed for one-tap workflows | Photos are the field's native language; COMPVSS already geotags but never auto-files | Partial (geotags exist; no camera-first entry, no venue-geofence table) |
| 6 | **Custody quality loop: accept-handshake transfers + due-back nudges** (push → tap Accept before responsibility moves; T-minus reminders + overdue escalation) | ShareMyToolbox handshake; Cheqroom due-backs | Closes "who has the radio" forever; the `transferred` state, push, and the kit-27 deadline ladder all exist | Missing behaviors on existing primitives |

### Tier 2 — Next (strong evidence, moderate lift)

| Rank | Practice | Exemplars / evidence | COMPVSS status |
|---|---|---|---|
| 7 | **Telemetry foundation**: TTFV/activation event taxonomy (`m.clock.punch`-style), RUM web-vitals, schedule-aware retention (usage-on-shift-days, not consumer D30), privacy-respecting opt-in (PostHog pattern) | Whatfix/PostHog doctrine; needed to MEASURE everything above | No product analytics at all |
| 8 | **Cycle counts by location** (scan location → diff found/missing/unexpected → one-tap reconcile) | Asset Panda, EZO; pure-software | Missing; biggest honesty win for warehouse lots |
| 9 | **Condition photos + damage flag → incident at handoff** | Cheqroom, Samsara DVIR | Missing; all primitives exist |
| 10 | **Clock-out attestation + break/overtime nudges** (dynamic break attestation, missed-break flags, OT-risk alerts) | Deputy Active Attestation | Missing; CA exposure is real money |
| 11 | **Shift acknowledgment receipts + require-confirm targeted announcements** (who has NOT confirmed, one-tap chase) | WIW, Beekeeper, 7shifts | Read-tracking exists; no targeting or confirm-chase |
| 12 | **Passkeys/WebAuthn biometric re-entry** | Flip frontline passkey guidance; PWA-today | Missing |
| 13 | **Batch/continuous scan with live tally + against-list validation** (load-in/out pick lists) | Flex pick lists; Scandit MatrixScan | Single-scan only; wasm SDK feasible, multi-code AR needs a commercial license (owner decision D2) |
| 14 | **Install-prompt orchestration + app badging** (onboarding install step, iOS education screen, `setAppBadge`) | web.dev/MagicBell iOS-PWA doctrine | Missing; iOS push requires installed PWA |
| 15 | **Post-shift 1-tap sentiment** | 7shifts; cheapest engagement signal | Missing |
| 16 | **Sync transparency: per-item outbox state + data-age chip** | Leaders' sync-status UX; header exists for age | Partial |

### Tier 3 — Differentiators (bigger lifts, event-native payoffs)

| Rank | Practice | Exemplars / evidence | COMPVSS status |
|---|---|---|---|
| 17 | **Voice-to-structured-report via Aurora** (walk-and-talk punch/incident: record → transcribe → LLM maps to typed fields → confirm-before-save) | Salesforce field-service voice-to-form; InspectFast; Procore's trajectory | Aurora + Anthropic route are the ready substrate; the marquee Aurora field feature |
| 18 | **Local-first read replica** (IndexedDB for schedule/tasks/assignments; render from device, sync in background) | Linear/Figma/Replicache doctrine — the biggest architectural delta from the leaders | Server-rendered + SW-cache-lottery today |
| 19 | **Plan-pinned punch/snags** (image floor plans, tap-to-pin) | Fieldwire tasks-on-plans ("hour saved daily"); PWA-safe with image plans | Missing; high venue relevance |
| 20 | **Photo annotation/markup canvas** (arrows/circles/text on capture) | CompanyCam, Procore | Missing; cheap |
| 21 | **Personal safety layer**: one-tap panic with live location, silent duress, timed lone-worker check-in with auto-escalation | SafetyLine/SHEQSY 4-part model | Crisis panel is org-level; personal layer missing; foreground PWA-feasible |
| 22 | **Estimated earnings per shift** ("what did I make this run") | 7shifts/WIW; pay visibility = top-3 app-open driver | Rates exist via engagements; no worker-facing display |
| 23 | **Label PDF printing + attach-existing-barcode** | Sortly server-PDF pattern (Bluetooth thermal = native wall) | Missing; attach-existing is a cheap win on `assignment_scan_codes` |
| 24 | **Photo-proof recurring checklists with completion rollup** (require-photo-per-item, scheduled instances) | Jolt, SafetyCulture (75k orgs / 1B checks-yr) | Partial (inspections exist; no enforcement/recurrence/rollup) |
| 25 | **Explicit per-event offline bundles** ("Download this event": schedule, guides, plans, assignments) | Procore/ACC per-project downloads | Partial (SW caching is implicit) |

### Tier 4 — Defer / larger products / native-tier

Kits & container hierarchies + return spotchecks (schema lift) · reservation
calendars with hard conflict blocking · PM/meter triggers (needs fleet meters
first) · GPS breadcrumb/continuous tracking (native, opt-in driver tier at
most) · widgets/App Intents, reliable APNs push, background geofencing,
haptics on iOS, man-down detection (all = the **Capacitor wrapper tier**) ·
earned-wage access (fintech partner) · face-recognition punch (BIPA; ship
photo-attach tier first) · NFC (re-confirmed impossible in the WebView).

---

## Implementation plan (phased; each phase gate-checked and ratcheted per house style)

**M0 · Fix + measure (1 wave).** F1 custody-ledger write path, F2 dead
notify() rewire onto `notification_preferences`, F3 emergency precache tier.
Plus Rank 7 telemetry foundation FIRST so every later phase has a baseline
(taxonomy doc → opt-in wiring → web-vitals RUM → activation funnel).
Ratchets: an emergency-precache guard; a custody-writes-hit-the-ledger test.

**M1 · Trust + capture (the Tier-1 six).** Order: (1) global outbox drainer
+ photo-queue extension → (2) push discipline engine (schema:
`push_tiers` + quiet-hours prefs + show-day override; sender migration) →
(3) dictation tier-1 on the long fields (incident, daily log, handover) →
(4) kiosk mode (new `/m/kiosk` shell, PIN/QR sessions, org-device
registration; reuses the buddy-punch ownership discipline) → (5)
camera-first capture entry + venue-geofence auto-filing (new
`venue_geofences` table) → (6) custody handshake + due-back nudges on the
kit-27 ladder. Exit metrics (from M0 telemetry): offline-replay success
rate, notification opt-out rate delta, capture time per incident, kiosk
punch throughput.

**M2 · Compliance + quality (Tier 2).** Cycle counts; condition-photo
handoffs (damage flag → incident chain); attestation + break/OT nudges;
acknowledgment receipts + require-confirm announcements; passkeys;
install-prompt orchestration + badging; batch-scan v1 (native
BarcodeDetector tally; commercial SDK behind decision D2); post-shift
sentiment; sync-transparency chips.

**M3 · Differentiators (Tier 3).** Aurora voice-to-structured-report (the
flagship; confirm-before-save per the Aurora honesty canon); local-first
read replica for the big three reads (schedule/tasks/assignments) with the
existing outbox as the write path; plan-pinned snags; photo markup; personal
safety layer; per-shift earnings; label PDFs + attach-existing-code;
checklist enforcement/recurrence; per-event offline bundles (subsumes the
replica work).

**M4 · Platform decision gate.** The Capacitor wrapper: reliable iOS push +
badging + widgets + background geofence + haptics in one move, keeping the
web codebase (the strategy docs already anticipate this). Everything in
M0-M3 is PWA-shippable without it; M4 is when the native-tier backlog
justifies the wrapper's operational cost (app-store cadence, review cycles).

## Open owner decisions

| # | Decision | Recommendation |
|---|---|---|
| D1 | Capacitor wrapper timing | After M2: iOS push reliability is the forcing function once push discipline (Rank 2) makes notifications trustworthy enough to matter |
| D2 | Commercial scan SDK (Scandit-class) for multi-code AR batch scan | Defer; ship BarcodeDetector tally first, license only if load-out timing data (M0 telemetry) proves the gap |
| D3 | Analytics vendor (PostHog self-host vs cloud vs in-house events table) | Self-host or in-house table, consistent with the RLS/privacy posture |
| D4 | Face-ID punch stance | Photo-attach tier only; no face recognition (BIPA/consent) |
| D5 | Earned-wage access partnering | Revisit post-M3 with earnings-visibility engagement data |
