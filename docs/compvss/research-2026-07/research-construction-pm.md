# Field-ops mobile best practices — construction management + PM SaaS leaders

Research date: 2026-07-23. Sources: vendor docs/support, press, third-party reviews (cited inline).
Repo grounding: `docs/compvss/KIT_CANON.md`, `WEB_APP_STRATEGY.md`, `PHOTO_CAPTURE_BACKLOG.md`,
`SCANNING_UNIVERSAL_CAPTURE_PLAN.md`, `src/app/(mobile)/m/**` (60+ surfaces incl. daily-log,
daily-report, punch, snags, inspections, incidents, scan, check-in, clock, my-work, templates,
briefings). COMPVSS reality: offline-first PWA (service worker + outbox queue, replay-while-
mounted only; photo queue wired to daily-log only), kit-34 view engine, UPC scan-to-fulfill,
receipt OCR, geotagged photos, per-kind push opt-out matrix, Capacitor native wrapper exists,
NFC impossible in the WebView, RFID = HID wedge.

Legend — PWA feasibility: **PWA-OK** (works in the current WebView/PWA), **PWA-partial**
(works with caveats), **Native-only** (needs the Capacitor wrapper or a real native module).

---

## A. Offline & sync

### 1. Explicit "take this project offline" bundle, scoped by what you need
- **What:** A deliberate pre-download step: pick a project, choose what to cache (current
  sheet set, files, photos — not all versions of everything), see an "On Device" badge.
  Procore's guidance is literally "prepare your device by downloading everything you'll need
  offline"; ACC/PlanGrid persists per-project download options across syncs and recommends
  downloading only the current set.
- **Exemplars:** Procore (offline FAQ), Autodesk Build/PlanGrid ("Sync and Download
  Projects"), Fieldwire (full offline at all paid tiers).
- **Evidence:** Universal convergence — every construction leader ships this exact flow;
  ACC documents it as the #1 mobile best practice.
- **Why it wins:** Field connectivity is unpredictable (basements, tunnels, festival grounds
  with saturated cells). Trust that "my stuff is on the phone" is the precondition for
  adoption; a lazily-cached PWA that only has what you happened to visit fails at the moment
  of need.
- **Feasibility:** PWA-OK — Cache Storage + IndexedDB + a per-project prefetch manifest;
  needs `navigator.storage.persist()` and a size budget UI.
- **COMPVSS:** **Missing.** SW caches visited routes; there is no user-facing "download this
  event for offline" action or on-device indicator per project.

### 2. Offline mutation queue that drains in the background, with visible sync state
- **What:** Create/edit anything offline; changes queue and auto-sync on reconnect without
  the user re-opening the originating form. Sync state is always visible (pending count,
  per-item status). monday.com supports ~70% of board actions offline; Fieldwire syncs tasks,
  photos, checklists made in "concrete cores and elevator shafts."
- **Exemplars:** Fieldwire, Procore, ACC/PlanGrid, monday.com mobile.
- **Evidence:** Convergence across all six construction leaders + monday; Fieldwire markets
  "an hour saved daily" tied to offline continuity.
- **Why it wins:** The alternative is silent data loss, which kills trust permanently
  (COMPVSS's own PHOTO_CAPTURE_BACKLOG names this defect class: "the app reporting success
  while keeping nothing usable").
- **Feasibility:** PWA-partial — Background Sync API is Chromium-only; on iOS WebView the
  queue must drain on app-open/visibilitychange from a global drainer, not per-form. Fully
  doable, just not while the app is closed.
- **COMPVSS:** **Partial.** Outbox queue exists but replay only runs while the originating
  form is mounted; photo-blob queueing is wired to daily-log only — incidents, lost-found,
  handover, market still fail hard offline (safety-critical gap, per the backlog).

### 3. Offline forms/inspections with auto-save, from a template library
- **What:** Checklists/inspections completable fully offline with per-answer auto-save;
  templates pre-built (SafetyCulture ships 100k+ templates) and assignable to sites/shifts.
- **Exemplars:** SafetyCulture (iAuditor), ACC (QA/QC + safety checklists in the field app),
  Fieldwire forms.
- **Evidence:** SafetyCulture: 75,000+ organizations, >1B checks/year — the most-adopted
  inspection app; offline auto-save is its core mechanic.
- **Why it wins:** Inspections happen where signal doesn't (docks, plant rooms, stages under
  steel roofs); a half-finished inspection that survives an app kill is table stakes.
- **Feasibility:** PWA-OK (IndexedDB draft persistence per answer).
- **COMPVSS:** **Partial.** `/m/inspections` + `/m/templates` exist; offline draft
  persistence beyond daily-log is not wired.

---

## B. Capture speed (the adoption make-or-break)

### 4. The 3-tap capture budget
- **What:** Any core field capture (photo, punch item, timer start) completes in ≤3 taps
  from app-open. Legacy systems take 7+ steps; the winners collapse it.
- **Exemplars:** CompanyCam (open → camera → shoot, auto-filed), Raken, Fieldwire.
- **Evidence:** Third-party field-app guides converge on "crew has ~30 seconds of patience";
  apps with one-tap workflows report 60–80% higher crew adoption than desktop-first systems
  (Projul/DroneDeploy field guides). This is the single most-repeated adoption claim across
  the category.
- **Why it wins:** Every extra tap between opening the app and finishing documentation
  increases the skip rate; superintendents log dozens of items per walkthrough.
- **Feasibility:** PWA-OK — design discipline, not tech.
- **COMPVSS:** **Partial.** Kit has Fab/ActionBar and drawers ("pick/confirm in <10s"
  rule), but no audited tap-budget for the top 5 captures (photo, incident, punch, clock,
  scan). Worth an explicit per-flow tap count in the kit canon.

### 5. Voice-first capture: talk-to-text everywhere, video-walk → structured items
- **What:** (a) Voice dictation on every long-text field of daily logs (Raken, Buildertrend
  "talk-to-text"). (b) Procore Quick Capture: record a video during a punch walk, narrate
  what you see; audio is transcribed and auto-populates each punch item's title/description,
  photo frames attached.
- **Exemplars:** Procore (Quick Capture, iOS + Android), Raken, Buildertrend.
- **Evidence:** Procore's published testing: voice-enabled punch cuts field capture/logging
  time by **at least 50%**, creates punch items **3× faster**. Raken's whole pitch is
  reports "in under 5 minutes" partly via voice.
- **Why it wins:** Gloves, dirt, sun glare, one free hand. Speaking is the only input mode
  that survives real site conditions; it also raises documentation *quality* (people say
  more than they type).
- **Feasibility:** PWA-partial — keyboard dictation comes free on iOS/Android; Web Speech
  API is inconsistent in WebViews, but MediaRecorder + server-side transcription (the repo
  already has an Anthropic pipeline) is PWA-OK. The video→items flow is a server AI feature,
  not a native one.
- **COMPVSS:** **Missing.** No voice capture on any form; no walk-and-talk → punch/snag
  pipeline. High-leverage given `/m/punch` + `/m/snags` + the existing AI integration.

### 6. Photo-first, zero-filing capture (GPS auto-assigns the project)
- **What:** Open app → camera is the primary action → shoot → photo auto-files to the right
  project by GPS proximity, auto timestamped/geotagged, auto-synced. No project picker, no
  form.
- **Exemplars:** CompanyCam (the entire product), Procore (GPS-stamped logs/photos).
- **Evidence:** CompanyCam's category leadership is built on exactly this; "your crew
  doesn't need to select a project — it figures out which job site they're at."
- **Why it wins:** Filing friction is why photos stay on camera rolls and never become
  records. Removing the single "which project?" decision converts every crew phone into a
  documentation device.
- **Feasibility:** PWA-OK — geolocation + a project→venue-geofence table; camera via input
  capture/getUserMedia (already in use).
- **COMPVSS:** **Missing.** Photos are geotagged but nothing maps GPS → project/venue to
  auto-file; capture always starts from a form, not from a camera-first surface.

### 7. Before/after pairing with ghost overlay
- **What:** When shooting an "after," the prior "before" renders as a translucent overlay in
  the viewfinder so framing matches; pairs are linked and export side-by-side.
- **Exemplars:** CompanyCam (ghost overlay, iOS + Android).
- **Evidence:** Single-vendor but heavily used in restoration/trades marketing; strong fit
  for venue load-in/load-out condition documentation (damage disputes).
- **Feasibility:** PWA-OK (position a semi-transparent `<img>` over the getUserMedia
  preview).
- **COMPVSS:** **Missing.** Directly valuable for venue condition walks (pre-rig vs
  post-strike) and rental damage claims.

### 8. Photo annotation/markup before submit
- **What:** Arrow/circle/text markup on a photo in-line at capture time (flag the exact
  cracked truss bolt), synced as part of the record.
- **Exemplars:** PlanGrid/ACC (markups sync automatically), Procore ("photos and markups
  sync instantly"), Buildertrend (annotate job site photos), CompanyCam.
- **Evidence:** Convergence — all six construction leaders ship photo markup.
- **Feasibility:** PWA-OK (canvas overlay; flatten to JPEG on save).
- **COMPVSS:** **Missing** (no annotation layer found in `src/components/mobile/**`).

---

## C. The daily log / report engine

### 9. Accretive daily reporting: build the report during the day, not at 5pm
- **What:** The daily log is an always-open accumulator — tap in crew counts, photos, notes,
  delays as they happen; the "report" is just the day's accumulation sealed at end of shift.
  Target: complete report in <5 minutes.
- **Exemplars:** Raken (the defining example), Buildertrend, Procore daily log.
- **Evidence:** Raken users publish "2 hours a day saved" (superintendent testimony);
  quality improves because nobody reconstructs the day from memory at a notepad.
- **Why it wins:** End-of-day recall is the #1 source of thin, late, or fabricated logs;
  in-the-moment micro-entries fix quality and completion rates simultaneously.
- **Feasibility:** PWA-OK.
- **COMPVSS:** **Partial.** `/m/daily-log` (+ offline photo queue) and `/m/daily-report`
  exist; verify the UX is accretive (append-all-day, one-tap re-entry from Home) rather
  than a single end-of-day form.

### 10. Auto-filled context: weather, GPS, date, crew carry-forward
- **What:** The log pre-fills everything the phone/server already knows: weather snapshot
  (auto-logged at fixed times), location, date, yesterday's crew list carried forward for
  one-tap confirm.
- **Exemplars:** Raken (auto weather), Buildertrend (auto location + weather), Procore
  (GPS-stamped logs/timecards).
- **Evidence:** Convergence; weather auto-capture is a compliance artifact (delay-claim
  evidence) every construction vendor ships.
- **Feasibility:** PWA-OK (server-side weather API keyed off venue coords).
- **COMPVSS:** **Partial.** Weather appears in daily-log code; carry-forward of crew/roster
  and auto-context breadth unverified — audit for one-tap "same as yesterday."

### 11. Branded, client-ready PDF artifact generated from field data
- **What:** One tap turns the day's log/inspection into a professional, logo-branded PDF
  emailed/shared to clients — the field worker never formats anything.
- **Exemplars:** Raken (weekly emailed reports forwarded to clients), SafetyCulture
  (share professional reports instantly), Buildertrend.
- **Evidence:** Raken/SafetyCulture both cite this as a primary retention feature; "client-
  delighting detail" is Raken's press framing.
- **Feasibility:** PWA-OK (server render; repo already has render-html + documents system
  + white-label `data-brand`).
- **COMPVSS:** **Partial.** ShareSheet export is real (code-audit remediation) and the
  studio Documents/Reports engines exist; the one-tap field-side "send today's branded log
  to the client/promoter" path from `/m` is not evident.

### 12. Bulk-scheduled recurring safety content pushed to the field (toolbox talks)
- **What:** Office pre-schedules a season of safety talks (from a 100+ item library or
  custom uploads); each lands in the foreman's app on the right morning with sign-off
  capture (attendance + signatures) as the record.
- **Exemplars:** Raken Toolbox Talks; SafetyCulture Heads Up is adjacent.
- **Evidence:** Raken press: "significantly reduces time and labor of routine safety
  discussions"; bulk-schedule at company or project level.
- **Feasibility:** PWA-OK.
- **COMPVSS:** **Partial.** `/m/briefings` + `/m/coc` + signature capture exist; no
  library + bulk-scheduling + attendance-signature loop as one machine.

---

## D. Location & spatial anchoring

### 13. Tasks/issues pinned to a location on a plan or map
- **What:** Drop a task/punch/snag pin directly on the floor plan or site map; the record
  carries its spatial location; crews browse work spatially ("what's near me / in this
  zone") not just as lists.
- **Exemplars:** Fieldwire (the core mechanic), Procore (punch items placed on drawings),
  PlanGrid/ACC (link info to sheet locations).
- **Evidence:** Strongest convergence in the category; Fieldwire's "hour saved daily" claim
  is anchored to plan-based task management.
- **Why it wins:** In a venue, "where" is half the task ("FOH riser, stage left, dock 3").
  Spatial context kills the back-and-forth of describing locations in prose.
- **Feasibility:** PWA-OK for image-based floor plans (pan/zoom + normalized x/y pins);
  Native-only if you want giant vector CAD sheets at 60fps (see #21).
- **COMPVSS:** **Missing on mobile.** Studio has a floorplan component (kit v7) and
  `/m/spaces` exists, but punch/snags/incidents don't carry plan-pin coordinates.

### 14. Geofenced time clock: prompt, don't auto-punch
- **What:** A geofence around the site triggers a clock-in reminder on entry and clock-out
  prompt on exit; punches record GPS (and optionally a photo) as evidence. The mature
  pattern is *prompt + evidence*, not silent auto-punching (consent/labor-law hazards).
- **Exemplars:** ClockShark (reminds, doesn't auto-clock), busybusy (GPS + photo on punch),
  Buildertrend (geofenced attendance verification).
- **Evidence:** Category guides (Workyard) note geofence-verified hours "reduce disputes";
  also flag GPS sampling (10–15 min intervals) as insufficient for certified payroll —
  i.e., verify the tap, don't promise a breadcrumb trail.
- **Feasibility:** PWA-partial — geolocation on-open is fine; *background* geofence
  triggers need the native wrapper (Capacitor geofence plugin). Foreground prompt-on-open
  ("you're at Hialeah — clock in?") is PWA-OK and captures most of the value.
- **COMPVSS:** **Partial.** Geofence code exists in `/m/time` + `/m/clock`; entry/exit
  reminders and photo-on-punch (buddy-punch defense — see the shift-punch-ownership memory)
  unverified/likely missing.

### 15. Field-initiated RFIs/requests anchored to context
- **What:** A foreman drafts an RFI/question from the field in the moment — from a photo or
  a plan location — with offline-cached read access to existing RFIs so answers are
  available at the work face.
- **Exemplars:** Procore (RFIs downloadable for offline; create from mobile), Fieldwire.
- **Evidence:** Procore lists RFIs among the four things to pre-download for offline —
  treating *answers in the field* as the point of the tool.
- **Feasibility:** PWA-OK.
- **COMPVSS:** **Missing on mobile.** RFIs live in the studio (record-ref chips reference
  `rfis.code`); `/m/requests` exists for intakes but there's no field RFI thread with
  offline read.

---

## E. Personal spine, notifications, PM interaction patterns

### 16. My Work: one personal aggregation across every module
- **What:** A single surface unioning everything assigned to *me* — tasks, approvals,
  shifts, forms due — so a worker never navigates the org's structure to find their day.
- **Exemplars:** monday.com My Work, Asana My Tasks, ClickUp Home, Fieldwire "my tasks"
  filtering.
- **Evidence:** Universal convergence across PM leaders; monday support frames it as "stop
  jumping between boards."
- **Feasibility:** PWA-OK.
- **COMPVSS:** **Exists.** `/m/my-work` (+ studio `/studio/my-work`). Keep it the default
  landing intent; audit that every assignable object type in `/m` feeds it.

### 17. Global quick-add: create anything from anywhere in ≤2 taps
- **What:** A persistent "+" (FAB or nav slot) opening a type-picker → minimal form
  (title + smart defaults), creatable from any screen, offline-safe. Asana/ClickUp extend
  it to lock-screen/home-screen widgets ("create task" without opening the app).
- **Exemplars:** Asana (Quick Add incl. from widget), ClickUp (Create task/reminder
  widgets), monday.
- **Evidence:** Convergence across all PM leaders; it's the mobile analog of the studio's
  "One Front Door."
- **Feasibility:** PWA-OK in-app; widget entry points are Native-only (see #19).
- **COMPVSS:** **Partial.** Kit has a Fab; a canonical global "+" with the Request-first
  intake set (mirroring studio CreateMenu) isn't established as an every-screen affordance.

### 18. Notification discipline: route by consequence, not by event
- **What:** Linear's three-tier model — (1) interrupt/push only for things requiring *you*
  (assigned, mentioned, blocking); (2) ambient in-app for watched activity; (3) digest for
  everything else. Inbox is a triage queue (done/snooze/unsubscribe per item), not a feed.
  The design principle: notification *trust* beats notification engagement — over-pushing
  gets the whole channel muted.
- **Exemplars:** Linear (inbox + triage), Asana Inbox (bundling + daily summaries).
- **Evidence:** Linear's published design writing + docs; widely cited as the discipline
  benchmark.
- **Why it wins in the field:** Crew phones are pocketed during shows; every false push
  spends the credibility needed for the one push that matters ("show-stop incident",
  "your call time moved"). An urgency tier that survives Do-Not-Disturb (critical alerts)
  only works if everything else stays quiet.
- **Feasibility:** PWA-partial — web push works (installed PWA on iOS 16.4+); iOS
  *critical/time-sensitive* alert classes are Native-only.
- **COMPVSS:** **Partial.** Per-kind opt-out matrix exists (`/m/settings/notifications`)
  — that's user-side control. Missing: sender-side tiering (which kinds push vs land
  in-app only vs digest), an actionable triage inbox, and note the memory finding that
  `notify()` gates on a retired store so 7 time/pay events never push at all (live defect).

### 19. Home/lock-screen widgets for glanceable state + zero-open capture
- **What:** Widgets showing today's tasks/shift/next call time, plus interactive quick-add
  or punch-clock buttons on the home screen.
- **Exemplars:** Asana (My Tasks widget + quick-add), ClickUp (Today + create widgets).
- **Evidence:** Both vendors ship and market them; adoption numbers unpublished.
- **Feasibility:** **Native-only** — widgets are impossible from a PWA on iOS/Android; the
  existing Capacitor wrapper (`pro.atlvs.compvss`) can host WidgetKit/Glance extensions,
  but that's real native code + App Store round-trips (same cost class as NFC, which the
  scanning plan already ruled expensive).
- **COMPVSS:** **Missing;** defensible to defer. If the wrapper ever takes native modules,
  "next call time + clock-in" is the one widget worth building.

### 20. Push → deep link → actionable record (approve/acknowledge inline)
- **What:** Every push lands the user on the exact record with the primary action one tap
  away (approve time-off, acknowledge briefing); mobile OS notification actions where
  possible.
- **Exemplars:** Asana, monday, Linear; Buildertrend client approvals.
- **Evidence:** Convergence; the pattern is the difference between notification-as-signal
  and notification-as-work.
- **Feasibility:** PWA-OK for deep links (SW `notificationclick` routing); notification
  action buttons work in web push on Android, limited on iOS.
- **COMPVSS:** **Partial.** Push carries kinds; verify every kind's click lands on the
  record with the action armed (ApprovalsQuickSheet exists — wire pushes into it).

---

## F. Platform/architecture lessons

### 21. Heavy document/drawing viewing is where the leaders went native
- **What:** Every construction leader (Procore, ACC, Fieldwire) ships fully native apps,
  and the load-bearing reason is the sheet viewer: huge vector drawings with 60fps
  pan/zoom + offline tiles + markup. Category analyses agree PWAs now cover camera, GPS,
  offline storage — but concede complex offline-first field tools and heavy-canvas viewers
  to native.
- **Evidence:** Zero construction leaders ship PWA-only; PWA-vs-native analyses (2025–26)
  single out field-service/drawing tools as the native holdout.
- **COMPVSS implication:** The PWA choice is sound for COMPVSS's current surfaces (forms,
  lists, scan, photos — all PWA-viable). The line to not cross without the native wrapper:
  CAD-scale plan viewers, background geofencing, widgets, NFC (already established). For
  venue maps, image-tile floor plans (#13) stay comfortably inside PWA limits.

### 22. Scan-first, honestly scoped (don't ship cosmetic modes)
- **What:** Barcode/QR as the universal identity + asset primitive, decoding all
  symbologies at the gate; never advertise capture modes the platform can't deliver.
  (Procore/ACC use QR for equipment/locations; SmartBarrel et al. use face/PIN kiosks
  where phones are absent.)
- **Evidence:** COMPVSS's own universal-capture plan found 3 of 4 scanner modes cosmetic
  and NFC fake-animated — the anti-pattern the leaders avoid by scoping claims to
  capability.
- **Feasibility:** PWA-OK (shipped); NFC Native-only; RFID via HID wedge (shipped).
- **COMPVSS:** **Exists/strength** (UPC scan-to-fulfill, universal decode). Remaining
  practice to adopt: a **shared-device kiosk mode** (site tablet: PIN/QR punch-in for
  crew without the app — SmartBarrel/Raken kiosk pattern). `/m/door` is a gate scanner,
  not a self-serve crew kiosk. Status: **missing**.

---

## Priority reading (highest leverage × lowest lift for COMPVSS)
1. **#2 global background-ish queue + extend photo queue past daily-log** — closes the
   safety-critical offline gap already documented in-house.
2. **#5 voice capture** (dictation on forms now; walk-and-talk punch via existing AI later)
   — the single biggest published time-savings number in the category (≥50%).
3. **#6 GPS auto-filing photo-first capture** — geotags already exist; add venue geofences
   + a camera-first entry point.
4. **#18 notification tiering + fix the dead `notify()` push path** — trust is the asset.
5. **#1 explicit offline bundles per event** — converts "PWA that caches" into "app the
   crew trusts underground."
6. **#13 plan-pinned punch/snags** — image floor plans, PWA-safe, high venue relevance.

## Key sources
- Procore offline FAQ: https://support.procore.com/faq/can-i-use-procores-mobile-application-offline
- Procore Quick Capture (50% / 3×): https://www.procore.com/press/procore-announces-new-innovation-connecting-construction-with-mobile-personalization-messaging-and-investments-in-ai · https://www.procore.com/project-management/punch-list
- ACC/PlanGrid sync best practice: https://knowledge.autodesk.com/support/build/learn-explore/caas/CloudHelp/cloudhelp/ENU/Build-Mobile/files/Download-Project-Mobile-html.html · https://www.autodesk.com/blogs/construction/enhance-your-mobile-tech-strategy-with-the-acc-app-previously-plangrid-build/
- Fieldwire task-on-plan + offline + "hour saved daily": https://www.fieldwire.com/blog/field-task-management/ · https://www.fieldwire.com/support/fieldwire-on-mobile/
- Raken daily reports / toolbox talks / "2 hours a day": https://www.rakenapp.com/features/daily-reports · https://www.rakenapp.com/blog/raken-app-streamlining-construction-superintendent-reporting-across-country · https://www.forconstructionpros.com/business/construction-safety/news/21073919/raken-raken-launches-toolbox-talks-feature-within-app
- CompanyCam photo-first/GPS auto-file/ghost overlay: https://companycam.com/blog/beginners-guide-to-companycam · https://companycam.com/resources/blog/best-before-after-photo-tool-for-contractors
- Buildertrend daily logs/geofencing: https://buildertrend.com/app/ · https://buildertrend.com/help-article/daily-logs-on-mobile/
- SafetyCulture scale (75k orgs, 1B checks/yr): https://safetyculture.com/iauditor · https://apps.apple.com/us/app/safetyculture-iauditor/id499999532
- Adoption/tap-budget field guides: https://projul.com/blog/construction-mobile-app-field-guide/ · https://www.dronedeploy.com/blog/how-to-find-site-inspection-tools-that-field-teams-will-actually-use
- Linear notification discipline: https://linear.app/docs/inbox · https://linear.app/docs/triage · https://medium.com/@arjundesigns/linears-notification-system-treats-attention-as-abundant-it-isnt-646f5f44b8ae
- monday My Work / offline (70% of actions): https://support.monday.com/hc/en-us/articles/360019159959-Mobile-app-My-Work · https://support.monday.com/hc/en-us/articles/360017712819-Mobile-app-Offline-Mode
- Asana/ClickUp widgets + quick-add: https://asana.com/inside-asana/widgets · https://help.clickup.com/hc/en-us/articles/6327449951127
- Geofence clock patterns + GPS caveats: https://www.workyard.com/compare/top-geofencing-time-tracking-for-construction-projects · https://www.clockshark.com/tour/geofence-time-tracking
- PWA vs native for field tools: https://edana.ch/en/2026/04/05/can-a-web-app-pwa-really-work-offline-like-a-native-app/ · https://crustlab.com/blog/pwa-vs-native-comparison/
