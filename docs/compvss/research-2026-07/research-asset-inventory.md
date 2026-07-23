# Asset / Inventory / Maintenance mobile best practices — market research for COMPVSS

Researched 2026-07-23. Vendors surveyed: Sortly, EZOfficeInventory (EZO), Asset Panda, MaintainX,
UpKeep, Limble, Cheqroom, Flex Rental Solutions, Current RMS, Samsara, ShareMyToolbox,
Zebra, Scandit. Repo baseline skimmed: `src/app/(mobile)/m/{assets,inventory,scan}`,
`src/lib/db/assignments.ts`, `docs/compvss/KIT_CANON.md`.

**COMPVSS baseline (known / verified in repo):** unified `assets` store (gear/fleet/lot +
qty + disposition), `assignment_scan_codes` (barcode/qr/nfc/rfid/wristband_serial, O(1)
active-code lookup), UPC scan-to-fulfill, camera scanner (`/m/scan`, `/m/inventory/scan`),
HID-wedge RFID, field custody take/return (`/m/inventory` CustodySheet →
`moveAssetCustody`, writes `assets` because `asset_movements` was unwritable from the
field), offline queue plumbing (`OfflineSyncBanner`/`WillSyncChip`/`SyncBadge`),
`fulfillment_state` FSM with issued→transferred→redeemed→returned arc, append-only
`assignment_events` journal. NFC impossible in the current Capacitor WebView; no label
printing, no cycle counts, no PM triggers.

---

## A. Check-out / check-in & custody

### 1. Scan-to-checkout / scan-to-return as the primary flow (not forms)
- **Interaction:** point camera at the item's QR/barcode → item card appears → one tap
  confirms checkout to the current user + due date; return is the same scan in reverse.
  Forms are the fallback, never the front door.
- **Exemplars:** Cheqroom ("a quick scan of the QR code confirms the checkout instantly";
  scan to confirm pickup, scan again on return), Sortly (scan to check items in/out and
  update quantities → "perpetual inventory"), EZO, Flex ("scanning automatically updates
  status with every scan, every movement time-stamped").
- **Evidence:** cheqroom.com/features/equipment-checkout-software, sortly.com/barcode-inventory-system,
  flexrentalsolutions.com/features/warehouse-scanning.
- **Dependency:** camera-scan PWA fully feasible (getUserMedia + wasm decoder or native
  BarcodeDetector); no hardware needed.
- **COMPVSS gap:** PARTIAL. Scanner + scan codes + UPC scan-to-fulfill exist; custody
  take/return exists in `/m/inventory` but is sheet-driven off the list row, not
  scan-driven end-to-end. Wire `/m/scan` resolve → CustodySheet/checkout as the default
  landing action per disposition.

### 2. Explicit custody chain with an "accept" handshake
- **Interaction:** assigning or field-transferring a tool fires a push to the receiver,
  who must tap **Accept** before responsibility moves; admins may enable auto-accept per
  person. Every hop is a ledger row.
- **Exemplars:** ShareMyToolbox (the signature pattern: "confirmation of transfer is
  always put in the hands of your field team"; alert → "tap accept"; auto-accept toggle),
  Cheqroom (logs full chain of custody with signatures).
- **Evidence:** sharemytoolbox.com/tool-inventory-app/how-it-works,
  help.sharemytoolbox.com "Loan, Borrow, Transfer, and Return Items",
  cheqroom.com/features/assignment-custody.
- **Dependency:** pure app logic + push; PWA-fine (web push already wired via `sendPushTo`).
- **COMPVSS gap:** GAP. Custody moves are unilateral (`moveAssetCustody` writes
  immediately). The `fulfillment_state` `transferred` state + `assignment_events` journal
  are the natural home for a pending-accept hop; no accept/decline handshake or
  transfer-push exists.

### 3. Condition capture at every handoff (photos + flags + e-signature)
- **Interaction:** at checkout and especially at return, the flow prompts for condition:
  comments, photos ("as many pictures as required"), a damage flag, optional signature.
  A flag auto-ties borrower + checkout event to the record and can spawn a work
  order/repair ticket so damaged gear never silently re-enters rotation.
- **Exemplars:** Cheqroom (condition photos/flags/signature at every custody step; flag →
  work order), Samsara DVIR (defect selection + photos with per-vehicle photo limits, AI
  real-time checks of photo quality/duration/location).
- **Evidence:** cheqroom.com/capabilities/mobile-app, cheqroom.com/features/assignment-custody,
  kb.samsara.com DVIR 2.0 articles.
- **Dependency:** camera capture is PWA-fine (`<input capture>` / getUserMedia); signature
  pad is canvas. Storage bucket exists (Supabase).
- **COMPVSS gap:** GAP. No condition-photo or signature step in CustodySheet or any
  assignment transition; `assignment_events` `comment`/`scan` kinds could carry a photo
  ref but no UI prompts for it. Damage flag → incident/work order link absent (incidents
  exist at `/m/incident` but aren't asset-anchored from the custody flow).

### 4. Due-back dates with proactive nudges + overdue escalation
- **Interaction:** every checkout carries a due-back; the system notifies *before* the
  deadline (push/SMS/email/Slack), with custom timing and escalation for overdue items;
  overdue list is a first-class operator lens.
- **Exemplars:** Cheqroom ("overdue returns drop dramatically when reminders go out
  before the deadline, not after"; automated overdue reminders), EZO ("who has what and
  when it's due back").
- **Evidence:** cheqroom.com/features/equipment-scheduling-software, cheqroom blog
  "equipment checkout workflows"; ezo.io features.
- **Dependency:** server-side scheduler + push; zero client hardware. COMPVSS already has
  the automations schedule worker (`/api/v1/internal/automations/schedule`) and the
  advance-deadline T-5/T-2 ladder as a proven pattern.
- **COMPVSS gap:** GAP. Assignments/custody carry no due-back timestamp surfaced with
  nudges; no overdue lens. Mirror the kit-27 `advance_deadline_events` pattern.

### 5. Cart / batch checkout (many items, one custody event)
- **Interaction:** scan item after item into a "cart", then one confirm checks the whole
  cart out to a person/job with one due date; mass actions (check-in, reserve, retire)
  operate on the cart.
- **Exemplars:** EZO Carts module ("check out or reserve multiple items together,
  barcode scanner adds items directly to the Current Cart"; Bundles require Carts),
  Flex (pick list validation), Cheqroom multi-item checkouts.
- **Evidence:** faq.ezofficeinventory.com mobile-application category, ezo.io mobile-app
  guide PDF.
- **Dependency:** app logic only; PWA-fine.
- **COMPVSS gap:** PARTIAL. Kit-30 Advance Cart exists for catalog fulfillment, but there
  is no scan-accumulating cart in `/m/scan` / `/m/inventory` for bulk custody moves.

## B. Scanning UX

### 6. Continuous / batch scanning with on-screen tally (no re-arm between scans)
- **Interaction:** scanner stays live; each decode beeps/vibrates, overlays a check on
  the code, increments a visible tally list; duplicates are rejected with a distinct
  cue. AR overlay shows which codes are captured vs still needed (pick-list mode).
- **Exemplars:** Scandit MatrixScan Count/Find (IF Design Award for UX; "shows users
  which barcodes have been captured and which still need to be scanned"; batch scanning
  "reduces mistakes and fatigue"), Flex live picking-list validation ("validates every
  item picked against the job's packing list in real time"), Current RMS Companion app
  (live picking list while scanning).
- **Evidence:** scandit.com/products/matrixscan, docs.scandit.com batch-scanning,
  flexrentalsolutions.com warehouse-scanning, current-rms.com Companion App.
- **Dependency:** single-code continuous scan is PWA-feasible (Scandit Web SDK explicitly
  supports PWAs via wasm; native BarcodeDetector on Android Chrome). True multi-code
  MatrixScan-style AR needs a commercial SDK (Scandit/Dynamsoft web builds exist) —
  license cost, not hardware.
- **COMPVSS gap:** PARTIAL. Camera scanner exists; unknown/absent: continuous mode with
  tally + duplicate cue + against-a-list validation. High-value for load-out/load-in.

### 7. Scan feedback trifecta: viewfinder + haptic + audio, never one channel alone
- **Interaction:** dark overlay with a clear cutout/aimer sized to teach hold distance;
  on decode: brief highlight of the scanned area + subtle beep + vibration (works in
  loud venues and for gloved users); restrictable scan area when labels are crowded;
  tap-anywhere to resume scanning.
- **Exemplars:** Scandit UX guidance, CodeCorp/Zebra scanner feedback doctrine (haptics
  for noisy industrial environments).
- **Evidence:** Scandit developer docs + blog scanning-UX guidance, codecorp.com
  "barcode scanner feedback".
- **Dependency:** PWA-fine — Vibration API (Android; iOS Safari lacks it → rely on
  audio+visual), WebAudio beep, CSS overlay.
- **COMPVSS gap:** UNKNOWN/PARTIAL — audit `/m/scan` for aimer overlay, haptic, audio,
  duplicate-scan cue; kit canon has no scanning-feedback spec.

### 8. Hardware-wedge compatibility as a free tier of "pro scanning"
- **Interaction:** any screen with a scan field accepts keyboard-wedge input from
  Bluetooth ring scanners / sleds; wearables free both hands during picks. Zebra claims
  up to 30% productivity lift; customer case 40% faster picking.
- **Exemplars:** Zebra RS5100/RS6100 ring scanners + WT6300 wrist computer; Flex
  ("dedicated hardware for RFID and high-volume operations").
- **Evidence:** zebra.com RS5100 product page + ring-scanner FAQ, cssi.com Zebra wearable
  writeups, flexrentalsolutions.com/flex-rfid-tracking-software.
- **Dependency:** HID wedge works in any web app (keystrokes); no native code. RFID bulk
  read (hundreds of tags/sec) needs dedicated readers — COMPVSS already does HID-wedge RFID.
- **COMPVSS gap:** MOSTLY COVERED (HID wedge landed, universal-capture project). Gap is
  making every quantity/count field wedge-armed, not just the scan screens.

### 9. Offline scan queue with visible sync state
- **Interaction:** scans, photos, signatures, and audit results store locally when
  offline; a banner/chip shows queued count; sync on reconnect with an explicit
  prompt/confirmation. Pre-sync ("download this location's data before entering the
  dead zone") is offered for known-bad coverage.
- **Exemplars:** Asset Panda (offline audits: pre-sync asset data, scan/photo/sign/note
  entirely offline), MaintainX (offline mode + prompt to sync on reconnect), Limble
  (offline work orders, auto-sync), Flex (online/offline scanning, syncs when
  connectivity returns), Samsara DVIR 2.0 (full inspection offline).
- **Evidence:** help.assetpanda.com audit articles, help.getmaintainx.com mobile
  overview, limble.com/products/mobile-app, kb.samsara.com DVIR 2.0.
- **Dependency:** PWA-fine (IndexedDB + service worker; COMPVSS is offline-first already).
- **COMPVSS gap:** PARTIAL. Sync banner/queue components exist; verify scans + custody
  moves + photos actually enqueue (vs failing) and add a "pre-load this location" affordance.

## C. Labels & identification

### 10. Label generation + printing driven from the item record
- **Interaction:** select items → choose label size/fields → produce a print-ready PDF
  (Avery sheets on office printers) or push direct to a thermal printer; mobile printers
  print "when and where you need them" (belt/toolbox printers on site). Also: attach an
  *existing* third-party barcode to a record by scanning it (no re-labeling).
- **Exemplars:** Sortly (PDF label generator, standard + thermal printers; "scan and
  connect existing QR codes or barcodes"), Zebra/Brother mobile thermal printers
  (Wi-Fi/Bluetooth from phones), Asset Panda tagging.
- **Evidence:** help.sortly.com "Create QR Code and Barcode Labels" + "Scan and Connect
  Existing…", zebra.com/products/printers/mobile, brothermobilesolutions.com.
- **Dependency:** PDF-from-web is trivially PWA-feasible (print dialog / AirPrint).
  Direct Bluetooth thermal printing is NOT reachable from a WebView without a native
  plugin (Web Bluetooth is absent on iOS); Wi-Fi printers with an HTTP/IPP path or a
  server-side print bridge are the PWA-compatible route.
- **COMPVSS gap:** GAP (known: no label printing). Cheapest v1: server-rendered label-PDF
  endpoint for `assignment_scan_codes` / asset tags + "connect existing code" flow (the
  scan-codes table already models多 codes per assignment — attach is a natural fit).

### 11. One durable code per unit, quantity codes per SKU (identity model)
- **Interaction:** serialized units get unique per-unit labels; bulk stock gets one
  SKU-level code + quantity prompts on scan; UPCs on purchased goods are first-class
  (scan the manufacturer code, auto-populate the record).
- **Exemplars:** Sortly (scan UPC → auto-populate item details), EZO (assets vs
  asset-stock split), Current RMS (serialized vs non-serialized).
- **Evidence:** sortly.com barcode pages, ezo.io features.
- **COMPVSS gap:** COVERED — `asset_class` gear/fleet/lot + qty + UPC scan-to-fulfill
  (org_id,gtin14 PK) already implement exactly this split.

## D. Structure: kits, containers, locations

### 12. Kits/containers as first-class scannable objects with completeness verification
- **Interaction:** a case/kit has its own code; scanning the kit moves all contents
  (permanent containers) or a packed manifest (temporary containers emptied on
  book-out); on return a "kit spotcheck" walks the contents so incomplete kits can't
  drift back into circulation; RFID reads a whole closed case in seconds.
- **Exemplars:** Current RMS (temporary vs permanent containers for flight cases),
  Cheqroom (kit builder + kit spotcheck; RFID bulk kit-bag scan), EZO Bundles.
- **Evidence:** current-rms.com warehouse-management, knowledge.cheqroom.com
  "Use and Manage Spotchecks", cheqroom.com/rfid.
- **Dependency:** data model + UI; PWA-fine.
- **COMPVSS gap:** GAP. No container/kit hierarchy on `assets` or `master_catalog_items`
  (no parent_id/kit membership found in canon docs); no kit-verify flow. Notable schema
  lift (kit table or self-FK + manifest verify UX).

### 13. Location-scoped views and location-scan-first discipline
- **Interaction:** every stock operation starts by scanning the *location* label (bin,
  truck, room), then items — binding each action to a place; item lists are filterable
  to "what should be here".
- **Exemplars:** cycle-count doctrine (RFgen/RF-SMART: "make location verification a
  required first step"), EZO location audits, Flex (warehouse→truck→venue tracking).
- **Evidence:** rfgen.com cycle-counting best practices, faq.ezofficeinventory.com.
- **Dependency:** printable location labels + scanner routing; PWA-fine.
- **COMPVSS gap:** GAP/PARTIAL. `locations` table exists; no evidence of scannable
  location codes or location-first scan flows in /m.

### 14. Cycle counts / audits by location with variance reconciliation
- **Interaction:** operator opens an audit for a location → scans everything present →
  app shows found / missing / unexpected → one tap reconciles the system to reality
  (with an audit trail); scheduled small counts (ABC method) replace disruptive
  full physical counts; offline supported.
- **Exemplars:** Asset Panda mobile audits ("scan and verify whether an item is present
  at a certain location… update the list to reflect actual inventory"), EZO location
  audits, Cheqroom Spotchecks, Sortly cycle-count guidance.
- **Evidence:** help.assetpanda.com Create/Perform an Audit on Mobile,
  sortly.com/blog/how-to-perform-an-inventory-cycle-count, netsuite.com cycle-counting 101.
- **Dependency:** continuous scan + diff logic; PWA-fine.
- **COMPVSS gap:** GAP (known: no cycle counts). The strongest single addition for the
  warehouse-lot side of the unified assets store; `assignment_events`/`asset_movements`
  give the reconciliation ledger for free.

## E. Maintenance & incidents

### 15. Photo-first issue reporting anchored to the asset code
- **Interaction:** "snap a photo of broken equipment and assign it to a technician" —
  or scan the asset's QR (or visit its URL) to open a report form; anyone can report
  without an account/deep nav. The report lands as a work-request tied to the asset.
- **Exemplars:** UpKeep (photo-first request), Limble ("anyone can scan a QR or bar
  code, or visit a URL to submit an issue"), Cheqroom (flag → work order/ticket).
- **Evidence:** upkeep.com mobile-cmms page, limble.com, cheqroom.com capabilities/tracking.
- **Dependency:** PWA-fine; QR-deep-link route + camera input.
- **COMPVSS gap:** PARTIAL. `/m/incident/new` express one-field quick-file exists and
  `/m/snags` exists, but neither is scan-anchored to an asset record; no
  scan-code → "Report a problem with THIS asset" path.

### 16. Mobile work-order execution: asset history, parts, checklists, close-out in the field
- **Interaction:** technician opens the WO on phone → sees asset history, docs, and
  required parts (with source bin, one-tap "staged") → completes checklist → attaches
  photos/voice notes → logs time and consumed parts → closes out on device. Parts
  consumption decrements inventory and auto-reserves against min/max reorder points.
- **Exemplars:** MaintainX (kit/stage WO parts, per-part source location, voice notes,
  "award-winning technician usability"), UpKeep (parts min/max thresholds, auto-reserve
  on WO, "100% mobile completion"), Limble (technician-first mobile app relaunch 2025).
- **Evidence:** help.getmaintainx.com mobile overview, upkeep.com product pages,
  limble.com PR "technician-first mobile app".
- **Dependency:** PWA-fine (voice notes via MediaRecorder).
- **COMPVSS gap:** GAP. No maintenance work-order object at all (tasks ≠ WOs: no asset
  link, no parts consumption, no checklists tied to assets). Adjacent: `/m/inspections`,
  `/m/snags`, `fabrication_orders` on the studio side.

### 17. Preventive-maintenance triggers: time, meter, and condition
- **Interaction:** PM schedules fire work orders by calendar, by meter readings
  (hours/miles logged from mobile or telematics), or condition/IoT data; the mobile app
  is where meters get read (scan asset → enter reading). Fleet flavor: DVIR defects
  auto-create maintenance items; telematics feed odometer/engine-hours automatically.
- **Exemplars:** UpKeep ("schedule PMs by time, meter readings or condition data"),
  Limble PM scheduling, Samsara (defect → maintenance workflow; telematics-fed meters).
- **Evidence:** upkeep.com, limble.com/products/cmms, samsara.com/products/telematics/dvir.
- **Dependency:** scheduler + meter model; PWA-fine (telematics integration = API-side).
- **COMPVSS gap:** GAP (known: no PM triggers). Fleet assets (`asset_class='fleet'`) have
  no meter/odometer field surfaced; the automations schedule worker is the natural engine.

### 18. Guided vehicle/equipment inspections (DVIR pattern) with quality enforcement
- **Interaction:** pre-/post-use inspection: walk a defect checklist per asset class,
  select defects, describe, photograph (bounded photo counts), sign; app validates
  photo quality, time-on-task, and location in real time; works fully offline; defects
  route to mechanics and block "safe to operate" status until resolved.
- **Exemplars:** Samsara DVIR 2.0 (AI checks of photos/duration/location; offline;
  3-4 photo limits), fleet-compliance norm (FMCSA DVIR).
- **Evidence:** kb.samsara.com DVIR articles, samsara.com driver-app pages.
- **Dependency:** PWA-fine except AI photo QC (server-side inference is fine).
- **COMPVSS gap:** PARTIAL. `/m/inspections` exists (generic); not asset-class-templated,
  not gating a fleet unit's operable state, no defect→repair chain.

## F. Availability & planning

### 19. Reservation calendar with hard conflict blocking
- **Interaction:** users self-serve reserve gear against a day/week/month calendar; the
  system *refuses* a second reservation of the same serialized unit for overlapping
  windows ("physically won't allow two people to reserve the same serial number"),
  flags checked-out items unavailable, and shifts scheduling responsibility from admin
  to requester. Reservations convert to checkouts by scan at pickup.
- **Exemplars:** Cheqroom (real-time conflict detection + blocking; calendar sync),
  EZO reservations via carts, Current RMS availability engine (shortage alerts, sub-rent
  to cover shortages).
- **Evidence:** cheqroom.com/features/reservations-scheduling +
  equipment-booking-software, current-rms.com warehouse-management.
- **Dependency:** availability math + calendar UI; PWA-fine. COMPVSS has scheduler/slot
  math precedent (kit 27 `slots.ts`) and `v_catalog_inventory` for counts.
- **COMPVSS gap:** GAP. Assignments allocate but there's no time-windowed reservation
  layer over assets/catalog with conflict blocking; no availability calendar in /m.

### 20. Quarantine / disposition lane for damaged-lost-in-service gear
- **Interaction:** damaged or missing items go to a quarantine state that *subtracts
  them from bookable availability* immediately; book-out from quarantine only via
  explicit repair/return-to-service action; lost items follow a separate write-off path.
- **Exemplars:** Current RMS Quarantine ("stock levels reflect items booked into
  quarantine so they aren't booked onto jobs"), Cheqroom flag→maintenance rotation-block.
- **Evidence:** help.current-rms.com quarantine articles.
- **Dependency:** state model only.
- **COMPVSS gap:** PARTIAL. `disposition` facet on assets exists (kit 20 Phase A) — verify
  dispositions subtract from availability everywhere counts render, and that a field
  damage flag can flip disposition without studio access.

### 21. Everything-is-a-ledger: append-only movement/event history on the asset
- **Interaction:** the asset detail's spine is its history — every scan, custody hop,
  state change, comment, photo, audit result as time-stamped rows; audit reports answer
  "who had it, when, where" without reconstruction.
- **Exemplars:** Flex (time-stamped every movement), ShareMyToolbox audit reporting,
  Cheqroom "airtight audit trail", Asset Panda history.
- **COMPVSS gap:** MOSTLY COVERED (`assignment_events`, `asset_movements`) — but the
  field custody action writes `assets` directly because `asset_movements` was unwritable
  from the field (per `/m/inventory/actions.ts` comment): the ledger has a hole exactly
  where custody physically changes hands. Fix the RLS/write path so field moves land in
  the ledger.

### 22. Role-shaped home: "my stuff" vs "manage stock" split
- **Interaction:** crew see *their* checked-out items, due-backs, and accept requests
  front and center; managers see overdue, low-stock/min-max alerts, audit due, and
  utilization. Alerts are actionable (tap → the record), not dashboards.
- **Exemplars:** ShareMyToolbox (field vs admin split), UpKeep (min/max + reorder
  alerts), Sortly (low-stock alerts), Cheqroom (overdue lens).
- **COMPVSS gap:** PARTIAL. `/m/advances` + wallet cover "my entitlements"; no
  "my custody items + due-backs" card, no low-stock/overdue manager lens in /m.

---

## Priority read (impact × fit for a camera-scan PWA)
1. **Cycle counts by location** (#13, #14) — pure software, huge honesty win for lots.
2. **Condition photos + damage flag → incident at handoff** (#3, #15) — closes the
   custody quality loop; all primitives exist.
3. **Due-back + overdue nudges** (#4) — reuse the kit-27 deadline-event ladder.
4. **Accept-handshake transfers** (#2) — `transferred` state + push already exist.
5. **Continuous batch scan with tally + list validation** (#6) — load-in/out killer
   feature; feasible in-browser, best with a commercial wasm SDK.
6. **Label PDF + attach-existing-code** (#10) — server-side PDF avoids the Bluetooth
   printing wall; direct thermal printing needs a native plugin.
7. **Kits/containers + kit spotcheck** (#12) — biggest schema lift, defer-able.
8. **Reservations with conflict blocking** (#19) and **PM/meter triggers** (#17) —
   larger products; PM matters once fleet assets carry meters.
Also fix: custody writes bypass the movement ledger (#21).
