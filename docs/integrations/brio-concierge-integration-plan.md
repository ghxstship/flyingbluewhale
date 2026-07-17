# Brio (heybrio.ai) — Native Concierge Integration Plan

**Status:** Draft for review · **Date:** 2026-07-14 · **Owner:** Platform / Integrations

Plan to integrate [Brio](https://heybrio.ai/) — a 24/7 AI phone / chat / SMS answering
platform — natively across the ATLVS ecosystem for **guest** and **crew** roles, spanning
Virtual Guest Services, Virtual Box Office, Virtual Crew Services, Emergency Services, and
VIP & Hospitality Concierge.

---

## 1. The core strategic finding

Brio and this platform are **complementary, not overlapping**:

| Brio brings | We already have |
| --- | --- |
| 24/7 AI **phone answering** (voice/IVR) | Anthropic `@anthropic-ai/sdk` chat + grounded RAG **Copilot** (`src/app/api/v1/ai/copilot`) |
| **SMS** send/reply | Web Push (VAPID) + email (SES) — **no telephony/SMS anywhere** in the repo |
| Overflow / after-hours / **escalation paging** to staff | Human routing via `account_manager_assignments` (persona → manager + chat room) |
| Call summaries → CRM | First-class records: `assignments`, `event_guides`, `incidents`, `scheduler_*`, `chat_*` |

**The only capability we structurally lack is the voice + SMS channel.** Confirmed by the codebase
sweep: Twilio appears only in marketing copy; `crisis_alerts.channels` and
`notification_deliveries.recipient_kind` model `sms` as enum values but **no sender is wired**.

> **Design principle:** Brio owns the *channel* (voice/SMS front door). We own the *brain and the
> records*. A thin **anti-corruption bridge** translates between them. We do **not** rebuild what Brio
> does, and Brio never becomes the system of record.

---

## 2. Integration reality & the contract dependency

Brio publishes **no public API, SDK, or webhook documentation** — it's a productized black-box SaaS
that advertises CRM sync (MarketSharp, GoHighLevel, HubSpot) and staff escalation. This is the single
biggest risk to a "native" integration and must be resolved before build.

**Three integration modes, in order of preference:**

1. **Partner/enterprise API (preferred).** Brio exposes inbound webhooks (call/chat/SMS summaries,
   bookings, escalations) + an outbound "tool/knowledge" API so their agent can query our data live.
   → Enables true native concierge.
2. **CRM-bridge fallback.** Brio already syncs to HubSpot/GoHighLevel. We stand up a **compatible
   webhook endpoint** and register as the "CRM" so summaries/leads/bookings flow to us. One-way, coarse,
   but ships without Brio engineering.
3. **Telephony-native fallback (build-around).** If Brio can't integrate, provision Brio numbers per
   event and treat it purely as a voice/SMS relay; for **chat**, embed our **own** AI concierge natively
   (we already have the stack). Reserve Brio for voice/SMS only.

**Action (Phase 0):** a discovery call with Brio to confirm which mode is available. The rest of this
plan is written against Mode 1 with explicit fallbacks noted per component.

---

## 3. Target architecture

```
  Guest / Crew                     BRIO BRIDGE (anti-corruption layer)          ATLVS Platform (SSOT)
 ┌────────────┐   inbound webhook  ┌──────────────────────────────┐   reads    ┌──────────────────┐
 │ Phone call │ ─────────────────▶ │ /api/v1/webhooks/brio        │ ─────────▶ │ event_guides     │
 │ SMS        │  (summary/booking/ │  shared-secret, constant-time│            │ assignments/     │
 │ Web chat   │   escalation/SOS)  │  → concierge_sessions        │            │  ticket_details  │
 └────────────┘                    │  → maps to real records      │            │ scheduler_*      │
       ▲                           └──────────────┬───────────────┘            │ incidents        │
       │  live answers / tools                    │ writes                     │ crew_members     │
       │                           ┌──────────────▼───────────────┐            │ chat_rooms       │
       └───────────────────────────│ Scoped tool API (PAT scopes) │ ◀───────── │ account_manager_ │
         Brio agent calls our API  │ /api/v1/concierge/*          │   knowledge│  assignments     │
         + we push knowledge sync  │ + knowledge-base sync (RAG)  │   sync     │ notifications    │
                                   └──────────────────────────────┘            └──────────────────┘
```

**Four bridge components:**

- **A. Inbound receiver** — `src/app/api/v1/webhooks/brio/route.ts`, modeled exactly on
  `webhooks/ses-inbound/route.ts` (shared secret `BRIO_WEBHOOK_SECRET` via `X-Webhook-Secret`,
  constant-time compare). Normalizes every Brio event into a `concierge_sessions` / `concierge_events`
  row, resolves identity, and dispatches to the right write-back + escalation.
- **B. Scoped tool API** — new `concierge:read` / `concierge:write` PAT scopes (per `src/lib/auth.ts`
  `assertScope`), exposing read endpoints Brio's agent calls as "tools" (ticket status, call time, guide
  lookup, slot availability) and write endpoints (create booking, file request, raise incident). Each
  token is **org- and event-scoped** so a Brio agent for one event can never read another's data.
- **C. Knowledge sync** — per-event knowledge base pushed to Brio (or served on demand): reuse the RAG
  corpus (`src/lib/ai/corpus.ts`, `document_chunks`) + `event_guides.config` typed sections. This is what
  makes answers accurate instead of generic.
- **D. Connector config** — a `brio_connections` row per org (encrypted creds, mirrors
  `accounting_connections` / Slack pattern), managed at `studio/settings/integrations`.

---

## 4. New data model

Follows LDP naming (`*_state`, never `status`) and the existing connector-credential pattern.

- **`brio_connections`** — one per org. Encrypted `auth_ciphertext`, provisioned phone numbers,
  per-event number map, `connection_state` (`pending`/`active`/`suspended`). RLS org-scoped.
- **`concierge_sessions`** — the SSOT for every Brio interaction (parallels `ai_conversations` but
  channel-aware). Columns: `org_id`, `project_id`, `channel` (`voice`/`sms`/`chat`), `direction`
  (`inbound`/`outbound`), `party_kind` + resolved `party_user_id`/`party_crew_id`/`party_external_id`
  (reuse the `assignments` party model), `service_line` (`guest`/`box_office`/`vip`/`crew`/`travel`/
  `credentials`/`site`/`pay`/`client`/`logistics`/`vendor`/`talent`/`emergency`),
  `intent`, `transcript` jsonb, `ai_summary`, `resolution_state`
  (`self_resolved`/`escalated`/`booked`/`abandoned`), `escalated_to_user_id`, `linked_record_type/_id`.
- **`concierge_events`** — append-only journal per session (`event_kind`:
  `message`/`intent_detected`/`escalation`/`booking`/`incident_raised`/`handoff`), mirroring the
  `assignment_events` pattern. Enables audit + analytics.
- **Reuse, don't rebuild:** link escalations into existing `chat_rooms` (via
  `account_manager_assignments.chat_room_id`), bookings into `scheduler_bookings`, emergencies into
  `incidents` / `crisis_alerts`, bell/push via `notifications` + `src/lib/push/send.ts`. Add one
  `PushKind` value `concierge` to `src/lib/push/send.ts` + `notification_kind_catalog`.

---

## 5. The five opportunities (each mapped to real surfaces)

### 5.1 Virtual Guest Services — GVTEWAY `/p` (guest)
A per-event public phone/chat/SMS line the guest can call/text with "know before you go" questions.

- **Reads:** `event_guides` (KBYG sections — `src/lib/guides/types.ts`), `assignments` +
  `ticket_assignment_details` (my ticket: tier/zone/gate/seat), `/p/[slug]/guest/{schedule,logistics}`.
- **Identity:** inbound phone/email → `assignment_external_holders` (already claims by email/phone) or
  `users`.
- **Write-back / escalate:** unresolved → `account_manager_assignments` persona `guest` → human via
  `chat_rooms` + push. Booking a time → `scheduler_bookings`.
- **Fallback if no Brio API:** embed our own AI concierge in `/p/[slug]/guide` using the `message_channels`
  `ai_assistant` kind (already modeled) — chat native, Brio for voice/SMS only.

### 5.2 Virtual Box Office — GVTEWAY `/p` + `studio/marketplace/box-office`
Ticket status, transfers, will-call, refunds, and simple order-taking over voice/SMS.

- **Reads:** `assignments` (entitlements), `guest_lists`/`guest_list_entries` (`src/lib/box_office.ts`),
  `ticketing_connections` (3rd-party sales), `ticketing_sales_snapshots`.
- **Write:** take an order → create `assignment` / `guest_list_entry` (with `scan_code`), or hand off a
  Stripe checkout link (`src/app/api/v1/stripe/checkout`). Will-call claim → `external_holder` by phone.
- **Escalate:** box-office staff via account managers. **Guardrail:** no card data over the AI line —
  payments always via a Stripe link, never spoken (aligns with the platform's no-credentials rule).

### 5.3 Virtual Crew Services — COMPVSS `/m` (crew)
A crew call line: call-times, "where do I report," clock/onboarding issues, time-off.

- **Reads:** `assignments` + `advances` (`src/lib/db/advancing.ts`) for shift/call detail,
  `event_guides` crew persona, `crew_members` identity (phone match).
- **Write:** time-off request → `time_off`, quick task → `tasks`, punch problem → flag. Onboarding
  questions read `/m/onboarding`.
- **Escalate:** production coordinator via `account_manager_assignments` + push (`assignment`/`concierge`
  kinds). Realtime surfaces already refresh via `RealtimeRefresh`.

### 5.4 Emergency Services — safety (highest-stakes, strictest guardrails)
Three directions: **outbound mass-alert** (the missing `crisis_alerts` dispatcher), an **inbound help/SOS
line**, and **real-time intel + surge capacity** during an active incident.

- **Outbound:** `crisis/alerts` route already inserts `crisis_alerts` with an `sms` channel but **no
  fan-out** — Brio becomes the SMS/voice blast dispatcher against `audience{roles,venues,personas}`.
- **Inbound SOS:** call/text → auto-create `incidents` (with `ai_summary`) → escalate into
  `major_incidents` ICS roles + push the on-call. Fills the missing SOS/panic surface.
- **Real-time intel (the strongest argument for Aurora here):** after the page fires, Aurora keeps
  gathering structured detail — exact location, affected count, hazard type, access route — and streams it
  onto the live incident timeline while responders are en route. Responder surfaces already subscribe to
  realtime, so it lands on their screens as it's captured. Additive to the human response, never a
  substitute for it.
- **Surge capacity:** a major incident is exactly when the human channel saturates and calls get dropped.
  Aurora absorbs unlimited concurrent callers, captures what each one knows, and priority-queues by
  severity — a caller who reaches a listening AI beats one who reaches a busy tone.
- **Non-negotiable guardrails:** (1) **page first, gather second** — the page dispatches before any
  clarifying question, and intel collection never delays it by any amount; (2) AI is **triage + intel +
  routing only**, never the sole responder, never diagnosing or instructing on treatment; (3) mandatory
  local-emergency-number disclaimer, repeated the moment severity reads life-threatening; (4) hard
  fallback paging if Brio or the Tool API is down; (5) warm handoff so the caller never re-tells the
  story; (6) full audit via `concierge_events` + `incident` timeline. Full contract in the kit §8. Ship
  this **last in build order** — not because it matters least, but because it's the least forgiving.

### 5.4b Client Services — the revenue relationship (ATLVS CRM side)
The org's own customers — the people who hired the production. ATLVS is ERP × CRM × PM, so this data is
already the console's core.

- **Reads:** `projects.xpms_phase` (what phase are we in), `proposals` (`PROP-` doc numbers), `invoices`
  (`INV-`) + AR aging, `change_orders`, `approval_instances` (what's awaiting whose sign-off),
  `deliverables`, `show_recaps`.
- **Write:** client ask → `tasks` via `/requests` (`client_request`); a call with the producer →
  `scheduler_bookings`.
- **Escalate:** `account_manager_assignments` `client` persona → the account manager / producer.
- **The critical guard — margin leakage.** This is the only line where the caller is a *counterparty to the
  org's economics*. Aurora must never disclose internal cost, margin, vendor rates, or budget detail; a
  client sees sell price and their own documents, nothing upstream. `/concierge/client` returns a
  **client-safe projection** and the token scope — not the prompt — makes `budgets` / `cost_centers` /
  `purchase_orders` unreachable on this line. She never quotes a price, never approves or prices a change
  order, never commits to a date the record doesn't hold.

### 5.5 VIP & Hospitality Concierge — GVTEWAY `/p/vip` + `/p/hospitality`
The premium tier — a dedicated concierge line per VIP, where AI voice shines most.

- **Reads:** `/p/[slug]/vip` (`accommodation`, `itinerary`, `transport`), `/p/[slug]/hospitality`,
  advancing packets (`src/lib/advancing/`), `scheduler_*` for bookings.
- **Write:** requests → `advance_submissions` (the SES-inbound mirror pattern already exists), bookings →
  `scheduler_bookings`, transport/accommodation asks → hospitality records.
- **Escalate:** `account_manager_assignments` personas `vip` / `hospitality` (both already first-class) →
  dedicated concierge, white-glove SLA.

---

## 6. Cross-cutting concerns

- **Identity resolution** (`src/lib/concierge/identity.ts`): inbound phone/email → match order
  `users` → `crew_members` → `assignment_external_holders` (claim-by-phone/email already exists) →
  anonymous. Drives which service line + which data scope applies.
- **Escalation routing:** single reuse of `account_manager_assignments` (15 personas incl. guest/crew/
  vip/hospitality) → `manager_user_id` + `chat_room_id`; page via `notifications` + push. One code path
  for all five service lines.
- **Knowledge freshness:** re-sync the per-event corpus on `event_guides` / `assignments` changes so Brio
  never answers stale. Reuse the `embedding-worker` cadence.
- **Tenancy & RLS:** every Brio token is org+event scoped; `concierge_sessions` is RLS org-scoped; no
  cross-event leakage (this platform already had a cross-tenant view-leak incident — treat scoping as
  P0).

---

## 7. Compliance & safety guardrails

- **Call-recording & AI-disclosure consent** — two-party-consent states require an upfront notice; SMS
  requires **TCPA** opt-in. Consent captured and stored on `concierge_sessions`.
- **No credentials / no payments over the line** — enforced by design (Stripe links only), consistent
  with the platform's credential-handling rules.
- **PII/PHI** — medical/`incidents` PHI is already encrypted; concierge must never echo PHI over voice;
  emergency medical calls route straight to human.
- **Graceful degradation** — if Brio is unreachable, voice/SMS fails over to a recorded fallback + the
  existing push/email channels; the platform's records remain fully functional without Brio.

---

## 8. Phased roadmap

| Phase | Scope | Ships |
| --- | --- | --- |
| **0. Discovery** | Confirm Brio integration mode (API vs CRM-bridge vs telephony-only); commercials; number provisioning | Signed integration contract + decision on Mode 1/2/3 |
| **1. Bridge foundation** | `brio_connections`, `concierge_sessions`/`_events`, `/webhooks/brio` receiver, identity resolver, `concierge` PushKind, `studio/settings/integrations` panel | Inbound events land as records; escalation → account managers works |
| **2. Guest + Box Office (read-first)** | Virtual Guest Services + Box Office over one pilot event; knowledge sync from `event_guides`; scoped tool API (read) | Guests get answers; unresolved escalate to humans; sessions logged |
| **3. Crew Services** | COMPVSS crew line; write-backs (time-off, tasks); advances/onboarding reads | Crew self-serve call/SMS line |
| **4. VIP & Hospitality** | Dedicated VIP concierge; scheduler + advancing write-backs | White-glove premium line |
| **5. Emergency Services** | Outbound `crisis_alerts` dispatcher + inbound SOS → incidents/ICS; full guardrails + failover | Mass-alert + triage line, human-in-loop |

---

## 9. Decisions needed before build

1. **Integration mode** — does Brio offer a partner API/webhooks (Mode 1), only CRM-bridge (Mode 2), or
   nothing (Mode 3, build chat ourselves)? Everything downstream forks here.
2. **Channel split** — Brio for **all** channels (voice/SMS/chat) for consistency, or Brio voice/SMS +
   our native AI for chat (we already have the stack, lower cost, full control)?
3. **Build-vs-buy line** — given we already own the AI brain + records, is Brio's value the channel alone?
   If so, Mode 3 + a thin telephony vendor (e.g. Twilio directly) may be cheaper and more native than
   Brio.
4. **Emergency scope** — is an AI-fronted emergency line acceptable to your risk/legal posture, or should
   Emergency stay human-only with AI limited to outbound alerts?
5. **Per-event vs per-org numbers** — one concierge number per event, per venue, or per org?

---

## 10. Risks

- **Black-box dependency** — no public API is the dominant risk; Mode 2/3 fallbacks mitigate.
- **Safety liability** — emergency mishandling; mitigated by human-in-loop + disclaimers + ship-last.
- **Knowledge staleness** — wrong answers erode trust; mitigated by change-triggered re-sync.
- **Cost at scale** — per-minute voice + per-message SMS across many events; needs a usage model in
  Phase 0.
- **Redundant capability** — much of "chat concierge" we can already build; risk of paying Brio for what
  we own. Decision #2/#3 resolves this.
