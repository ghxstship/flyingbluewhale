# ATLVS AI Concierge — Brio Integration Kit

**Partner integration spec · v0.1 (kickoff draft) · 2026-07-14**

The technical contract for a **native** integration between **Brio** (heybrio.ai) and the **ATLVS
Technologies** ecosystem. Brio powers **all channels** (voice, SMS, web chat) and runs **Aurora** — the
named ATLVS concierge agent that guests and crew talk to ("ask Aurora"). ATLVS packages Aurora as the
**AI Concierge** add-on and remains the system of record. This document is written for Brio's engineering
team + ATLVS platform engineering to build against jointly.

> **Naming:** *Aurora* is the user-facing agent identity across every channel and every service line —
> one agent, many skills. *Brio* is the platform that runs her; the name is not surfaced to guests or
> crew. Aurora always self-identifies as an AI at session open.

> Companion: [`brio-concierge-integration-plan.md`](./brio-concierge-integration-plan.md) (strategy).
> Shareable kickoff brief: ATLVS AI Concierge Artifact (link in kickoff email).

---

## 0. Integration model at a glance

- **Brio = the channel + Aurora's runtime.** Aurora answers calls/SMS/chat 24/7, runs the conversation,
  calls ATLVS "tools" live to ground answers, escalates to humans, and posts structured outcomes back.
- **ATLVS = Aurora's knowledge + the system of record.** Serves per-event knowledge + live tool APIs,
  receives every interaction as a first-class record, routes escalations to the right human, and executes
  write-backs (bookings, requests, incidents).
- **Three interfaces** between us:
  1. **Inbound Webhooks** — Brio → ATLVS (`/api/v1/webhooks/brio`). Interaction outcomes & events.
  2. **Tool API** — Brio agent → ATLVS (`/api/v1/concierge/*`). Live reads + writes during a call.
  3. **Knowledge Sync** — ATLVS → Brio. Per-event knowledge base, kept fresh.
- **Add-on packaging:** an org enables "AI Concierge" in `studio/settings/integrations`; that provisions a
  `brio_connections` record, phone/SMS numbers, and a scoped credential set. Billing rides the existing
  add-on/credits model.

```
            ┌──────────────── AURORA (on Brio) ──────────────────────┐
  Guest ───▶│  Voice / SMS / Chat   ·   one agent   ·  human paging   │
  Crew  ───▶│                                                         │
            └───┬───────────────▲───────────────────────┬────────────┘
   (2) Tool API │  live reads/   │ (1) Webhooks:         │ (3) Knowledge sync
   calls during │  writes        │ session.*, booking.*, │ (event guide, call
   the call     ▼                │ escalation.*, sms.*   │ sheets, FAQ corpus)
            ┌────────────────────┴───────────────────────▼────────────┐
            │                    ATLVS  (system of record)             │
            │  concierge_sessions · assignments · event_guides ·       │
            │  scheduler_* · incidents · account_manager_assignments   │
            └──────────────────────────────────────────────────────────┘
```

---

## 1. Authentication & security

### 1.1 Brio → ATLVS (Tool API calls)
- **Bearer PAT.** ATLVS mints a per-connection API key (`Bearer sk_…`) with scopes
  `concierge:read` + `concierge:write`. Keys are **org- and event-scoped**: the token's claims pin
  `org_id` and an allow-list of `project_id`s. A token for Event A can never read Event B.
- Tokens are rotated on demand from the connector panel; only prefix + SHA-256 are stored ATLVS-side
  (existing `api_keys` pattern).
- All Tool API calls are rate-limited per connection (`RATE_BUDGETS.concierge`, 429 on breach).

### 1.2 Brio → ATLVS (Webhooks)
- **Shared secret + HMAC.** Every webhook carries:
  - `X-Brio-Signature: sha256=<hex>` — HMAC-SHA256 of the raw body using `BRIO_WEBHOOK_SECRET`.
  - `X-Brio-Timestamp: <unix>` — request time; ATLVS rejects skew > 300s (replay protection).
  - `X-Brio-Delivery: <uuid>` — idempotency key; ATLVS dedupes on it.
- Verification is constant-time (mirrors the existing `ses-inbound` receiver).
- Failures: ATLVS returns `2xx` on accept, `401` on bad signature, `409` on duplicate delivery (safe to
  drop), `422` on schema violation. Brio retries `5xx`/timeout with exponential backoff.

### 1.3 ATLVS → Brio (Knowledge sync + provisioning)
- Brio issues ATLVS an API key + base URL, stored **encrypted** in `brio_connections.auth_ciphertext`
  (existing connector-credential pattern). ATLVS calls Brio's management API to (a) provision/assign
  numbers, (b) push the per-event knowledge base, (c) configure escalation targets.

### 1.4 Environments
- **Sandbox** and **Production** are fully separate (distinct secrets, numbers, base URLs). All schemas
  below are identical across both. No test data crosses into prod.

---

## 2. Provisioning & lifecycle

1. Org admin enables **AI Concierge** → ATLVS creates `brio_connections` (`connection_state=pending`).
2. ATLVS calls Brio to provision a number (per **event**, **venue**, or **org** — see Decision D5) and
   registers webhook URL + escalation config.
3. Brio confirms → `connection_state=active`; number map stored on the connection.
4. Per event go-live, ATLVS pushes the knowledge base (§4) and the scoped tool token.
5. Teardown/suspend flips `connection_state=suspended`; numbers released; tokens revoked.

---

## 3. Interface 1 — Inbound Webhooks (Brio → ATLVS)

`POST /api/v1/webhooks/brio` · body is a single event envelope.

### 3.1 Envelope
```json
{
  "delivery_id": "d3f1…",            // idempotency key, echoes X-Brio-Delivery
  "type": "session.summary",          // event type, see §3.3
  "occurred_at": "2026-07-14T18:22:05Z",
  "connection_id": "conn_abc",        // maps to brio_connections
  "event_ref": { "org_id": "…", "project_id": "…" },   // event scoping
  "channel": "voice",                 // voice | sms | chat
  "session": { "brio_session_id": "bs_123", "caller": { … } },
  "data": { … }                        // type-specific, see §3.3
}
```

### 3.2 Identity block (`session.caller`)
```json
{ "phone": "+13055551234", "email": null, "display_name": "Maya R.",
  "consent": { "recording": true, "sms": true, "captured_at": "…" } }
```
ATLVS resolves `caller` → party via §5 and stamps it on `concierge_sessions`.

### 3.3 Event types & payloads
| `type` | When | `data` payload → ATLVS action |
| --- | --- | --- |
| `session.started` | call/chat/SMS opens | opens a `concierge_sessions` row (`resolution_state=open`) |
| `message.received` | each inbound utterance | appends `concierge_events` (`message`) |
| `intent.detected` | agent classifies intent | sets `service_line` + `intent`; may trigger a tool call |
| `booking.requested` | agent books a slot | → `POST` internally to `scheduler_bookings`; returns confirmation |
| `request.submitted` | guest/crew/VIP ask | → `advance_submissions` / `tasks` / `time_off` per line |
| `escalation.requested` | needs a human | → resolve `account_manager_assignments`, open/attach `chat_rooms`, push on-call |
| `incident.reported` | safety/SOS | → create `incidents` (+ `major_incidents` if severe); page ICS |
| `sms.inbound` | inbound SMS | append to session; may open a new session |
| `session.summary` | interaction ends | AI summary + `resolution_state`; closes the session, writes bell/push |
| `delivery.status` | outbound SMS/voice status | updates `concierge_events` (sent/delivered/failed) |

Example — `session.summary.data`:
```json
{
  "summary": "Guest asked about gate + parking for GA ticket; answered from guide; no escalation.",
  "service_line": "guest",
  "intent": "wayfinding",
  "resolution_state": "self_resolved",     // self_resolved | escalated | booked | abandoned
  "linked_records": [{ "type": "assignment", "id": "asg_…" }],
  "transcript_url": "https://…",           // signed, short-TTL
  "sentiment": "positive"
}
```

---

## 4. Interface 3 — Knowledge Sync (ATLVS → Brio)

Per event, ATLVS pushes a knowledge bundle Brio's agent grounds on. Re-pushed on change
(event-guide edits, schedule changes) so answers never go stale.

```json
{
  "event_ref": { "org_id": "…", "project_id": "…", "slug": "mmw26" },
  "voice": "atlvs_neutral",
  "facts": {                                  // structured, authoritative
    "event_name": "…", "dates": [...], "venue": {...}, "gates": [...],
    "schedule": [...], "parking": {...}, "policies": {...}
  },
  "faq_corpus": [                             // from event_guides + RAG corpus
    { "q": "Where is will-call?", "a": "…", "tags": ["box_office"] }
  ],
  "escalation": {                             // who to page per line
    "guest": { "target": "account_manager" },
    "vip": { "target": "account_manager", "sla_seconds": 60 },
    "emergency": { "target": "on_call_ics", "human_first": true }
  },
  "disclaimers": { "emergency": "If this is a life-threatening emergency, hang up and dial your local emergency number." }
}
```
- **Structured `facts` win over `faq_corpus`** when they conflict (freshness guarantee).
- Emergency line **must** carry the disclaimer and `human_first: true`.

---

## 5. Interface 2 — Tool API (Brio agent → ATLVS)

Live calls during a conversation. All under `/api/v1/concierge/*`, PAT-scoped, event-pinned.
JSON envelopes via the existing `apiOk`/`apiError` helpers.

### 5.1 Reads (`concierge:read`)
| Endpoint | Purpose | Returns |
| --- | --- | --- |
| `POST /concierge/identity/resolve` | phone/email → party | `{party_kind, party_id, name, service_lines[]}` |
| `GET /concierge/tickets?party_id=` | guest entitlements | assignments + `ticket_assignment_details` |
| `GET /concierge/callsheet?party_id=` | crew shift/call time | `advances` + assignment detail |
| `GET /concierge/guide?section=` | KBYG lookup | `event_guides.config` section |
| `GET /concierge/box-office/status` | ticket availability / will-call | box-office rollup |
| `GET /concierge/scheduler/slots?type=` | bookable times | `scheduler` availability |
| `GET /concierge/vip?party_id=` | VIP itinerary/accommodation/transport | hospitality records |
| `GET /concierge/travel?party_id=` | flights/rooms/ground | `travel_` + `lodging_` + `vehicle_assignment_details` |
| `GET /concierge/credentials?party_id=` | badge + access level | `credential_assignment_details`, `assignment_scan_codes` |
| `GET /concierge/logistics/dock?ref=` | dock/marshalling window, load-in | `assets`, `asset_movements`, `rentals` |
| `GET /concierge/lost-found?q=` | lost-item lookup | `incidents` where `injury_type IS NULL` |
| `GET /concierge/pay?party_id=` | timesheet/expense/pay status | `time_entries`, `expenses`, `mileage_logs`, `advances` |
| `GET /concierge/client?party_id=` | project phase, proposal/invoice/CO status, approvals pending | `projects.xpms_phase`, `proposals`, `invoices`, `change_orders`, `approval_instances` |
| `GET /concierge/site?location=` | **open site faults + known outages** (for dedupe) | `tasks` (open work orders), `locations`, `assets`, `event_guides` (venue) |
| `GET /concierge/vendor?party_id=` | invoice/PO status, COI+W9 state | `vendors`, `purchase_orders`, `invoices` |
| `GET /concierge/booking?party_id=` | offer/application status | `talent_offers`, `job_applications`, `open_calls` |
| `GET /concierge/escalations/status?line=` | human-channel queue depth + wait | live AM/on-call availability |

### 5.2 Writes (`concierge:write`)
| Endpoint | Purpose | Effect |
| --- | --- | --- |
| `POST /concierge/bookings` | book a slot | `scheduler_bookings` + ICS + confirmation |
| `POST /concierge/requests` | any structured ask (`request_type` discriminates: `site_services` (+`category`), `gear_advance`, `time_off`, `travel_change`, `credential_reissue`, `report_it`, `client_request`, `doc_chase`, `availability_update`, `expense_query`) | `tasks` / `time_off` / `advance_submissions` / `requisitions` |
| `POST /concierge/escalations` | page a human | resolve AM → `chat_rooms` + push on-call |
| `POST /concierge/incidents` | safety/SOS &mdash; **pages before it returns** | `incidents` (+ `major_incidents`), page ICS |
| `POST /concierge/incidents/{incidentId}/intel` | **append live intel to an open incident** | incident timeline; streams to responders |
| `POST /concierge/box-office/order` | take an order | `assignment`/`guest_list_entry`; returns Stripe pay link |
| `POST /concierge/logistics/checkin` | driver/freight arrival + ETA | `asset_movements` (`ual_state`), notify dock |

> `POST /concierge/requests` is the **one intake endpoint** for every "I need something" ask, discriminated
> by `request_type`. It deliberately mirrors the console's One Front Door intake set (Gear & Advance ·
> Purchase Requisition · Time Off · Report It · IT & Facilities → now **Site Services**), so Aurora and the
> console create identical records. New service lines add a `request_type`, not a new endpoint.

### 5.3 Hard rules for the Tool API
- **No card data ever accepted or spoken.** `box-office/order` returns a **Stripe checkout link** only.
- **No PHI returned** on any read. Medical/incident detail is human-routed, never voiced.
- Every write is **idempotent** (client-supplied `request_id`).
- Reads are **event-scoped by the token**; `party_id` outside the token's event → `403`.

---

## 6. Service lines → intent/skill map

**Aurora is one agent, not a phone tree.** Identity resolution (§5.1) determines *who* is calling
(`party_kind` → guest / crew / vendor / external), which gates the skills available to that caller. A
guest can never reach the crew payroll skill; a driver can never read a VIP itinerary. Lines are skill
clusters, not separate numbers.

Every line must have all three or it doesn't ship: a **real data binding**, a **real write-back**, and a
**real human escalation target**.

### The launch set — 13 lines

**Guest-facing** (`party_kind` = `user` / `external_holder`)

| Line | Reads | Writes | Escalates to |
| --- | --- | --- | --- |
| **Guest Services** | `/guide`, `/tickets`, `/lost-found` | `/requests`, `/bookings` | `guest` AM |
| **Box Office** | `/box-office/status`, `/tickets` | `/box-office/order` (Stripe link) | box-office staff |
| **VIP & Hospitality** | `/vip`, `/scheduler/slots` | `/bookings`, `/requests` | `vip` / `hospitality` AM (SLA) |

**Workforce-facing** (`party_kind` = `user` / `crew_member`)

| Line | Reads | Writes | Escalates to |
| --- | --- | --- | --- |
| **Crew Services** | `/callsheet`, `/guide` | `/requests` (`time_off`, `gear_advance`) | production coordinator |
| **Travel & Lodging** | `/travel` | `/requests` (`travel_change`) | travel coordinator |
| **Credentials & Access** | `/credentials` | `/requests` (`credential_reissue`) | accreditation desk |
| **Site Services** | `/site`, `/guide` (venue) | `/requests` (`site_services`) | **category-routed** on-call (IT · utilities · facilities · structures) |
| **Pay & Expenses** | `/pay` | `/requests` (`expense_query`) | payroll (**read-only status; any dispute escalates**) |

**Client & partner-facing** (`party_kind` = `user` / `external_holder` — client, vendor, carrier, talent)

| Line | Reads | Writes | Escalates to |
| --- | --- | --- | --- |
| **Client Services** | `/client` | `/requests` (`client_request`), `/bookings` | account manager / producer (`client` persona) |
| **Logistics & Dock** | `/logistics/dock` | `/logistics/checkin` | logistics coordinator |
| **Vendor & Contractor** | `/vendor` | `/requests` (`doc_chase`) | AP / procurement |
| **Talent & Booking** | `/booking` | `/requests` (`availability_update`) | booking agent (**never executes an offer**) |

**Cross-cutting** (any caller) — see §8

| Line | Reads | Writes | Escalates to |
| --- | --- | --- | --- |
| **Emergency** | `/guide` (evac), `/escalations/status` | `/incidents`, `/incidents/{id}/intel`, `/escalations` | on-call ICS (**page-first**) |

#### Site Services — scope, routing, and the shared fault path

Aurora's Site Services line maps onto **COMPVSS's own charter (Site & Venue Operations)**, so it covers
the site working or not working — not just IT tickets:

| Category | Covers | Routes to |
| --- | --- | --- |
| `it` | Wi-Fi, network, radios/comms, scanners, POS | IT on-call |
| `utilities` | power, water, HVAC, lighting | utilities on-call |
| `facilities` | restrooms, cleaning, waste, consumables | facilities on-call |
| `structures` | barricade, staging, signage, wayfinding, tenting | site ops on-call |

`request_type: "site_services"` carries a `category` that **routes the page** — Aurora doesn't page a
generic queue, she pages the trade that owns it.

**One fault path, many front doors.** A guest reports a broken restroom, a vendor reports no power at
their booth, a crew member reports a dead radio — every one becomes the *same* `site_services` request
against the same work order. Guest Services and Client Services forward site faults into this line rather
than opening a parallel path. One work order, one owner, one status.

**Duplicate-report deflection (the reason `/site` is a read).** During an outage, fifty people call about
the same thing. Aurora reads open faults for that location first and, on a match, tells the caller it's
already reported with the current ETA **instead of filing a fifty-first work order**. She files a new one
only when nothing open matches — and appends the caller to the existing one when it does, so ops sees
impact scale without noise. This is the low-stakes cousin of emergency surge mode (§8), and it's where
this line earns its keep on show day.

#### Money & contract guardrails on the business-facing lines

- **Client Services** carries the strictest read guard in the kit: **never disclose internal cost, margin,
  vendor rates, or budget detail.** A client sees *sell price and their own documents* — nothing upstream
  of it. `/concierge/client` returns a client-safe projection only; `budgets`, `cost_centers`,
  `purchase_orders`, and vendor pricing are **not reachable on this line at any depth**, and the token's
  scope enforces it rather than the prompt. She reports project phase, proposal/invoice/change-order
  status, and what's awaiting whose approval. She never quotes a price, never approves or prices a change
  order (they carry cost + an approval chain), and never commits to a date the record doesn't already
  hold.
- **Pay & Expenses** is **read-only status**. Aurora reports what a timesheet/expense/pay date *is*. Any
  rate question, shortfall, or dispute escalates to payroll immediately — she never explains, justifies,
  or adjusts pay.
- **Vendor & Contractor** reports invoice/PO state and chases missing COI/W9 docs. She never confirms a
  payment date she can't read from the record, and never negotiates terms.
- **Talent & Booking** reports offer/application state only. **Accepting, declining, or countering an offer
  is a contract action** (`offer_letters.letter_state`) and always routes to a human — Aurora never
  executes one over voice.

### Deliberately *not* lines (folded in as intents)
- **Lost & Found** → a Guest Services intent (backed by `incidents` where `injury_type IS NULL`); doesn't
  warrant its own escalation target.
- **Medical** → stays inside Emergency, **human-only**. PHI never traverses Aurora (§9).
- **Learning & Certification** → a Crew Services intent ("is my cert current?"); LEG3ND owns the surface.

---

## 7. Sequence flows

**Guest wayfinding (self-resolved):**
`session.started` → `intent.detected(guest/wayfinding)` → Tool `GET /guide?section=parking` →
agent answers → `session.summary(self_resolved)`.

**VIP booking (write-back):**
`identity/resolve` → `GET /vip` → `GET /scheduler/slots` → agent proposes → `POST /bookings` →
`booking.requested` webhook confirms → ICS emailed → `session.summary(booked)`.

**Emergency SOS (page-first, then parallel intel):**
`session.started(emergency)` → disclaimer played → `POST /incidents` **pages on-call ICS before
returning** (responders roll) → *then, in parallel:* Aurora keeps questioning →
`POST /incidents/{id}/intel` ×N streams location / count / hazard / access route onto the live incident
timeline as responders travel → human frees up → warm handoff with full transcript →
`incident.reported` webhook → human owns resolution.

**Emergency surge (human channel saturated):**
`GET /escalations/status` → saturated → Aurora enters surge mode → each caller answered, intel filed
against the same or a new incident, priority-queued by severity, caller told honestly where they stand →
humans drain the queue with full context already captured. No busy signal.

---

## 8. Emergency — the safety-critical contract

Aurora's emergency role is **not** a lesser version of the other lines. It is the most demanding one, and
it earns its place on two arguments that hold up under scrutiny:

- **Parallel intel, not delayed dispatch.** Responders are already rolling within seconds of the page.
  What changes outcomes after that is *detail* — exact location, how many people, what hazard, which
  access route, is the person breathing. Aurora keeps gathering that structured detail and streams it to
  the open incident **in real time**, so the responding team sees it while en route. This is what a
  dispatcher does, and it is additive to the human response, never a substitute for it.
- **Surge capacity beats a busy signal.** A major incident is precisely when the human channel saturates
  and calls get dropped. Aurora holds unlimited concurrent callers, keeps each one engaged, captures what
  they know, and priority-queues them. A caller who reaches an AI that listens and files is strictly
  better off than one who reaches a busy tone.

### The invariants (non-negotiable)

1. **PAGE FIRST, GATHER SECOND.** The page fires on first emergency-intent detection, **before any
   clarifying question**. `POST /concierge/incidents` dispatches the ICS page *before it returns a
   response*. Aurora must never gather instead of paging, and must never let intel collection delay a
   page by any amount.
2. **Life-threatening → local emergency services, immediately.** The disclaimer plays at session open and
   Aurora repeats it the instant severity reads life-threatening. She never positions herself as an
   alternative to 911.
3. **Triage + intel + routing only.** Aurora never diagnoses, never instructs on medical treatment, and is
   never the sole responder. A human always owns the outcome.
4. **Warm handoff.** The moment a human is free, they take the live call with the full transcript and all
   structured intel already captured — the caller never re-tells the story.
5. **Failover:** if the Tool API is unreachable, Brio still pages the on-call via the pre-configured
   fallback number/SMS. **The human path never depends on a live ATLVS call.**
6. **No PHI voiced.** Medical detail is captured to the incident record for responders; Aurora never reads
   it back out.
7. Full audit: `concierge_events` + the `incidents` timeline capture every second of it.

### Real-time intel payload

`POST /concierge/incidents/{incidentId}/intel` appends to the incident timeline. Responder surfaces
already subscribe to realtime, so this lands on their screens live.

```json
{
  "request_id": "…",                       // idempotent
  "captured_at": "2026-07-14T18:22:31Z",
  "location": { "text": "NE vom, section 112 tunnel", "precise": {...} },
  "hazard_type": "structural",             // structural | fire | medical | crowd | security | environmental
  "affected_count": 3,
  "casualty_state": "conscious_breathing",  // never interpreted, only recorded
  "access_route": "Gate D service road, clear",
  "reporter_callback": "+1305…",
  "confidence": "reported"                  // reported | confirmed — Aurora never upgrades this herself
}
```
Every field is **optional and additive** — Aurora files what she has and keeps appending as she learns
more. She never blocks a page waiting for a complete payload, and never infers a value the caller didn't
give (`confidence` stays `reported` until a human confirms).

### Surge mode

When `GET /concierge/escalations/status` reports the human channel saturated, Aurora enters surge mode:
absorb every caller, capture intel, priority-queue by severity, and tell the caller honestly that a human
is coming and where they are in line. **Ships last in build order** — not because it matters least, but
because it is the least forgiving, and it should run on plumbing the other eleven lines have already
proven.

---

## 9. Compliance

- **Consent:** call-recording notice (two-party-consent states) + **TCPA** SMS opt-in captured on
  `session.caller.consent` and persisted to `concierge_sessions`.
- **PII/PHI:** PHI never traverses the Tool API or voice; medical → human. Transcripts served via
  signed short-TTL URLs, not stored in Brio long-term beyond agreed retention.
- **Tenancy:** org+event scoping enforced at the token layer; ATLVS has a zero-cross-tenant-leak
  requirement (prior incident) — treated as P0 in review.
- **Data retention & DPA:** agree retention windows + a data-processing addendum before production.

---

## 10. Reliability

- **Idempotency** everywhere (`delivery_id` inbound, `request_id` outbound).
- **Retries:** Brio retries `5xx`/timeout with backoff; ATLVS dedupes.
- **Degradation:** if ATLVS is down, Brio answers from the last synced knowledge bundle (read-only) and
  queues write-backs; if Brio is down, ATLVS voice/SMS fails to a recorded fallback + existing
  push/email — records stay fully functional.
- **Observability:** every interaction is a `concierge_sessions` row + `concierge_events` journal;
  surfaced in a `studio/concierge` console for ops.

---

## 11. Joint delivery milestones

| # | Milestone | ATLVS builds | Brio builds |
| --- | --- | --- | --- |
| M0 | **Kickoff & contract freeze** | this kit, sandbox creds | confirm all-channel + tool-calling; Aurora persona/voice |
| M1 | **Bridge foundation** | `brio_connections`, `concierge_sessions/_events`, `/webhooks/brio`, identity resolver | webhook sender, signature scheme |
| M2 | **Tool API + knowledge sync** | `/concierge/*` reads, knowledge push | Aurora tool-calling, corpus ingest |
| M3 | **Guest pilot** (Guest Services · Box Office) | write-backs, Stripe-link order, `/lost-found` | guest + box-office skills, one event |
| M4 | **Workforce** (Crew · Travel & Lodging · Credentials & Access · Site Services · Pay & Expenses) | `/travel`, `/credentials`, `/pay`, `/site` reads; `/requests` intake with all `request_type`s; category routing | five workforce skills + caller gating + fault dedupe |
| M5 | **Client, partner + VIP** (Client Services · Logistics & Dock · Vendor & Contractor · Talent & Booking · VIP & Hospitality) | `/client` (client-safe projection), `/logistics/*`, `/vendor`, `/booking`, `/vip` | five skills + the money/contract guardrails (§6) |
| M6 | **Emergency + GA** | crisis dispatcher, SOS→incident, `/intel` streaming, `/escalations/status`, failover | emergency skill, page-first ordering, surge mode, warm handoff |

---

## 12. Open items for Brio (bring to kickoff)

- **B1.** Webhook signature scheme — confirm HMAC-SHA256 + timestamp + delivery-id (§1.2) works your side.
- **B2.** Tool-calling — can your agent call our `/concierge/*` endpoints live mid-conversation, with our
  Bearer PAT + ~<300ms budget?
- **B3.** Knowledge ingest — do you ingest a structured `facts` + `faq_corpus` bundle (§4), and how is
  re-sync/invalidation handled?
- **B4.** Number provisioning — per-event vs per-org numbers; provisioning API surface.
- **B5.** Transcript/recording retention + DPA terms.
- **B6.** Sandbox environment availability + credentials exchange.
- **B7.** Failover behavior when our Tool API is unreachable (esp. the emergency path, §8 invariant 5).
- **B8.** Can **one agent (Aurora)** carry caller-gated skills across all 12 lines, or does each line need
  its own number and configuration? This materially changes provisioning and cost.
- **B9.** **Concurrent-call ceiling.** Surge mode (§8) assumes Aurora can hold effectively unlimited
  simultaneous emergency callers. What is the real cap, and what happens at it?
- **B10.** **Page-before-return ordering.** Can your runtime guarantee the ICS page is dispatched before
  any clarifying question is asked — i.e. a tool call whose side effect must complete first? This is the
  single hardest requirement in the kit and the one we cannot compromise on.
- **B11.** **Mid-call warm handoff / barge-in.** Can a human take over a live call, with the transcript and
  captured intel already in front of them?
