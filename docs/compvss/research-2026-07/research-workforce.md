# Workforce-management / deskless-workforce mobile best practices — research findings

Date: 2026-07-23. Scope: Connecteam, Deputy, When I Work, 7shifts, Homebase, Sling, Workyard, Blink, Beekeeper, Legion, Quinyx, UKG/Workday, Jolt. Each entry: practice · exemplars · evidence · rationale · feasibility · COMPVSS gap status. Gap status verified against `src/app/(mobile)/m/**`, `docs/compvss/KIT_CANON.md`, `src/lib/workforce.ts`, `src/lib/time/*`, `src/lib/native/shift-reminders.ts`.

---

## A. Shift UX

### 1. One-tap open-shift claim with optional approval gate
- **Practice:** Unfilled shifts publish to a claimable pool. Two configurable modes: first-tap-wins ("Claim shift") vs approval-gated ("Request shift" → Pending Approval while the manager reviews all requesters). Icon distinguishes the two modes in the list.
- **Exemplars:** Deputy (canonical; Home tab → Available Shifts → Claim/Request), When I Work OpenShifts, Sling, Connecteam, Legion (AI-matched shift claims).
- **Evidence:** Deputy help center documents the dual-mode flow explicitly; Legion reports 66% improvement in on-time punches and 33% retention lift for customers activating self-service scheduling + preferences + comms.
- **Rationale:** Coverage gaps close in minutes without call-arounds; workers feel agency (top retention driver for hourly staff).
- **Feasibility:** Pure CRUD + push; fully PWA-feasible.
- **COMPVSS:** PARTIAL. Manager can "Post As Open Shift" (`/m/scheduler/SchedulerView.tsx` → claimable from the Job Board). Missing: the approval-gated request variant and a dedicated "Available Shifts" entry on the worker's schedule surface (claim currently lives on the Job Board only).

### 2. Shift offer (give away) as distinct from shift swap (trade)
- **Practice:** Three separate verbs: *claim* (open shift), *offer* (I can't work; anyone qualified takes it, no manager approval needed but manager notified), *swap* (I trade one of my shifts for one of yours; optionally approval-gated). Eligibility filtered to qualified/available colleagues only.
- **Exemplars:** Deputy (all three verbs, per-location approval config), When I Work, 7shifts, Sling.
- **Evidence:** Deputy help docs; qualification filtering prevents unqualified coverage (compliance-relevant for credentialed event roles: riggers, medics).
- **Rationale:** Conflating offer/swap forces workers into the heavier flow; the offer path is the most-used escape valve before a no-show.
- **Feasibility:** PWA-feasible; needs a qualification/role predicate (COMPVSS already has crew roles + credentials).
- **COMPVSS:** PARTIAL. `shift_swaps` table + SwapButton exist (`/m/schedule`); the no-trade "offer to pool" variant and qualification-filtered candidate lists are missing.

### 3. Shift acknowledgment / confirm-my-schedule receipts
- **Practice:** When a schedule publishes, each worker taps to acknowledge their shifts; managers see per-person read/confirm state and can chase the unconfirmed. Announcement read receipts follow the same pattern.
- **Exemplars:** When I Work ("Confirming Your Shifts" — bulk acknowledge per week), 7shifts (announcements with read receipts + auto shift reminders), Beekeeper (confirmation campaigns).
- **Evidence:** WIW + 7shifts help docs; read receipts are the #1 cited manager feature in frontline comms comparisons.
- **Rationale:** Kills "I never saw the schedule" no-shows; converts publish → commitment. Especially high-value for event crews assembled per-production.
- **Feasibility:** Trivial PWA (one table + badge).
- **COMPVSS:** MISSING. `/m/schedule` has no acknowledge action (`actions.ts` exports only createScheduleEvent/remindEvent); announcements have `announcement_reads` (read tracking exists) but shifts have no confirm state.

### 4. Schedule-anchored shift reminders (T-minus push/SMS)
- **Practice:** Automatic reminder N minutes before shift start (30 min is the common default), plus "schedule published" and "shift changed" events. Reminder is tied to the clock, not app-open.
- **Exemplars:** 7shifts (automatic shift-reminder notifications), When I Work, Homebase, Connecteam.
- **Evidence:** Universal across all six SMB leaders; frontline comms guides recommend automated 30-min pre-shift notification as one of the few "always send" categories.
- **Rationale:** Highest-utility, lowest-annoyance notification in the category; directly reduces lateness.
- **Feasibility:** PWA push or local scheduled notification (Capacitor); COMPVSS already implements the local-notification variant.
- **COMPVSS:** PRESENT (`src/lib/native/shift-reminders.ts` — schedule-anchored, idempotent local reminders). Gap: no server-side push fallback when the app hasn't been opened recently (local scheduling requires an app open to arm).

## B. Time clock UX

### 5. Geofence-gated punch with map confirmation
- **Practice:** Virtual radius around the venue/site; clock-in allowed (or flagged) only inside it. Punch record stores the GPS stamp; manager timesheet shows punch pins on a map. Soft mode (allow + flag) vs hard mode (block) is configurable per site.
- **Exemplars:** Connecteam (geofence time clock), Homebase, Deputy, Workyard, Timeero.
- **Evidence:** Connecteam markets geofence as a core differentiator; every 2026 "best clock-in app" roundup lists it as table stakes.
- **Rationale:** Kills off-site punching without surveillance-level tracking; the flag-don't-block mode preserves trust while still surfacing anomalies.
- **Feasibility:** PWA-feasible (Geolocation API at punch time only; no background GPS needed).
- **COMPVSS:** PRESENT (clock with geofence policy — `src/lib/time/server.ts`, `time_clock_zones`). Verify soft/hard mode configurability per zone.

### 6. Photo-on-punch (selfie punch) with optional face match
- **Practice:** Camera fires at clock-in/out; photo attaches to the timecard. Two tiers: (a) photo capture for manual review (Homebase tablet clock), (b) face detection/recognition that actively blocks a mismatch (Jolt face-detection toggle, Buddy Punch, When I Work kiosk facial recognition).
- **Exemplars:** Homebase (photo attach, no auto-match), Jolt (face-detection toggle in Time Clock), Buddy Punch, Deputy kiosk (photo capture/Face Unlock).
- **Evidence:** Marketed universally as the buddy-punch killer; Homebase docs are explicit that photo-review-only (no biometric match) is the legally-safer default (BIPA/biometric-consent exposure in IL/TX/WA).
- **Rationale:** Event crews are high-churn strangers — timecard photos give supervisors identity evidence with near-zero friction.
- **Feasibility:** PWA-feasible tier (a): `getUserMedia` capture → storage upload on punch. Tier (b) face *recognition* needs on-device ML (native or WASM) + biometric-consent legal work — do (a) first.
- **COMPVSS:** MISSING (confirmed: no selfie punch). Storage buckets + camera scan surfaces (`/m/check-in` scanner) already exist to build on.

### 7. Offline punch queue with automatic sync
- **Practice:** Punches (with GPS + timestamp) persist locally when there's no signal and sync when connectivity returns; the UI shows queued-vs-synced state honestly.
- **Exemplars:** Connecteam (offline mode saves entries + GPS locally, auto-syncs), Workyard (offline time/location/mileage capture).
- **Evidence:** Both vendors document it; essential for festival grounds, basements, back-of-house steel structures.
- **Rationale:** A time clock that fails without signal is unusable for field crews — this is the trust floor.
- **Feasibility:** PWA-feasible (IndexedDB queue + Background Sync / retry-on-focus).
- **COMPVSS:** PRESENT (offline queue per task brief + PWA offline-first canon). Confirm punch events specifically ride the queue and show queued state.

### 8. Punch-time attestation and exception prompts
- **Practice:** At clock-out, the app dynamically presents the legally-correct attestation ("Did you take your 30-min meal break before hour 5?") based on jurisdiction + schedule + actual punches; captures waivers digitally; flags exceptions (late in, missed break, early out) to the manager immediately. Deputy calls this "Active Attestation" — a real-time lookup of applicable CA law vs schedule vs punch.
- **Exemplars:** Deputy (Active Attestation, break planning, missed-break timesheet flags), Timeero, allGeo; UKG has attestation toolkits at enterprise tier.
- **Evidence:** Deputy's CA compliance page documents the full flow; CA meal/rest premiums are one-hour-pay penalties per violation — the ROI case writes itself.
- **Rationale:** Turns compliance from back-office audit into a 2-tap in-flow interaction; the attestation record is the employer's defense artifact.
- **Feasibility:** PWA-feasible; the hard part is the rules table (start with CA meal/rest + generic configurable rules per org).
- **COMPVSS:** MISSING. Break punch exists; there's no clock-out attestation, waiver capture, or missed-break flagging. Time-correction request exists (`/m/clock/CorrectionRequest.tsx`) — attestation is the natural sibling.

### 9. Continuous-GPS with battery discipline (opt-in tier, not default)
- **Practice:** For mobile/driving roles only: on-the-clock GPS breadcrumbs, drive vs site-time segmentation, mileage derivation — with an explicit battery-saving algorithm and hard stop at clock-out. Positioned as a separate, consented tier above punch-point GPS.
- **Exemplars:** Workyard (proprietary "Meerkat" battery-saving algorithm; per-minute location dataset; auto clock-in on geofence arrival), Timeero.
- **Evidence:** Workyard markets Meerkat by name; competitor reviews note continuous tracking without battery work drains phones and kills adoption.
- **Rationale:** For runner/driver/logistics event roles, mileage + travel time capture is payroll-relevant; but continuous tracking as a default is a trust-killer.
- **Feasibility:** NOT PWA-feasible (background geolocation requires native/Capacitor). Punch-point GPS stays PWA.
- **COMPVSS:** MISSING and appropriately so for PWA; `mileage` surface exists for manual logs. Treat as native-wrapper roadmap item only for driver-class roles.

## C. Kiosk / shared device

### 10. Shared-device kiosk mode (PIN + optional face/QR) coexisting with personal-phone punch
- **Practice:** A dedicated tablet at the crew entrance runs a locked kiosk app; workers punch by 4-digit PIN, QR, or face unlock; the same person can clock in on the kiosk and out on their phone (punch methods are interchangeable against one timecard). Kiosk auto-matches the punch to the posted shift.
- **Exemplars:** Deputy Kiosk/Time Clock (iPad + Android, one PIN across devices, Face Unlock), Homebase tablet time clock (PIN; interchangeable with phone/POS punch), When I Work kiosk (PIN/QR/facial), Connecteam kiosk.
- **Evidence:** All four document it; kiosk is the standard answer for (a) workers without smartphones/data, (b) BYOD-refusers, (c) high-throughput gate check-in at shift start.
- **Rationale:** Event load-ins funnel 50–300 crew through one door in 30 minutes — a gate kiosk beats 300 individual GPS punches, and it's the only path for no-phone day labor.
- **Feasibility:** PWA-feasible as a `/m/kiosk` fullscreen route (device-scoped org token + PIN per worker); lock-down (guided access/kiosk MDM) is an ops concern, not code. COMPVSS already has a door/scan surface (`/m/door`, `/m/scan`) to pattern-match.
- **COMPVSS:** MISSING (confirmed: kiosk not present). Highest-leverage single gap for event-day operations given existing scan infrastructure.

## D. Frontline engagement (what drives DAU)

### 11. Utility-first home: today's shift, tasks, messages above the fold
- **Practice:** The home screen answers "what's my next shift, what do I owe, what's new" with large tap targets; engagement features ride on the back of schedule/pay utility, not vice versa. Leaders explicitly design "check my schedule" as the daily hook that carries feed/recognition traffic.
- **Exemplars:** Connecteam (large buttons: clock, today's shift, tasks, messages), Blink (feed + hub), Beekeeper.
- **Evidence:** Blink reports ~7 app opens/day/user and 95% activation — attributed to bundling must-use utility (schedule, payslips) with the feed; ClearBox 2026 scored Blink 5.0/5 for mobile frontline UX.
- **Rationale:** DAU comes from need-to-know utility; social features alone decay. Payslip/schedule checks are the anchor sessions.
- **Feasibility:** Pure IA; PWA.
- **COMPVSS:** PRESENT (HomeShell + my-work + schedule). Keep the anchor: next-shift card + unread + open tasks stay above the fold.

### 12. Recognition that is public, feed-native, and cheap to give
- **Practice:** Kudos post to the shared feed (not a private inbox), tied to values/badges, one-tap reactions; managers get prompts to recognize. Points/rewards optional tier.
- **Exemplars:** Connecteam recognition + badges, Blink, Beekeeper, Workhuman (enterprise), 7shifts Engage leaderboard.
- **Evidence:** Companies with structured recognition see ~31% lower voluntary turnover; unrecognized workers are 2x more likely to job-hunt; frontline workers get ~40% less recognition than desk workers (SSR 2026 stats roundup; Workhuman/Bucketlist).
- **Rationale:** Recognition is the cheapest retention lever in a 100%+-turnover labor pool (event staffing).
- **Feasibility:** PWA; already built.
- **COMPVSS:** PRESENT (feed/kudos + `recognition_posts`/`badges`/`badge_awards`, push fan-out on award). Possible polish: manager recognition prompts (nudge after a completed show day).

### 13. Post-shift micro-feedback (1-tap sentiment)
- **Practice:** Right after clock-out, a one-question prompt: rate your shift (Awful→Great) + optional reason chips. Aggregates to a per-location/per-manager "shift score" trend dashboard; managers see comments and respond.
- **Exemplars:** 7shifts Shift Feedback + Engage dashboard (Avg. Shift Score, engagement leaderboard, most-often-late etc.).
- **Evidence:** 7shifts launched Engage specifically to quantify engagement→turnover for restaurants; positive = Decent/Good/Great, negative = Bad/Awful buckets in their reporting.
- **Rationale:** Catches operational problems (bad supervisor, broken gear, unsafe site) within hours; near-zero effort so response rates stay high vs long surveys.
- **Feasibility:** Trivial PWA; hooks the existing clock-out moment.
- **COMPVSS:** MISSING. Surveys/polls exist (long-form); the 1-tap post-clock-out sentiment prompt with per-production trend rollup does not.

### 14. Targeted announcements: segment by shift/site/role, measure reach, chase non-readers
- **Practice:** Announcements target audiences (tonight's crew, one venue, one department), show read %, allow "require confirmation," and auto-remind non-readers. Never company-wide by default.
- **Exemplars:** Beekeeper, Blink, 7shifts (read receipts), Connecteam (read tracking + auto-follow-up), Staffbase.
- **Evidence:** Frontline comms guides converge on segmentation-over-volume: relevance is what keeps workers opening the app; company-wide blasts train workers to ignore the channel.
- **Rationale:** For event ops, "tonight's changed load-in time" must reach exactly tonight's crew and prove it did.
- **Feasibility:** PWA; audience predicate over existing shift/roster data.
- **COMPVSS:** PARTIAL. Announcements + `announcement_reads` + read_count denorm exist; missing: audience targeting by shift/production/role, require-confirm flag, and auto-chase of non-readers.

## E. Compliance nudges

### 15. Predictive compliance warnings at schedule-build and punch time
- **Practice:** The system knows jurisdiction rules (overtime thresholds, minor-work rules, meal/rest, predictive-scheduling/Fair Workweek premiums) and warns *before* the violation: overtime-risk alerts mid-week, break-due reminders mid-shift, missed-break flags at timesheet.
- **Exemplars:** Deputy (overtime alerts, break planning, missed-break flags), 7shifts (labor-compliance tools incl. minor rules + Fair Workweek), Homebase, Legion/UKG (rule engines at enterprise tier).
- **Evidence:** Deputy blog/product pages document instant overtime-risk alerts and automatic flag+notify on unstarted planned breaks.
- **Rationale:** Nudges at the moment of decision are the only compliance that works for deskless ops; after-the-fact reports just document the fine.
- **Feasibility:** PWA; rules engine is server-side.
- **COMPVSS:** MISSING at the worker surface. `src/lib/time/policy.test.ts` implies punch policy exists; no break-due mid-shift nudge, overtime-risk alert, or fatigue warning surfaces in `/m`.

### 16. Fatigue / minimum-rest guardrails between shifts
- **Practice:** Scheduling and swap/claim flows enforce (or warn on) minimum rest between shifts, max consecutive days, and max daily hours; a worker claiming a shift that breaks a rest rule is blocked or the manager is warned.
- **Exemplars:** Deputy (fatigue management in scheduling), Quinyx (labour-rule compliance in AI schedules), Legion (fully-compliant schedule generation), UKG.
- **Evidence:** Quinyx/Legion both market rule-compliant auto-scheduling (Legion: compliant schedules matching preferences 96% of the time); airlines/airports use Quinyx specifically for crew-rest rules.
- **Rationale:** Event production runs 18-hour show days; fatigue is the #1 latent safety hazard, and rest-rule checks in the claim flow are cheap.
- **COMPVSS:** MISSING. No rest-rule predicate in swap/claim; natural place: swap approval + open-shift claim validation.
- **Feasibility:** PWA; server-side predicate over existing shifts.

## F. Scheduling self-service and AI

### 17. Worker-declared availability + preferences as first-class scheduling input
- **Practice:** Workers maintain availability windows, preferred hours/locations, and target weekly hours in-app; the scheduler (human or AI) consumes them. Time-off requests ride the same self-service rail with policy-aware balances.
- **Exemplars:** When I Work, 7shifts, Connecteam, Legion (preferences: when/how much/where, updatable anytime), Quinyx.
- **Evidence:** Legion: 33% average retention improvement + 11% eNPS lift for customers activating preferences+self-service; Quinyx claims 20% reduction in over/under-scheduling.
- **Rationale:** Schedule control is consistently the top-cited driver of hourly-worker retention, above pay in several surveys.
- **Feasibility:** PWA.
- **COMPVSS:** PARTIAL. `availability_slots` table + time-off (policies/balances/requests) exist; verify a worker-facing availability editor is actually surfaced in `/m` (schedule surface doesn't obviously expose it) and that the scheduler consumes it.

### 18. AI/auto-fill scheduling with demand signals (roadmap-tier)
- **Practice:** Demand forecast (historical + weather + local events) drives auto-generated, rule-compliant schedules in 15-min grains; managers approve rather than author.
- **Exemplars:** Legion (300k custom models, 1.6B data points, 13X claimed ROI), Quinyx, UKG Dimensions.
- **Evidence:** Legion businesswire + product pages (claims are vendor-published; treat as directional).
- **Rationale:** For COMPVSS the analog is production-calendar-driven staffing curves (load-in/show/load-out), not retail foot traffic — a differentiated, tractable version of "demand."
- **Feasibility:** Server-side; heavy. Roadmap only.
- **COMPVSS:** MISSING (manual scheduler exists at `/m/scheduler` with coverage view). Not a near-term gap; note the production-phase-driven staffing-curve angle.

## G. Push-notification discipline

### 19. Send/suppress taxonomy + quiet hours
- **Practice:** Leaders converge on: ALWAYS push = safety alerts (with acknowledgment), shift assignment/change/cancellation, pre-shift reminder, swap/claim decisions affecting you, direct messages. DIGEST/suppress = feed posts, kudos to others, surveys, non-urgent announcements. Quiet hours / off-shift suppression for everything non-safety, respecting right-to-disconnect norms (statutory in FR/BE/PT; policy elsewhere) — deliver in-app on next open instead. Delayed-send for managers composing at midnight.
- **Exemplars:** Blink/Beekeeper/Flip (segmented, role/shift/site-targeted delivery), guidance literature (HubEngage, ShiftFlow right-to-disconnect).
- **Evidence:** Frontline-comms guides uniformly warn that notification flooding is the #1 cause of app abandonment; "workers drowning in notifications" (TechRadar) is the failure mode.
- **Rationale:** Notification trust is a spendable budget; safety alerts only work if the channel isn't cried-wolf.
- **Feasibility:** PWA; server-side gate in the existing send path.
- **COMPVSS:** PARTIAL. Per-kind opt-outs exist (`notification_preferences.matrix[kind].push` enforced in `sendPushTo/Bulk`) — ahead of many. MISSING: quiet-hours window, off-shift suppression for non-urgent kinds, digest batching, and a "safety alerts bypass everything incl. quiet hours" override lane.

### 20. Acknowledgment-required critical alerts
- **Practice:** Safety/urgent broadcasts require an explicit "I've read this" tap; the sender sees a live acknowledgment roster and can escalate (SMS/call) to non-acknowledgers.
- **Exemplars:** Beekeeper, Blink, AlertMedia/Everbridge (dedicated), UKG talk/comms tier.
- **Evidence:** Comms guides: urgent safety alerts = push + required acknowledgment is the standard pattern.
- **Rationale:** On show sites (weather hold, evacuation, structural issue) "sent" is not "received"; the ack roster is the operational artifact.
- **Feasibility:** PWA.
- **COMPVSS:** PARTIAL. Emergency surface + crisis panel exist (`/m/emergency`, CrisisPanel with codes/evac/fire/shelter); missing the per-recipient acknowledgment roster + escalation view for broadcasts.

## H. Onboarding-in-the-flow (seasonal/event workers)

### 21. Self-onboarding packet before day one; time-to-first-shift as the metric
- **Practice:** Hire → mobile packet (e-sign W-4/I-9 equivalents, policies, bank details, emergency contacts, cert uploads) with required-field tracking and live completion visibility; worker is schedulable the moment the packet completes. Role-specific packets; add notes/checklists/attachments to the first shift itself so expectations arrive with the schedule.
- **Exemplars:** Homebase (self-onboarding + automated hire→schedule handoff), Connecteam (role-specific packets, e-sign, live tracking; dedicated seasonal-onboarding playbook), Workstream.
- **Evidence:** Connecteam/Homebase product docs; the seasonal-hiring literature treats packet-completion-before-arrival as the difference between a productive day one and a paperwork day one.
- **Rationale:** Event orgs hire in bursts days before a show; time-to-first-shift is the metric that matters.
- **Feasibility:** PWA; e-sign + storage already in-stack (offer_letters, personal_documents, docs upload).
- **COMPVSS:** PARTIAL. Onboarding flows exist (`new_hire_flows/steps/assignments`, `/m/onboarding`, advancing packets for counterparties). Verify: e-sign inside steps, required-doc gating before schedulability, and a manager time-to-first-shift/completion dashboard.

### 22. Training-in-the-flow: micro-courses tied to the first shifts
- **Practice:** Bite-sized mobile courses (safety induction, radio etiquette, venue orientation) assigned by role, completable on the phone, with quiz gates; completion can gate shift eligibility or award a badge; site-specific induction attaches to the first shift at that venue.
- **Exemplars:** Connecteam training, Jolt (cause-based training), Beekeeper, LEG3ND analog exists at console tier.
- **Evidence:** Connecteam onboarding materials; course-completion→badge linkage (COMPVSS already has `courses.completion_badge_id`).
- **Rationale:** Seasonal crews can't attend classroom inductions; the phone is the classroom.
- **Feasibility:** PWA; largely built.
- **COMPVSS:** PARTIAL. `/m/learning` + courses/quiz/completions + completion badges exist. Missing: course-completion as a shift-eligibility gate (claim/assign predicate) and auto-assignment of venue-specific induction on first shift at a site.

## I. Ops execution (checklists)

### 23. Photo-proof checklists that kill pencil-whipping
- **Practice:** Recurring task lists (opening/closing, safety walks, equipment checks) where items can require photo proof, signature, and are auto time/name-stamped; managers get real-time completion visibility; sensors/probes auto-fill readings where hardware exists.
- **Exemplars:** Jolt (Lists: mandatory photo verification + timestamps; Bluetooth temp probes; label printing), Connecteam forms/checklists, Xenia, SafetyCulture.
- **Evidence:** Jolt's whole positioning; "verifiable digital record for inspectors" is the compliance artifact.
- **Rationale:** Event analog: stage-safety walks, barricade checks, radio counts, PPE verification — same accountability physics as food safety.
- **Feasibility:** PWA (camera + upload already in stack).
- **COMPVSS:** PARTIAL. Inspections ledger, snags/punch lists, daily-log/daily-report, incident capture all exist. Missing: require-photo-per-item enforcement and recurring scheduled checklist instances with completion-visibility rollup (verify against `/m/inspections` capabilities).

## J. Safety

### 24. Panic/duress + timed safety check-in with escalation
- **Practice:** One-tap (or hardware-button) panic alert with live location; silent duress variant; timed check-in sessions for lone workers (fail-to-respond auto-escalates); man-down/no-motion detection at native tier; escalation ladder (supervisor → security → 911) with 24/7 monitoring optional.
- **Exemplars:** SafetyLine, SHEQSY (SafetyCulture), EcoOnline, GetHomeSafe; workforce suites embed lighter versions (Connecteam SOS-style, Blink safety alerting).
- **Evidence:** Lone-worker vendor docs converge on the same 4-part model (panic, check-in timer, no-motion, monitored escalation); silent-duress etiquette (operator listens, never speaks back) is documented practice.
- **Rationale:** Overnight load-outs, riggers at height, runners in parking structures = textbook lone-worker exposure.
- **Feasibility:** Panic button + timed check-in = PWA-feasible (foreground). No-motion/man-down + hardware buttons = native tier.
- **COMPVSS:** PARTIAL. Emergency surface with crisis codes/evac/fire/shelter is strong; missing the *personal* layer: one-tap panic with location share, silent duress, and timed lone-worker check-in sessions with auto-escalation.

## K. Pay transparency (engagement anchor)

### 25. Earnings visibility and earned-wage access
- **Practice:** Workers see estimated earnings per shift/week in-app as schedule and punches accrue; enterprise tier adds earned-wage access (draw against accrued pay pre-payday).
- **Exemplars:** 7shifts (estimated earnings in worker app), When I Work, UKG Wallet (Payactiv), DailyPay.
- **Evidence:** 74% of employees say they'd stay longer with an employer offering immediate access to earned pay; 86% more likely to apply (DailyPay/UKG-published, vendor-sourced); pay visibility is a top-3 app-open driver alongside schedule.
- **Rationale:** For gig-adjacent event labor, "how much did I make this run" is a daily question; answering it in-app is a free DAU anchor. EWA itself is a fintech/compliance lift — visibility is not.
- **Feasibility:** Earnings estimate = PWA arithmetic over shifts × rates (rates exist via engagements/offer_letters). EWA = partner integration, roadmap.
- **COMPVSS:** PARTIAL/MISSING. Timesheets + expenses + finance surfaces exist in `/m`; no per-shift estimated-earnings display for the worker. EWA absent (expected).

---

## Priority read (gaps ranked by leverage for event crews)
1. Kiosk/shared-device punch mode (#10) — event-day gate throughput + no-phone workers.
2. Quiet hours + send/suppress taxonomy + safety-bypass lane (#19) — protects the trust budget everything else spends.
3. Shift acknowledgment receipts (#3) + targeted require-confirm announcements (#14).
4. Clock-out attestation + break/overtime nudges (#8, #15) — CA exposure is real money.
5. Post-shift 1-tap sentiment (#13) — cheapest engagement signal not yet captured.
6. Photo-on-punch tier (a) (#6); panic/timed check-in personal safety layer (#24).
7. Open-shift claim polish + offer-to-pool + rest-rule guardrails (#1, #2, #16).
8. Estimated earnings per shift (#25); onboarding completion gating + time-to-first-shift metric (#21).
