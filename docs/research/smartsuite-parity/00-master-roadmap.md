# SmartSuite Parity — Master Roadmap

> Synthesis across five thematic gap-analysis reports comparing SmartSuite (help.smartsuite.com, ~500+ articles) to LYTEHAUS Technologies (`flyingbluewhale`) at commit `71a40e4`, dated 2026-05-04.
>
> Read this first. The five companion reports drill into specific subsystems — every claim here links to the most-relevant detail in those docs.

## Companion reports

| #   | Topic                                   | Doc                                                                            | Words |
| --- | --------------------------------------- | ------------------------------------------------------------------------------ | ----- |
| 01  | Fields & Formulas                       | [01-fields-and-formulas.md](./01-fields-and-formulas.md)                       | 3,473 |
| 02  | Views & Dashboards                      | [02-views-and-dashboards.md](./02-views-and-dashboards.md)                     | 2,921 |
| 03  | Automations & AI                        | [03-automations-and-ai.md](./03-automations-and-ai.md)                         | 2,703 |
| 04  | Solutions, Permissions, Collab, Account | [04-solutions-permissions-collab.md](./04-solutions-permissions-collab.md)     | 3,365 |
| 05  | Mobile, Forms, Docs, Integrations, API  | [05-mobile-forms-docs-integrations.md](./05-mobile-forms-docs-integrations.md) | 4,487 |

---

## 1. Executive summary

SmartSuite's competitive moat isn't any single feature — it's the **polymorphism**: one record set rendered nine different ways, one comment thread on every record, one AI Assist callable from any field or automation, one share-link primitive for views/dashboards/forms/PDFs. LYTEHAUS today ships strong vertical slices (`DataTableInteractive`, COMPVSS scanners, Boarding Pass, Stripe Connect) but each is hand-rolled per page. **Closing parity is mostly about lifting these slices to primitives** — we already have most of the data and infrastructure.

**Eight architectural keystones** (each unlocks 5+ downstream features):

1. **`view_configs` table** — promote `user_preferences.table_views[]` JSON into a sharable, named, role-scoped views table. Unblocks Kanban, Calendar, Timeline, Gantt, Chart, Map view types as drop-in renderers; Spotlight; locked views; public share links; embeddable views. ([detail](./02-views-and-dashboards.md#6-top-10-implementation-recommendations))
2. **`<CommentThread>` primitive on `annotations`** — the polymorphic `annotations` table (with `parent_id`, `assigned_to`, `status` enum, watchers, notify trigger) is structurally already SmartSuite Conversations. It's wired only to one route. Lifting it to a Client Component drops onto every detail page. ([detail](./04-solutions-permissions-collab.md#1-generic-commentthread-primitive-on-top-of-annotations-m))
3. **Automation runner on top of `job_queue` + `webhook_endpoints`** — `automations` table exists with `trigger_kind`/`steps` JSONB but **no runner**. The execution primitives (`claim_jobs()` SKIP LOCKED, exp-backoff retries, HMAC-signed webhook outbox, `notify()` event registry) are all shipped. The gap is glue. ([detail](./03-automations-and-ai.md#2-automation-engine-architecture))
4. **`runAI({ prompt, outputSchema })` action** — `extract-credential.ts` is the right pattern (Anthropic + Zod-validated structured output). Generalizing it unlocks AI Field Agents, AI Assist automation action, classify/sentiment/summarize. ([detail](./03-automations-and-ai.md#5-ai-capabilities))
5. **`record_grants` + `teams` tables** — adds SmartSuite's six record-level roles (`full | editor | contributor | assignee | commenter | viewer`) and Teams. Layers below the existing `is_org_member()` so org-admins still bypass. ([detail](./04-solutions-permissions-collab.md#9--record_grants-table-for-smartsuite-style-record-level-roles-l))
6. **`share_links` table with expiry + passcode + HMAC token** — one primitive covers public dashboards, public forms, share-a-view, share-a-PDF, guest-record-access. Today every public surface is hand-rolled. ([detail](./04-solutions-permissions-collab.md#10--public-share-links-with-expiry--password-m))
7. **PDF render target on the Boarding Pass schema** — `GuideConfig` is a typed, sectioned, JSON-driven document model that is already half of a Document Designer. Adding `@react-pdf/renderer` + a private-by-default signed-URL output beats SmartSuite's design (which exposes public guessable URLs by default per their Mar 2026 release notes). ([detail](./05-mobile-forms-docs-integrations.md#4-document-designer--pdf-generation))
8. **Formula engine MVP** — server-side TS evaluator with 6 functions (`IF`, `SUMIF`, `DATEDIFF`, `TODAY`, `CONCAT`, `ROUND`) + a `formula_definitions` table, no editor UI in v1. Replaces the calculated-state-as-code pattern (deliverable progress, project completion %, payment-app % billed) with calculated-state-as-data. ([detail](./01-fields-and-formulas.md#3-formula-engine))

**Three places we already exceed SmartSuite** (keep, market):

- **Identity & security** — WebAuthn passkeys are shipped end-to-end; SmartSuite docs don't mention passkeys. Stripe Connect onboarding, HMAC-signed outbound webhooks, geolocation-attached scans are all production-grade and SmartSuite has none of these.
- **Data table** — `DataTableInteractive` (1,729 LOC) ships virtualization, multi-key sort, column pinning, drag-reorder, density toggle, URL state sync, bulk actions, CSV export. Pinning + URL state aren't even documented on the SmartSuite Grid.
- **Field-level a11y** — `Input.tsx` has stronger ARIA hygiene (`aria-required`, `aria-invalid`, `aria-describedby`, role=alert error, async-validate spinner, sr-only label) than SmartSuite documents. Logical Tailwind props give us free RTL.

---

## 2. Top 20 cross-cutting recommendations

Synthesized across the five reports, ranked by **impact ÷ effort**. Sequenced where dependencies bind.

| Rank | Recommendation                                                                                                                                                             | Subsystem   | Effort | Unlocks                                                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ | ----------------------------------------------------------------------- |
| 1    | **`<DueDateBadge>` + `closed_at` convention** across tickets/deliverables/RFIs/submittals/punch                                                                            | Fields      | S      | Visible operational signal everywhere                                   |
| 2    | **Spotlight/conditional row formatting on `DataTable`** via `Column.rowClassName` + saved-view rule list                                                                   | Views       | S      | Overdue red, blocked amber, complete green — 30 visual signals          |
| 3    | **Column totals / summary footer** on `DataTable` (`total: 'sum'\|'avg'\|'min'\|'max'`)                                                                                    | Views       | S      | Finance/budgets become usable                                           |
| 4    | **Auto-Number with prefix + date tokens** — generalize `xpms_atoms.sequence_no` into `next_sequence(org, scope, fmt)`                                                      | Fields      | S      | INV-2026-0017, RFI-MMW26-014 etc. — kills the alpha-tier UUID look      |
| 5    | **Notifications inbox UI** at `/me/notifications/inbox` — `notifications` table already populated by triggers                                                              | Collab      | S      | Bell-icon UI users expect                                               |
| 6    | **Notification preferences resolver** — wire the `user_preferences.ui_state.notifications` matrix into `shouldNotify(userId, event, channel)`                              | Collab      | S      | Today the matrix is purely cosmetic                                     |
| 7    | **Camera-based `<CameraScanner>`** using `BarcodeDetector` API + `@zxing/browser` fallback — replaces keyboard-wedge in check-in/gate                                      | Mobile      | S      | SmartSuite has zero camera scanning — clean leapfrog                    |
| 8    | **`AddressField` with structured columns + Mapbox/Places autocomplete** — decompose `clients.address text` into `street1/locality/region/postal_code/country_code/lat/lng` | Fields      | M      | Cascades into venues, vendors, accommodations, dispatch, mappable lists |
| 9    | **Generic `<KanbanBoard>` view component** — `@dnd-kit` already in deps; status enums already on tickets/tasks/punch/rfis/submittals/requisitions/POs/incidents            | Views       | M      | One component, 8+ list pages get a Kanban view                          |
| 10   | **`view_configs` table + sharing scope (`private \| org \| public`)**                                                                                                      | Views       | L      | Keystone — see §1                                                       |
| 11   | **`<CommentThread>` primitive on `annotations`** + wire into project/deliverable/ticket/daily-log detail pages                                                             | Collab      | M      | Keystone — see §1                                                       |
| 12   | **`@mentions` parser + notification fan-out** — extend `annotations_notify()` to read `metadata.mentions[]`                                                                | Collab      | M      | Mentions, team-mentions (after Teams)                                   |
| 13   | **Automation runner — `automation.run` job-queue handler + step interpreter + `automation_runs` ledger**                                                                   | Automations | L      | Keystone — see §1                                                       |
| 14   | **5 starter automation actions** (`notify`, `email.send`, `webhook.send`, `record.update`, `delay`) as a registry under `src/lib/automations/actions/`                     | Automations | M      | First demonstrable automation                                           |
| 15   | **Step builder UI** — replace raw `<pre>JSON</pre>` with drag-add block editor rendered from action `schema`                                                               | Automations | L      | Self-serve automation authoring                                         |
| 16   | **Domain event bus** — extend `notify.NotifyEvent` to a discriminated union; add `domain_events` + `automation_subscriptions(org_id, event_type, automation_id)`           | Automations | L      | Record-event triggers                                                   |
| 17   | **`runAI()` generic action** — lift `extract-credential.ts` into `runAI({ prompt, outputSchema, model, files? })`                                                          | AI          | M      | AI Assist action, AI Field Agents, classify, sentiment, summarize       |
| 18   | **Generic `<CalendarView>` (day/week/month/agenda + drag-reschedule)** — replace bespoke `ScheduleCalendar.tsx`                                                            | Views       | L      | Events, tasks, inspections, safety briefings, transport                 |
| 19   | **PDF render target for Boarding Pass schema** — `@react-pdf/renderer` + signed-URL output                                                                                 | Docs        | L      | Document Designer parity, with private-by-default lead                  |
| 20   | **`share_links` table + `/share/[token]` portal route** with expiry, passcode_hash, max_uses                                                                               | Sharing     | M      | Public dashboards/views/forms/PDFs in one stroke                        |

**Honourable mentions** (not top 20 but cheap wins):

- **My Work rollup** at `/me/work` — Overdue/Today/Upcoming/Later/No Due Date buckets across all assigned resources (S).
- **Per-record activity drawer** — `<ActivityDrawer table id>` reading `audit_log` (S).
- **Dashboard deep-links to tabs** — `?tab=` URL state on every tabbed page (S).
- **Starred/favorites system** — `user_stars(user_id, resource_type, resource_id)` (S).
- **Member directory** at `/console/people` with team facets (S, after Teams ships).
- **Filter by current user** — chip on every list view that filters to `assigned_to = me` (S).
- **Dashboard MVP — composable canvas** — drag-drop widget palette on top of #10 (`view_configs`); 4 widget types (KPI / chart / saved-view-embed / markdown) (XL but MVP is L).

---

## 3. Phased roadmap

Sequencing assumes one engineer dedicated; doubles up where work parallelizes.

### Phase 1 — Visible polish & operational signal (2–3 weeks)

Goal: every list, detail, and dashboard surface picks up SmartSuite-grade visual clarity without schema rewrites. All S-effort, all from rec #1–#7 above.

- `<DueDateBadge>` + `closed_at`/`closed_by` convention rolled into 6 tables.
- Spotlight rules + column totals on `DataTableInteractive`.
- Auto-Number SQL helper + roll into invoice/PO/RFI/ticket numbering.
- Notifications inbox + `shouldNotify()` resolver.
- `<CameraScanner>` replaces keyboard-wedge in `/m/check-in` and `/m/gate/scan`.

**Exit criteria:** every operator-facing list shows red/amber/green at a glance; every numeric column footers; every numeric ID is human-readable; the bell icon is real; mobile scans work without a sled.

### Phase 2 — Communication & collaboration spine (3–4 weeks)

Goal: every record has a comment thread, every comment can @-mention, every member has an inbox. Real-time presence in v1.5.

- `<CommentThread>` Client Component on top of `annotations`. Wire into Project, Deliverable, Ticket, Daily Log details.
- `@mentions` parser, mention tokens stored in `annotations.metadata.mentions[]`, notify-trigger fan-out.
- Per-record `<ActivityDrawer>` reading `audit_log`.
- Web Push (VAPID) — push channel works on COMPVSS.
- Supabase Realtime presence + record updates (`presence:{table}:{id}` channels).
- TOTP 2FA enrollment + per-role enforcement (`orgs.require_2fa_for jsonb`).

**Exit criteria:** any record can be commented on, mentioned-into, watched, and updated live. 2FA flips from "Disabled" UI label to a real enrollment.

### Phase 3 — View polymorphism (4–5 weeks)

Goal: same data, nine views. Saved views become a first-class shareable artifact.

- `view_configs` table (private/org/public scope) + RLS + sidebar selector.
- `<KanbanBoard>` consuming any status-bearing table (8+ pages light up).
- `<CalendarView>` (day/week/month/agenda + drag-reschedule).
- `<TimelineView>` (zoomable swimlanes, no dependency math yet).
- `<MapView>` lifting `LiveDispatchMap` to consume any address-bearing table.
- `<ChartView>` config-driven on `recharts` (already `^3.8.1`).
- Composable Dashboard canvas MVP — 4 widget types, drag-drop layout.
- `share_links` table + `/share/[token]` route — public dashboards & saved views.

**Exit criteria:** "send me the dashboard" gets a one-click public link. Tickets and tasks have a Kanban. Look-ahead has a Timeline. The schedule grid is editable by drag.

### Phase 4 — Automation engine + AI Assist (4–6 weeks)

Goal: customers author automations end-to-end. AI Field Agents on the highest-value field.

- `automation_runs` + `automation_step_runs` ledger tables.
- `automation.run` job-queue handler + step interpreter.
- 5 starter actions (`notify`, `email.send`, `webhook.send`, `record.update`, `delay`).
- Step builder UI replacing the JSON `<pre>`.
- Domain event bus + `automation_subscriptions`.
- Inbound webhook trigger per-automation with HMAC.
- Schedule trigger via `automation_schedules` + `rrule` text.
- Condition evaluator (JSON DSL `{ all: [{field, op, value}] }`).
- `runAI()` generic action + `ai.assist` automation action.
- AI Field Agent v0 — `tickets.summary` auto-summarizing description.
- Run history page with per-step timeline.

**Exit criteria:** customer authors a "when ticket scanned, send Slack DM to area lead" automation in the UI without engineering. AI Field Agent demoes a one-click summary.

### Phase 5 — Permissions, account, integrations breadth (4–6 weeks)

Goal: enterprise-tier checkboxes; production-friendly integrations.

- `teams` + `team_members` tables, `@team-slug` mention fan-out, team-scoped grants.
- `record_grants` + 6-role enum + `record_role_for(table, id)` helper.
- SAML SSO (Supabase Auth `sso.providers`) + SCIM provisioning.
- IP restrictions (`org_ip_allowlist`) enforced in `proxy.ts`.
- Event log publisher to S3 / Datadog (Enterprise tier).
- Slack integration — OAuth install + DM delivery + channel mapping.
- Zapier app — 4 triggers, 4 actions wired to existing webhook events.
- Make.com app — same backend, document `/api/v1/*` cleanly first.
- Public REST + OpenAPI docs site at `/api-docs`.
- Plan-aware rate limits + standard 429 headers (`RateLimit-*`, `Retry-After`).

**Exit criteria:** a procurement-driven enterprise sale can survive security review. Migrators from Airtable/Monday have a Zapier path.

### Phase 6 — Document Designer + Forms v2 + onboarding (3–4 weeks)

Goal: every document model is JSON-driven, PDF-renderable, private-by-default. Public forms grow to v2. New orgs land softly.

- PDF render target for `GuideConfig`/Boarding Pass via `@react-pdf/renderer`.
- Generalize `GuideSection` → `DocSection` with `merge_table` directive.
- Conditional sections + repeating linked-record sections.
- Forms v2 — conditional logic, file upload, captcha (Cloudflare Turnstile), redirect, prefill, passcode, payments via existing Stripe.
- Templates gallery + project-from-template flow.
- Async import jobs + "from Airtable" wizard.
- First-run wizard at `/console/onboarding/[step]`.

### Phase 7 — Formula engine + advanced fields (4–8 weeks, parallel)

Goal: lift calculated state from code into data.

- Formula MVP — server-side TS evaluator + `formula_definitions` table.
- `<CalculatedField>` abstraction → Count/Rollup/Lookup as configs.
- 6 starter functions (`IF`, `SUMIF`, `DATEDIFF`, `TODAY`, `CONCAT`, `ROUND`).
- `<FormulaInput>` editor with autocomplete (Phase 7.2).
- Currency multi-currency + locale formatter.
- `PhoneField` with country code + flag + type.
- `AssigneeField`, `ChecklistField`, `AttachmentField` reusable primitives.
- Replace `Markdown.tsx` (read-only) with TipTap editor for SmartDoc-class fields.

---

## 4. Architectural keystones — visual

```
                       ┌──────────────────────────────┐
                       │  view_configs table          │  ← keystone #1
                       │  (private | org | public)    │
                       └──────────┬───────────────────┘
                                  │
          ┌───────────┬───────────┼───────────┬────────────┐
          ▼           ▼           ▼           ▼            ▼
       Kanban    Calendar    Timeline      Chart        Map
          │           │           │           │            │
          └───────────┴────┬──────┴───────────┴────────────┘
                           ▼
                   Dashboard canvas ─────────► share_links ──► public link
                                                                (keystone #6)

                       ┌──────────────────────────────┐
                       │  annotations table           │  ← keystone #2
                       │  (kind/parent/status/assign) │
                       └──────────┬───────────────────┘
                                  │
          ┌───────────┬───────────┼───────────┬────────────┐
          ▼           ▼           ▼           ▼            ▼
      Comments   Mentions    Watchers    Reactions    Activity
          │           │           │           │            │
          └───────────┴────┬──────┴───────────┴────────────┘
                           ▼
                   Realtime presence ──────► Web Push

                       ┌──────────────────────────────┐
                       │  job_queue + webhook outbox  │  ← keystone #3
                       │  (already shipped)           │
                       └──────────┬───────────────────┘
                                  │
          ┌───────────┬───────────┼───────────┬────────────┐
          ▼           ▼           ▼           ▼            ▼
       Triggers   Schedule    Webhooks    Actions     Run history
       (events)   (rrule)     (in/out)   (registry)   (ledger)
                                            │
                                            ▼
                                       runAI() ──► AI Field Agents
                                       (keystone #4)

                       ┌──────────────────────────────┐
                       │  record_grants + teams       │  ← keystone #5
                       │  (6 record-level roles)      │
                       └──────────────────────────────┘

                       ┌──────────────────────────────┐
                       │  GuideConfig / DocSection    │  ← keystone #7
                       │  (JSON-driven template)      │
                       └──────────┬───────────────────┘
                                  │
                  ┌───────────────┼───────────────┐
                  ▼               ▼               ▼
              HTML view      PDF render      e-sign

                       ┌──────────────────────────────┐
                       │  formula_definitions         │  ← keystone #8
                       │  (TS evaluator, 6 fns v1)    │
                       └──────────────────────────────┘
```

The eight keystones are independent of each other — they can be sequenced or parallelized. Phases 1, 3, 4, 6 each unlock a downstream tree.

---

## 5. Where LYTEHAUS already exceeds SmartSuite (keep, market)

| Capability                                           | LYTEHAUS                                                                               | SmartSuite                                                             |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| WebAuthn passkeys (registration + login)             | Shipped — `webauthn_challenges` table, `PasskeyManager.tsx`, `@simplewebauthn/browser` | Not documented                                                         |
| Outbound webhooks with HMAC-SHA256 + delivery outbox | `webhook_endpoints` + `webhook_deliveries` + 16 canonical event types                  | Documented but undifferentiated                                        |
| Stripe Connect onboarding + Stripe Express payouts   | `/api/v1/stripe/connect/onboarding` end-to-end                                         | Not native                                                             |
| Geolocation-attached scans                           | `CheckInScanner.tsx` posts `{lat, lng, accuracy}`                                      | Not documented                                                         |
| Virtualized data table                               | `@tanstack/react-virtual` in `DataTableInteractive`                                    | SmartSuite paginates                                                   |
| URL-state-synced views                               | `useUrlState` shares query/sort/page in the URL                                        | Session-only Find                                                      |
| Pinned columns                                       | `pinnedCols` saved per view                                                            | Not documented                                                         |
| Command palette (cmdk)                               | `CommandPalette.tsx`, Cmd-K everywhere                                                 | Has it; ours is more idiomatic                                         |
| Field-level a11y                                     | `Input.tsx` ARIA hygiene + role=alert + async-validate spinner                         | Inconsistent in docs                                                   |
| RTL support                                          | Logical Tailwind props (`start-`/`end-`/`ms-`/`pe-`) used throughout                   | Not surfaced in docs                                                   |
| Honeypot anti-spam on public forms                   | Already in `PublicFormSubmit.tsx`                                                      | Captcha only                                                           |
| Private-by-default PDF storage (planned)             | Signed-URL bucket                                                                      | Public links by default (Mar 2026 release added a _toggle_ to disable) |
| Polymorphic annotations (flag/note/comment/tag)      | Single `annotations` table with `parent_id` threading                                  | Comments-only, no flags/notes                                          |
| Per-event channel preference matrix UI               | `me/notifications` (UI exists, resolver TBD)                                           | Not documented at this granularity                                     |
| AI integration per-org/per-route metering            | `recordUsage()` + `usage_events` table                                                 | Not documented                                                         |

---

## 6. Method & coverage

- **Source corpus:** SmartSuite help center, 20 collections, 500+ articles. Each thematic agent fetched 25–50 articles with priority on field types, view types, automation triggers/actions, permission roles, mobile features, API contract, and Nov 2025 → Mar 2026 release notes.
- **Codebase corpus:** `flyingbluewhale@main` (commit `71a40e4`), 167+ Postgres tables across 49 migrations, ~33 UI primitives in `src/components/ui/`, all `/api/v1/*` routes, `src/proxy.ts`, `src/lib/auth.ts`, `supabase/functions/job-worker/`, and the entire `src/app/(mobile)/m/` shell.
- **Output:** five subsystem reports (~17,000 words combined), this master synthesis (~2,500 words), citing ~120 distinct SmartSuite help-article URLs. Every gap claim is traceable to a specific help URL and a specific LYTEHAUS file path.

---

_Generated 2026-05-04. Refresh by re-running the five companion agents — none of the output files are hand-edited._
