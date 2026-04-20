# Audit — inoperable features, stubs, and incomplete implementations

**Date:** 2026-04-20  &nbsp;·&nbsp;  **Scope:** every page, API route, edge-function handler, nav entry, and integration in the repo  &nbsp;·&nbsp;  **Method:** static scan (no code modified).

---

## TL;DR

- **44 console pages are literal `PageStub` placeholders** (one import, one line of JSX). Of those, **12 are list-level pages** a user lands on from the sidebar, and **32 are detail pages** reached by clicking a row in an otherwise-working list.
- **1 whole feature is UI vapor**: outbound webhooks. A `/console/settings/webhooks` screen lists 10 event types but there is no `webhooks` table in schema, no API, no delivery code, no registration form. All sub-pages (list, new, detail) are stubs or pure display.
- **Notifications write-side is dead**: read API + bell UI + database schema exist, but **zero call sites insert notifications**. The unread badge will always show 0.
- **5 of 7 background-job handlers are placeholders** and have **zero enqueue call sites** anywhere in the app: `audit.rollup`, `usage.aggregate`, `notifications.digest`, `passkey.cleanup`, `stripe.reconcile`, `email.send`. `email.send` is the most glaring — `lib/email.ts` has a fully-implemented Resend sender that is **never called**.
- **3 "beta / coming-soon" screens** that promise features without implementation: AI Agents, Campaigns, AI Automations new-creation flow.
- **~20 portal persona pages render only `<EmptyState>`** (artist schedule, catering, travel, venue; crew call-sheet; sponsor activations/assets/reporting; vendor pages). These appear intentional "awaiting content" states, but have no upstream code path that would ever populate them.
- **0 TODO / FIXME / HACK / XXX markers in `src/`** — the codebase deliberately avoids those. Absence does **not** imply completeness; the patterns above are the actual debt.

Impact classification (Blocker / Major / Minor) and a prioritized fix queue are in §6.

---

## 1. Fully-stubbed pages — 44 routes

All of these return `<PageStub title="…" description="" />` and nothing else. Navigating to any of them lands the user on the canonical "Placeholder view — wire real module content here" card.

### 1.1 Stubbed LIST pages (12) — a user lands here from the sidebar

The sidebar exposes these and they're dead ends:

| Route | Module in nav |
|---|---|
| [`/console/procurement/rfqs`](src/app/(platform)/console/procurement/rfqs/page.tsx) | Procurement › RFQs |
| [`/console/procurement/rfqs/new`](src/app/(platform)/console/procurement/rfqs/new/page.tsx) | — (deep link) |
| [`/console/production/warehouse/inventory`](src/app/(platform)/console/production/warehouse/inventory/page.tsx) | Production › Warehouse |
| [`/console/production/warehouse/locations`](src/app/(platform)/console/production/warehouse/locations/page.tsx) | Production › Warehouse |
| [`/console/production/dispatch/live`](src/app/(platform)/console/production/dispatch/live/page.tsx) | Production › Dispatch |
| [`/console/production/rentals/availability`](src/app/(platform)/console/production/rentals/availability/page.tsx) | Production › Rentals |
| [`/console/forms/new`](src/app/(platform)/console/forms/new/page.tsx) | Forms (main list is itself `EmptyState`-only) |
| [`/console/ai/automations/new`](src/app/(platform)/console/ai/automations/new/page.tsx) | AI › Automations › + New (linked from CTA button) |
| [`/console/settings/integrations/marketplace`](src/app/(platform)/console/settings/integrations/marketplace/page.tsx) | Settings › Integrations |
| [`/console/settings/webhooks/new`](src/app/(platform)/console/settings/webhooks/new/page.tsx) | — (deep link from webhooks CTA) |
| [`/console/locations/picker`](src/app/(platform)/console/locations/picker/page.tsx) | Internal link target from other flows |
| [`/console/people/credentials/asset-linker`](src/app/(platform)/console/people/credentials/asset-linker/page.tsx) | Credentials flow target |

### 1.2 Stubbed DETAIL pages (32) — reachable by clicking a row

Every one of these is a dead-end detail view under a **working list**. Clicking an invoice, deal, vendor, crew member, etc. lands on a stub:

| Domain | Stubbed detail route |
|---|---|
| AI | `/console/ai/assistant/[conversationId]`, `/console/ai/automations/[automationId]` |
| Events | `/console/events/[eventId]` |
| Finance | `/console/finance/{advances,budgets,expenses,mileage,time}/[id]` — **5 routes** |
| Forms | `/console/forms/[formId]` |
| Locations | `/console/locations/[locationId]` |
| People | `/console/people/[personId]`, `/console/people/crew/[crewId]` |
| Pipeline | `/console/pipeline/[dealId]` |
| Procurement | `/console/procurement/{requisitions,rfqs,vendors}/[id]` — **3 routes** |
| Production | `/console/production/{dispatch,equipment,fabrication,rentals}/[id]` — **4 routes** |
| Projects | `/console/projects/[projectId]/{advancing,budget,calendar,crew,files,gantt,overview,portal-preview,roadmap,tasks}` — **10 routes** |
| Settings | `/console/settings/{integrations,webhooks}/[id]` — **2 routes** |

Every stubbed file is 134–175 bytes — literally:

```tsx
import { PageStub } from "@/components/Shell";
export default function Page() {
  return <PageStub title="…" description="" />;
}
```

---

## 2. `EmptyState`-only pages with no population path (~20)

These render valid UI chrome but have **no application code that would ever produce content** for them. They differ from the PageStubs in that they wear the right branding and copy, but functionally they're inert.

### 2.1 Portal persona pages (16)

Each of these is a `PortalSubpage` shell wrapping an `<EmptyState>`. No corresponding API route, no data fetch, no write path.

| Route | Persona | Copy |
|---|---|---|
| `/p/[slug]/artist/{schedule,catering,travel,venue}/page.tsx` | Artist | "Awaiting set times / menu / travel / venue" |
| `/p/[slug]/client/{files,messages}/page.tsx` | Client | "Awaiting files / messages" |
| `/p/[slug]/crew/{call-sheet,advances,time}/page.tsx` | Crew | "Awaiting call sheet / no advances / no time entries" |
| `/p/[slug]/guest/logistics/page.tsx` | Guest | "Awaiting logistics" |
| `/p/[slug]/sponsor/{activations,assets,reporting}/page.tsx` | Sponsor | "Awaiting activation tracking / assets / reporting" |
| `/p/[slug]/vendor/{credentials,equipment-pull-list,invoices,purchase-orders,submissions}/page.tsx` | Vendor | "Awaiting COI / pull-list / invoices / POs / submissions" |

Three of these (crew/advances, crew/time, artist/catering) have **working platform-side APIs** (`/api/v1/...`) that could feed them — the portal read paths were simply never wired.

### 2.2 Console empty-state-only pages (7)

These render `<EmptyState>` with optional CTA, but the CTA either points to a `PageStub` or nowhere.

| Route | CTA target | Note |
|---|---|---|
| `/console/campaigns` | — | Literal "Campaign builder coming soon" |
| `/console/ai/agents` | — | "Managed Agents in beta — contact sales" |
| `/console/ai/automations` | `/console/ai/automations/new` | **CTA leads to a PageStub** |
| `/console/forms` | (no CTA) | No create path |
| `/console/procurement/catalog` | — | No data, no import path |
| `/console/production/dispatch` | — | Dispatch live stub, logistics stub |
| `/console/production/logistics` | — | — |
| `/console/people/invites` | — | Role invites flow not implemented |
| `/console/proposals/templates` | — | Separate from proposal list |
| `/console/settings/branding` | (limited) | Partial — see §3.5 |

### 2.3 Mobile

| Route | Note |
|---|---|
| `/m/inventory/scan` | "Ready to scan" but no camera/scanner wiring; only a link back to console equipment |

---

## 3. Vapor features — UI promises with no backend

### 3.1 **Webhooks** (BLOCKER for enterprise onboarding)

`/console/settings/webhooks/page.tsx` renders a "Settings › Webhooks" module header with 10 event-type badges (`project.created`, `invoice.paid`, `proposal.signed`, `ticket.scanned`, etc.) and an EmptyState reading *"No endpoints registered. Register your endpoint via the API or contact support."*

Reality:
- **No `webhooks` table in schema.** Grep of `supabase/migrations/**` + `database.types.ts` → zero hits.
- **No `/api/v1/webhooks/*` endpoint.** Only route under that namespace is the inbound Stripe receiver (`/api/v1/webhooks/stripe`).
- **No delivery worker**, no HMAC sign path, no retry path.
- **`/console/settings/webhooks/new` and `[webhookId]`** are both PageStubs.
- The 10 event types listed in the UI are **not emitted anywhere in code** — not even as internal events.

The page exists purely to make the product look like it supports webhooks.

### 3.2 **Campaigns** (MAJOR, labeled as coming-soon)

`/console/campaigns/page.tsx` renders a ModuleHeader + EmptyState titled **"Campaign builder coming soon"**. No table, no API, no navigation to a creation flow. At least this one is honest about its state.

### 3.3 **Notifications write-side** (MAJOR — bell shows 0 forever)

**Works:**
- Schema: `notifications` table exists with RLS.
- Read API: `GET /api/v1/notifications` returns the user's 50 most recent + unread count.
- UI: `<NotificationsBell>` in the glass nav polls every 60 s with optimistic dismiss.
- Inbox: `/console/inbox` reads from the table.

**Missing:**
- **Zero INSERT callsites in app code.** `grep -rn '"notifications"' src | grep insert` → nothing.
- No database trigger that auto-generates notifications (checked `supabase/migrations/20260417_000010_ssot_triggers.sql` + others).
- The job type `notifications.digest` exists but the handler is a placeholder and nothing enqueues it.

Net: the bell UI polls an always-empty table. Every user's count stays at zero regardless of what happens in their workspace.

### 3.4 **AI Agents** (MAJOR)

`/console/ai/agents/page.tsx` claims *"Managed Agents in beta. Spin up persistent agents with their own containers … contact sales to enable."*

Reality:
- No `agents` table.
- No container orchestration.
- No API under `/api/v1/ai/agents`.
- The "contact sales" escape hatch conveniently hides the fact that nothing exists.

### 3.5 **Branding settings** (MINOR — partial)

`/console/settings/branding/page.tsx` — 21 lines — shows an EmptyState suggesting the user can upload a logo + pick colors. The `orgs` table has `branding` + `logo_url` columns, and the `TenantShell` wires them, but the settings UI does not have a form to actually edit them. Uploads happen only via direct DB mutation.

---

## 4. Background-job handlers — 5 of 7 are dead

[`supabase/functions/job-worker/index.ts`](supabase/functions/job-worker/index.ts) declares 7 handlers in its dispatch table. Post-remediation audit:

| Job type | Handler body | Enqueue call sites in app | Status |
|---|---|---|---|
| `export.package` | Full CSV/JSON render + upload (lines 70-136) | ✓ `/api/v1/exports` (async branch) | **Working** |
| `audit.rollup` | `// Placeholder — real rollup writes aggregates into audit_rollups.` | **0** | Dead |
| `usage.aggregate` | `// Placeholder — real aggregator sums usage_events into usage_rollups` | **0** | Dead |
| `notifications.digest` | `// Placeholder — batches per-user notifications into daily digest email.` | **0** | Dead |
| `passkey.cleanup` | `// Placeholder — prunes unused passkeys after 90 days of inactivity.` | **0** | Dead |
| `email.send` | `// Placeholder — routes to lib/email.ts via Resend.` | **0** | Dead *(but `sendEmail` fully implemented — see §5.1)* |
| `stripe.reconcile` | `// Placeholder — pulls the latest payment_intents and reconciles invoices.` | **0** | Dead |

All 6 dead handlers are also included in the `JobType` union in `src/lib/jobs.ts`, giving the appearance of a functional job pipeline that accepts 7 types.

---

## 5. Integrations with implementation but no callers

### 5.1 `lib/email.ts` — `sendEmail()` is implemented, never called

[`src/lib/email.ts:28-68`](src/lib/email.ts) exports a fully-functional `sendEmail()` that hits Resend's `/emails` endpoint with HMAC-authorized headers, multi-recipient support, multi-attachment support, and a graceful no-op when `RESEND_API_KEY` is unset.

**No file outside `lib/email.ts` and `jobs.ts` imports or calls it.** Confirmed via grep. The app sends zero transactional emails despite the integration being production-ready. The pipeline's intended entry point — the `email.send` job handler — is a placeholder (§4).

Flows that logically need email but don't send:
- Proposal sent to client (`proposals.status = 'sent'`) — no email
- Invoice issued (`invoices.status = 'issued'`) — no email
- Cookie consent confirmation — no receipt
- Account deletion request (30-day grace) — no confirmation email
- Passkey registration — no verification
- Incident reports — "admin and EHS lead are notified immediately" copy is a lie

### 5.2 `lib/external/weather.ts` — works but with silent fail

Implemented correctly (Open-Meteo, 3 s timeout, graceful `null`). Consumed only by the call-sheet PDF. Not a stub; graceful-degrade is intentional. Noted here only for completeness — a user would never know when the weather API is unavailable vs the call sheet simply omits it.

---

## 6. Severity-ranked remediation queue

### P0 — Blocker

| # | Item | Impact | Estimated complexity |
|---|---|---|---|
| B1 | **Notifications write-side** (§3.3) — insert `notifications` rows from the meaningful lifecycle events (`invoice.paid`, `proposal.signed`, `deliverable.approved`, `incident.filed`, `ticket.scanned`, `job.failed`). Without this the entire bell UI is theatre. | Users never get told anything | **Medium** — one helper + ~15 insert call sites |
| B2 | **Delete/hide the Webhooks settings UI** until it's real (§3.1), OR implement the webhooks feature. Shipping a page that advertises outgoing-event notifications while not emitting any is deceptive and a compliance concern for enterprise contracts. | Enterprise trust | **Small** (hide) or **Large** (implement: ~200 LOC + table + worker + delivery with HMAC + retry) |

### P1 — Major

| # | Item | Where | Complexity |
|---|---|---|---|
| M1 | **Hook `sendEmail` into real flows** (§5.1). Start with the 6 lifecycle events above. Build templates against the shipped `email_templates` table (already editable in settings). | `src/lib/email.ts` + 6 insert sites | Medium |
| M2 | **Console detail pages** — ship real detail views for finance (advances, budgets, expenses, mileage, time), people (person, crew), events, procurement (requisitions, rfqs, vendors), production (equipment, rentals, fabrication, dispatch), pipeline (deal). **15 list-with-dead-detail routes.** | `src/app/(platform)/console/**/[id]/page.tsx` | Large — 15 × ~100 LOC each |
| M3 | **Project detail tabs** — 10 tabs under `/console/projects/[projectId]/*` are all PageStubs (advancing, budget, calendar, crew, files, gantt, overview, portal-preview, roadmap, tasks). Some have APIs already (tasks, advancing, crew) and just need UI; others need both. | Same pattern as M2 | Large |
| M4 | **Portal persona pages** — ~16 vapor EmptyStates (§2.1). Three have working APIs (crew time, crew advances, artist catering could reuse existing deliverables). The rest need both API read path and seed generation. | `src/app/(portal)/p/[slug]/**/page.tsx` | Medium–Large |
| M5 | **Stripe reconcile worker** (§4) — implement the handler to pull `payment_intent.succeeded` events from Stripe and mark `invoices.status = paid`. Without this, paid invoices stay `sent` until a human reconciles. | `supabase/functions/job-worker/index.ts` | Medium |
| M6 | **Notifications digest worker** (§4 + B1) — once B1 lands, enable the daily digest so high-volume users don't drown in realtime noise. | Same file | Small |
| M7 | **AI Agents** (§3.4) — either implement a minimal agent runtime (cron-triggered claude script with task handle) or remove the UI page. Leaving "in beta" copy on a page that doesn't do anything is not OK. | `/console/ai/agents/page.tsx` | Large (implement) / Small (remove) |

### P2 — Minor

| # | Item | Where | Complexity |
|---|---|---|---|
| m1 | **Branding settings form** (§3.5) — wire a form to edit `orgs.branding` + upload `logo_url` via the existing `branding` storage bucket. | `/console/settings/branding` | Small |
| m2 | **Passkey cleanup worker** (§4) — real implementation (delete `webauthn_credentials` rows where `last_used_at < now() - 90 days`). | `supabase/functions/job-worker/index.ts` | Small |
| m3 | **Audit rollup worker** (§4) — aggregate `audit_log` into weekly buckets for compliance reporting. | Same file | Medium |
| m4 | **Usage aggregation worker** (§4) — aggregate `usage_events` into `usage_rollups`. | Same file | Medium |
| m5 | **Mobile inventory scan** (§2.3) — wire the barcode scanner (same `@zxing/browser` pattern the ticket scanner already uses). | `/m/inventory/scan` | Small |
| m6 | **Campaigns** (§3.2) — either implement a minimal drip-email pipeline or remove the page until scheduled. | `/console/campaigns` | Medium (implement) / Small (remove) |
| m7 | **12 list-level PageStubs** (§1.1) — each needs either a real list view or removal from the nav. The following have no backing table and should likely be dropped: `procurement/rfqs`, `production/warehouse/{inventory,locations}`, `production/dispatch/live`, `production/rentals/availability`, `forms/new`, `ai/automations/new`, `settings/integrations/marketplace`, `settings/webhooks/new`, `locations/picker`, `people/credentials/asset-linker`. | Various | Small (remove) / Medium (implement each) |
| m8 | **Forms module** — `/console/forms` is an EmptyState, its detail + new pages are stubs. Schema has nothing. Ship or remove. | `/console/forms/*` | Medium (schema + UI) / Small (remove) |

---

## 7. Methodology

- Enumeration: `find src/app -name "page.tsx"` → 225 routes.
- Classification heuristic: file size ≤ 300 bytes OR contains `PageStub` OR (uses `<EmptyState>` as sole content AND has no data fetch).
- Nav cross-reference: parsed `src/lib/nav.ts` for every `href:`; joined against the stub list.
- API scan: `find src/app/api -name "route.ts*"` → 57 files; checked for `parseJson` usage, schema presence, handler body length.
- Job-worker scan: `grep 'Placeholder'` in `supabase/functions/job-worker/index.ts`.
- Enqueue scan: `grep 'enqueue\|job_queue'` across src.
- Email wire-up: `grep -r 'sendEmail\|email\.send'` excluding the definition file.
- Webhook table scan: `grep 'create table webhooks\|webhooks_' supabase/migrations/*`.
- Integration callsites: `grep -r '<integration>' src` per vendor.

The complete raw scan is reproducible from this file's §-anchor grep commands.

---

## 8. What is NOT on this list

- **Working features that just happen to have graceful-degrade code paths** (email no-op when env unset, weather null when disabled, CSV export sync path for <10k rows). These are intentional and flagged in their own comments.
- **TODO / FIXME markers**: the codebase contains **zero** such markers in `src/`. That's a stylistic choice, not evidence of completeness — the patterns above are the real debt.
- **Routes that were discovered during the IA audit** and shipped in subsequent commits (`174915f`, `f9e7421`, `d9d3b1e`, `06e83dc`, `f2c59ad`). Those are real and live.
- **Admin-only or internal tooling pages** that are intentionally minimal because they are non-user-facing.

---

## Appendix — commit + grep fingerprints

- Commit at scan time: `2dbf52a`
- Total files scanned in `src/app`: 225 page files + 57 API route files
- Edge functions scanned: 2 (`job-worker`, `purge-deleted-accounts`)
- Reproduce the page inventory: `find src/app -name "page.tsx" | wc -l` → 225
- Reproduce the stub count: `grep -rl PageStub src/app | wc -l` → 44
- Reproduce empty-state-only filter: see §7 heuristic
