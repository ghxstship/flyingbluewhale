# ADR-0002 — Klipboard ERP feature-parity audit + experiential gap-closure plan

**Status:** Proposed
**Date:** 2026-04-30
**Owner:** Platform engineering
**Supersedes:** —

## Context

FLYTEHAUS Technologies is positioning the Atlas (ATLVS · GVTEWAY · COMPVSS)
as the production OS for the experiential industry — touring runs, residencies,
private launches, gallery programs, festivals, governing-body events. Klipboard
ERP is a mature point of comparison: cloud field-service management plus a full
ERP backbone, sold into 20+ trades verticals.

This ADR audits Klipboard's surface against flyingbluewhale's current
implementation, identifies the gaps, and lays out a phased plan to close them
**without abandoning the experiential frame**. We do not want a generic FSM —
we want the productions-and-events flavour of every Klipboard primitive.

## Audit method

Source review across:

- Klipboard NA marketing — https://www.klipboard.com/en-us/
- Klipboard FSM product page — https://www.klipboard.com/products/field-service-management
- Klipboard.io feature listing — https://klipboard.io/

Mapped each Klipboard module to the corresponding flyingbluewhale surface.
"Strong" = ≥80% functional parity. "Partial" = some coverage, gaps in depth or
in modes (e.g. mobile vs desktop). "Gap" = no equivalent ships today.

## Audit matrix

### ERP & finance

| Klipboard                                  | flyingbluewhale today                                                                  | Parity                 | Experiential framing                                                                                            |
| ------------------------------------------ | -------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Invoicing + Stripe payments                | `invoices`, `invoice_line_items`, `/api/v1/webhooks/stripe`, `/api/v1/stripe/checkout` | **Strong**             | Per-event invoicing already shipped; supports project_id linkage                                                |
| Quoting / estimates                        | `proposals`, `proposal_share_links`, `proposal_signatures`                             | **Strong**             | Branded proposal CMS with signed links is richer than Klipboard's basic quoter                                  |
| Accounting integrations (Xero, QuickBooks) | none                                                                                   | **Gap**                | Production accountants live in Xero/QBO — outbound sync of `invoices`, `expenses`, `purchase_orders`, `payouts` |
| Purchase orders                            | `purchase_orders`, `po_line_items`, `requisitions`                                     | **Strong**             | Includes requisition→PO conversion, status state machine                                                        |
| Stock control / inventory                  | `equipment`, `rate_card_items`                                                         | **Partial**            | Equipment is asset-level; missing bin/location stock counts and movements ledger                                |
| Sales order processing                     | `proposals` → `invoices`                                                               | **Partial**            | No formal "order" entity sitting between proposal and fulfilment                                                |
| Supplier management                        | `vendors` (with W-9, COI expiry, payment terms)                                        | **Strong**             | Vendor portal already exists                                                                                    |
| ePOS                                       | none                                                                                   | **Gap** (low priority) | Could matter for activation merch + concessions, but most experiential ops use Square/Shopify on-site           |
| eCommerce                                  | `tickets`, `ticket_types`, Stripe checkout                                             | **Partial**            | Ticketing only; no general merch storefront                                                                     |

### Field service & operations

| Klipboard                                 | flyingbluewhale today                                           | Parity      | Experiential framing                                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| Job scheduling + dispatch board           | `tasks`, `transport/dispatch`, run-of-show cues                 | **Partial** | We have linear lists per discipline; **no drag-drop dispatch board across crews + venues**                               |
| Real-time job tracking                    | `dispatch_runs.actual_*`, status transitions on `tasks`         | **Partial** | Live coverage only on transport runs; not on tasks/jobs                                                                  |
| GPS / vehicle tracking                    | `dispatch_runs.fleet`, `LiveDispatchMap`                        | **Strong**  | Already shipped for transport                                                                                            |
| Mobile field operations                   | `(mobile)/m` PWA — tasks, gate scan, check-in, A&D, ROS, driver | **Strong**  | Three-shell PWA is core to the architecture                                                                              |
| Service request management                | none (roadmap stub at `/console/services/requests`)             | **Gap**     | For venues this is cleaning, repairs, AV breakdowns, IT tickets, hospitality complaints — needs a triage queue with SLAs |
| Form builder + PDF designer               | `form_defs` table + `/console/forms` list (just shipped)        | **Partial** | Schema-driven forms exist; **PDF designer is a gap** — needed for guides, BEOs, advancing decks                          |
| Asset management                          | `equipment` (5-state machine)                                   | **Strong**  | Includes condition + lifecycle                                                                                           |
| QR tagging on assets                      | `equipment.id` + `/m/inventory/scan`                            | **Partial** | Scanner reads codes; **no QR generation/print pipeline**                                                                 |
| Planned preventative maintenance (PPM)    | none                                                            | **Gap**     | Maps to recurring venue inspections, scaffold safety re-checks, PA pre-show diagnostics, credential re-issuance          |
| Asset surveys                             | none                                                            | **Gap**     | Pre/post-event venue walks, gear condition reports, scaffold load checks                                                 |
| Recurring jobs                            | none                                                            | **Gap**     | Daily venue walkthrough, weekly safety drill, monthly compliance review                                                  |
| SLA tracking                              | none                                                            | **Gap**     | Service requests + crisis alerts both need response/resolution targets                                                   |
| Inline image + signature capture (mobile) | `AdvancingForm` has signatures only on desktop portal           | **Partial** | `/m/incidents/new`, `/m/medic/new`, `/m/handover` would all benefit                                                      |

### Customer / portal

| Klipboard                          | flyingbluewhale today                          | Parity      | Experiential framing                                                                                      |
| ---------------------------------- | ---------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| Client portal                      | `(portal)/p/[slug]/...` per-persona dashboards | **Strong**  | 10+ persona portals already deployed                                                                      |
| Customer asset reminders           | partial — `notifications` table; manual sends  | **Partial** | Need automated trigger on credential expiry, certification due, contract renewal                          |
| Email + SMS notifications          | email-templates UI; **no SMS backbone**        | **Partial** | Crew call sheets + crisis alerts both want SMS; pick a provider                                           |
| Booking / work request from portal | none — proposal acceptance only                | **Gap**     | Vendor portal should accept advancing change-requests; client portal should accept call-sheet adjustments |
| Customer experience analytics      | none                                           | **Gap**     | Portal usage telemetry exists at `telemetry/marketing` but not per-persona engagement                     |

### Warehouse & logistics

| Klipboard                      | flyingbluewhale today           | Parity      | Experiential framing                                                            |
| ------------------------------ | ------------------------------- | ----------- | ------------------------------------------------------------------------------- |
| Receiving / put-away           | none                            | **Gap**     | "Truck pulled in, gear's off the lift gate" — needs a receiving manifest screen |
| Picking / packing for dispatch | none                            | **Gap**     | Pull list against a pull date — currently a paper process                       |
| Bin locations                  | none                            | **Gap**     | Storage bays in the central warehouse → pre-rig staging → venue bay             |
| Multi-warehouse / multi-venue  | `equipment.location` + `venues` | **Partial** | Movements between locations not captured as ledger                              |
| Delivery management            | `dispatch_runs`, `ad_manifests` | **Strong**  | Already shipped                                                                 |

### Workforce

| Klipboard                                  | flyingbluewhale today                           | Parity      | Experiential framing                                              |
| ------------------------------------------ | ----------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| Timesheet management                       | `time_entries`                                  | **Strong**  | Plus mileage                                                      |
| Multi-engineer assignments / skill routing | `workforce_members.skills`, `rosters`, `shifts` | **Partial** | Skills field exists as JSONB but no skill-based dispatch matching |
| Capacity / workload views                  | `workforce_deployments` (planned vs actual FTE) | **Partial** | Per-area planning; no Gantt of "who's free at 14:00 on Tuesday"   |

### BI / analytics

| Klipboard          | flyingbluewhale today                 | Parity     | Experiential framing                                                                           |
| ------------------ | ------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| Dashboards         | 8 dashboards across modules           | **Strong** | Already shipped                                                                                |
| BI / drill-through | dashboards link to underlying lists   | **Strong** |                                                                                                |
| AI assistant       | `ai_conversations`, `/api/v1/ai/chat` | **Strong** | Anthropic-backed; richer than Klipboard's "embedded AI" since it has full conversation history |

### Industry-vertical solutions

| Klipboard verticals                                                             | flyingbluewhale verticals                                                                                       |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| HVAC, Plumbing, Electrical, Fire, Pest, Locksmith, Pool/Spa, Lift, Wind/Solar   | Festivals, residencies, broadcast, governing-body events, gallery programs, private launches, brand activations |
| Klipboard sells to **service providers**: a single trade serving many customers | flyingbluewhale sells to **producers**: one organisation running events that involve many trades                |

This vertical inversion is the strategic anchor — we don't compete with
Klipboard for HVAC contractors. We compete for **the producer who hires those
contractors as part of an event**, and for the producer's own crew.

## Gap classification

11 distinct gaps. Grouped by closure style:

**Group A — schema-and-UI epics** (need new tables + new screens):

1. PPM + recurring inspections
2. Service requests with SLA tracking
3. Asset surveys
4. WMS picking workflow (receive / put-away / pick / pack)
5. Drag-drop dispatch board

**Group B — extension epics** (existing schema, new mode or surface): 6. Mobile job forms with inline image + signature capture 7. QR generation/print pipeline for assets 8. Skill-based dispatch matching + capacity Gantt

**Group C — integration epics** (talk to external systems): 9. Xero / QuickBooks accounting sync 10. SMS backbone (Twilio or AWS SNS) 11. PDF designer for guides + BEOs + advancing decks

## Plan

### Phase 1 — production-grade gap closure (8 weeks)

Highest-impact gaps where the experiential frame demands depth:

#### Epic 1: PPM + recurring inspections (3 weeks)

**Why:** Scaffold safety re-checks, PA system pre-show diagnostics, weekly
venue walks, monthly compliance audits, credential renewal reminders. Without
this, every recurring obligation is a cron-job-in-a-spreadsheet.

**Schema:**

```sql
maintenance_schedules
  id, org_id, name, kind ('inspection'|'service'|'cert_renewal'|'compliance'),
  cadence (cron-like or interval), target_kind ('venue'|'equipment'|'credential'|'workforce'),
  target_id, owner_id, last_run_at, next_run_at, sla_minutes, active boolean

maintenance_jobs
  id, org_id, schedule_id, due_at, completed_at, completed_by,
  outcome ('pass'|'fail'|'partial'), notes, photos jsonb, signature_path
```

**Surfaces:**

- `/console/operations/maintenance` — list of upcoming + overdue jobs
- `/console/operations/maintenance/schedules/[id]` — schedule editor
- `/m/maintenance` — today's checks for the assigned crew
- Server cron: nightly job materialises the next 7 days of `maintenance_jobs`

**Experiential tweak:** the `target_kind = 'credential'` cadence reuses the
existing credentials expiry watcher, eliminating duplicate notifications.

#### Epic 2: Service requests + SLA tracking (2 weeks)

**Why:** During a live event, "the AV in stage 2 is buzzing" needs a triage
queue with response-time targets. Currently crew text the production manager.

**Schema:**

```sql
service_requests
  id, org_id, project_id, venue_id, requester_id (or anon contact),
  category ('AV'|'cleaning'|'repair'|'IT'|'hospitality'|'security'|'other'),
  severity ('P1'|'P2'|'P3'|'P4'),
  summary, description, photos jsonb,
  assigned_to, status ('open'|'acknowledged'|'in_progress'|'resolved'|'cancelled'),
  opened_at, acknowledged_at, resolved_at, sla_response_due, sla_resolution_due

service_sla_policies
  id, org_id, severity, response_minutes, resolution_minutes, business_hours_only
```

**Surfaces:**

- `/console/services/requests` (currently a roadmap stub) → real triage queue
  with SLA timer chips going amber/red on breach
- `/m/requests` (currently a roadmap stub) → file from the field with photo
- Portal: `/p/[slug]/guest/request` → resident/participant submission form

**Experiential tweak:** Severity P1 auto-escalates to a `crisis_alert` if
unacknowledged past the response SLA.

#### Epic 3: Mobile job forms with inline image + signature capture (1 week)

**Why:** `/m/incidents/new`, `/m/medic/new`, `/m/handover`, `/m/punch` are all
form pages without media or sign-off. Production safeguarding + medical demand
both.

**Plan:** Promote the existing `<AdvancingForm>` signature canvas into a
shared `<MediaCaptureField>` + `<SignatureField>` pair. Wire into the four
mobile forms. Storage: existing `incidents/photo-upload` API + a new
`signatures/` bucket scoped per record.

#### Epic 4: Asset surveys (2 weeks)

**Why:** Pre-event venue walks, post-event gear condition, scaffold inspection
records. Currently captured as PDFs in Drive — invisible to ops.

**Schema:**

```sql
asset_surveys
  id, org_id, target_kind ('venue'|'equipment'|'zone'),
  target_id, surveyor_id, conducted_at, kind ('pre_event'|'post_event'|'periodic'),
  template_id (form_defs), answers jsonb, photos jsonb, signature_path,
  status ('draft'|'submitted'|'reviewed')
```

**Surfaces:**

- Reuses `form_defs` (just landed) — surveys are forms with a target binding
- `/m/handover` (currently roadmap) → pre/post survey for the venue handover
- `/console/venues/[id]/surveys` tab on each venue

### Phase 2 — operations depth (6 weeks)

#### Epic 5: WMS picking workflow (3 weeks)

**Why:** Production warehouse → pre-rig → venue bay → return. Currently
tracked by `equipment.location` field — no movement ledger.

**Schema:**

```sql
inventory_locations  -- bins, bays, trucks, venues
  id, org_id, kind ('warehouse_bin'|'staging'|'truck'|'venue_bay'),
  parent_id, code, name, capacity_units

equipment_movements  -- ledger
  id, org_id, equipment_id, from_location_id, to_location_id,
  moved_by, moved_at, reason ('pick'|'put_away'|'transfer'|'return'),
  pull_list_id

pull_lists  -- pick sheets
  id, org_id, project_id, target_run_at, status,
  items jsonb (equipment_id + qty)
```

**Surfaces:**

- `/console/production/equipment` already strong — add a "Movements" tab
- `/console/logistics/warehouse` (currently roadmap) → real receive/put-away UI
- `/m/wms` (currently roadmap) → mobile pick scanner using the existing
  `/api/v1/equipment/scan` endpoint; the new movement ledger backs it

#### Epic 6: Drag-drop dispatch board (2 weeks)

**Why:** Production manager needs to see "who is doing what at 14:00 across all
venues". `tasks` is a list; we need a calendar/timeline view.

**Plan:** New surface `/console/operations/dispatch` that:

- Pulls `tasks` + `shifts` + `dispatch_runs` + `cues` for a date window
- Renders a swimlane-per-resource (crew, vehicle, room) Gantt
- Drag a task between lanes → server action updates `assigned_to` + `due_at`
- Conflict overlay: a person can't be in two venues at once

**Library choice:** `@dnd-kit/core` (already vetted in adjacent xpb work).

#### Epic 7: Skill-based routing + capacity Gantt (1 week)

**Why:** `workforce_members.skills` is JSONB but unused. Production roles
need it: "find me a rigger with working-at-height + electrical".

**Plan:**

- Index `workforce_members.skills` as text[] for filtering
- Add a `skill_requirements` JSONB on `tasks` and `shifts`
- Capacity Gantt at `/console/workforce/planning` (currently roadmap)

### Phase 3 — integrations + polish (4 weeks)

#### Epic 8: Xero + QuickBooks Online sync (2 weeks)

**Why:** Production accountants live in Xero/QBO. Right now finance data is
trapped in Supabase.

**Plan:**

- Outbound sync only (one-way: flyingbluewhale → accounting). Two-way is a
  later epic.
- Sync entities: `clients` → contacts; `invoices` → AR invoices;
  `purchase_orders` → bills; `expenses` → expense claims; payouts → bank
  transactions
- Use `xero-node` + `intuit-oauth` SDKs; tokens scoped per `org_id`
- Settings page: `/console/settings/integrations/accounting`
- Backfill toggle + sync history viewer

#### Epic 9: SMS backbone (1 week)

**Why:** Crew call times, accreditation expiry, crisis alerts all want SMS,
not just email. Field staff don't read email.

**Plan:**

- Twilio Programmable Messaging (region-flexible, sane pricing)
- Provider abstraction in `src/lib/sms.ts` so we can swap to AWS SNS later
- Wire into existing `notifications` event types: `task.assigned`,
  `crisis.alert`, `credential.expiring`, `shift.call_time`
- User-level opt-in stored in `user_preferences.notifications` (already wired
  to the matrix at `/me/notifications`)

#### Epic 10: PDF designer for guides + BEOs + advancing decks (1 week)

**Why:** Guides currently render via React → server PDF (`/lib/pdf/layout.tsx`).
That's fine for boarding-pass-style output but doesn't let ops customise per
event. Klipboard's PDF designer is a drag-drop layout tool.

**Plan:** Lighter than Klipboard — we don't need pixel-perfect layout. Add a
`pdf_themes` table and a small theme picker on each `event_guide` and `proposal`:

- Logo placement, accent colour, header/footer text
- Cover image override
- Font pairing (Inter+JetBrains Mono baseline; allow Plex Mono / Manrope swap)

Defer the full WYSIWYG designer to a later milestone.

#### Epic 11: QR generation + print pipeline (1 week)

**Why:** Equipment tags + accreditation badges both currently printed
externally. Klipboard ships in-app QR generation.

**Plan:** Server-side render via `qrcode` npm — already in repo for ticket
codes. Add print sheet templates:

- `/console/production/equipment/[id]/qr` → printable QR sticker
- `/console/accreditation/print` (currently a stub) → batch badge sheet

## Sequencing and dependencies

```
Phase 1 (8w)   Phase 2 (6w)   Phase 3 (4w)
─────────────  ─────────────  ─────────────
1. PPM         5. WMS picks   8. Xero/QBO
2. Service     6. Dispatch    9. SMS
3. Mobile      7. Skills      10. PDF themes
4. Surveys                    11. QR pipeline

Dependencies:
- 5 (WMS) ← 4 (Surveys) — surveys link to equipment movements
- 8 (Xero) ← 1 (PPM) — recurring service work generates invoices
- 6 (Dispatch) ← 7 (Skills) — drag-drop honours skill requirements
- 9 (SMS) is independent — pull forward if Twilio account is ready
```

## Non-goals

Things Klipboard sells but flyingbluewhale should **not** chase:

- **HVAC / plumbing / fire-protection vertical packs.** Different industry,
  different regulators, different mental model. Stay focused on experiential.
- **Generic ePOS.** On-site point-of-sale for activations is better solved by
  Square/Shopify integration than by building one.
- **Two-way accounting sync.** One-way (push) covers 95% of producer needs;
  two-way invites bookkeeping conflicts. Revisit after producer feedback.
- **Klipboard AI's "fill in the form for me" features.** We already have a
  richer Anthropic-backed assistant; layering Klipboard-style smart-fill on
  top adds noise.

## Success metrics

Per epic, production-time metrics:

| Epic                 | Metric                                        | Baseline → target             |
| -------------------- | --------------------------------------------- | ----------------------------- |
| PPM                  | % recurring obligations missed past due       | unmeasured → < 5%             |
| Service requests     | P1 acknowledgement time                       | unmeasured → < 5 min p95      |
| Mobile media capture | Incidents with photos attached                | ~0% → > 80%                   |
| Surveys              | Pre-event venue surveys completed             | ~0% → 100% of headline events |
| WMS                  | Equipment "lost" between truck and venue      | qualitative → 0 by month 3    |
| Dispatch board       | Cross-venue conflicts caught at planning time | 0 → > 90%                     |
| Xero/QBO sync        | Manual re-keying hours/week                   | unmeasured → -8 hrs           |
| SMS                  | Call-sheet read rate                          | email-only baseline → +30%    |

## Risks + mitigations

- **Schema sprawl.** 11 epics adds 8+ tables. Mitigation: every new table
  follows the org-scoped + `is_org_member` RLS pattern; no per-feature
  exceptions.
- **Mobile shell churn.** Three of the Phase 1 epics extend `/m/*` pages that
  are currently RoadmapStubs. Mitigation: ship the stub-replacement for each
  page in the same PR as its server work, not separately.
- **Twilio cost runaway.** SMS at scale during a festival can spike. Mitigation:
  per-org daily SMS spend cap stored on `orgs.compliance_settings`.
- **Designer scope creep.** PDF designer can spiral. Mitigation: Phase 3
  delivers a theme picker only; full WYSIWYG is explicitly out of scope.

## Recommended scope (revised)

After a critical re-read, the 11-epic plan above is roughly half overbuilt.
Half the gaps are "Klipboard has it so we should too" — wrong frame for an
experiential platform. The actual recommended build target is **7 items in
~13 weeks**, with **2 of those items not in the parity audit at all** (they
came from asking "what do experiential producers actually buy software for?"
rather than "what does Klipboard have?").

### Build (clear ROI)

| #   | Epic                                                        | Effort | Why                                                                                                                                                                                    |
| --- | ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Mobile media + signature capture                            | 1w     | Smallest effort, biggest leverage. Without it, mobile incident/medic forms produce text-only records that don't survive a safeguarding audit.                                          |
| 2   | Service requests + SLA tracking                             | 2w     | Highest-ROI epic. Live-event requests (AV buzz, broken lock, soiled bathroom) currently disappear into Slack/radio — invisible to ops.                                                 |
| 3   | SMS backbone (Twilio)                                       | 1w     | Field crew don't read email. Wire into existing `notifications` matrix. Per-org daily spend cap on `orgs.compliance_settings` prevents festival-night runaway billing.                 |
| 4   | PPM — narrowly scoped                                       | 2w     | Two specific lanes only: credential expiry chase + scaffold/safety re-checks. Don't build a generic recurring-job scheduler — it competes with `tasks` and the production schedule.    |
| 5   | QR generation pipeline                                      | 3–4d   | `qrcode` npm already in tree for tickets. Reuse for equipment stickers + accreditation badge sheets. `/console/accreditation/print` is currently a stub.                               |
| 6   | **Per-event P&L roll-up** _(not in parity audit)_           | 1w     | All data exists: `invoices` + `expenses` + `purchase_orders` + payouts all carry `project_id`. Synthesis page producer accountants ask for every cycle.                                |
| 7   | **Auto-generated crew call sheets** _(not in parity audit)_ | 2w     | Most-requested feature in production ops. Tomorrow's per-person PDF/SMS with shift, venue, role, contact — generated from `shifts` + `workforce_members` + `dispatch_runs` + `venues`. |

### Defer (low signal until a customer asks)

- **Skill-based dispatch matching** — most experiential orgs are 50–200 crew. People know each other. Matching solves a problem you only have at 1000+ headcount.
- **PDF designer / themes** — `lib/pdf/layout.tsx` already renders cleanly. Theme-pickering is fiddling, not value.
- **WMS picking workflow** — real need only for producers who own a warehouse. Many tour-run / residency producers rent everything. Validate the customer profile first.
- **Drag-drop dispatch interactivity** — ship the read-only calendar matrix view first (~1w), let production managers use it, decide if drag is worth the additional ~3w.

### Don't build at all

- **Asset surveys as a separate epic** — pre/post-venue walks are forms. We just shipped `form_defs`. Add a `target_kind` + `target_id` column (~1d) and document the pattern. Forking the data model for no functional gain is the wrong move.
- **Xero / QuickBooks at 2 weeks** — real demand, wrong sizing. Either commit to 4w + Xero only (defer QBO), or skip until a customer commits to using it. The "almost done" version is worse than nothing.
- **Generic recurring jobs / vertical packs / ePOS** — already non-goals.

### Revised sequencing

```
Sprint 1 (2w):  Mobile media+sig    +  Per-event P&L
Sprint 2 (2w):  Service+SLA         +  SMS backbone        (parallel; non-overlapping)
Sprint 3 (2w):  PPM (scoped)        +  QR pipeline
Sprint 4 (2w):  Auto call sheets
Sprint 5 (1w):  Read-only dispatch matrix
[gate]          Validate customer signal before continuing
Sprint 6+ (4w): Xero one-way sync, if real demand
```

**~13 weeks total** vs the original 18, and the value-density is higher.

## Decision

Adopt the **revised scope** above. The original 11-epic plan is preserved
in this document as audit reference. Sprint 1 starts immediately with mobile
media+sig and per-event P&L in parallel — non-overlapping files. Re-evaluate
after each sprint before committing the next.

## Out-of-band notes

- Domain cutover (`secondstar.tech` → `flytehaus.studio`) and Twitter handle
  cutover (`@secondstartech` → `@flytehaus.studio`) landed in commit
  `<see commit pushing alongside this ADR>`.
- This audit explicitly excludes the `proposal_portal` workstream currently
  living in untracked files (`src/lib/proposals/portal/*`,
  `src/app/(portal)/p/[slug]/client/proposals/*`) — that's a separate epic
  with its own design doc.
