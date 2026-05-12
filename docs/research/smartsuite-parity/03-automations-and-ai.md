# SmartSuite Automations + AI vs FLYTEHAUS — Gap Analysis

> Scope: SmartSuite's Automations (43 articles) and AI (5 articles) + Scripting Widget (3 articles) measured against the current `flyingbluewhale` (FLYTEHAUS Technologies) codebase as of 2026-05-04.
> All file paths are absolute; all SmartSuite claims are linked to a help-article URL in §8.

---

## 1. Executive Summary

1. **The `automations` table is a UI shell with no runner.** `src/app/(platform)/console/ai/automations/*` lets a user create a row with `trigger_kind`/`trigger_config`/`steps` JSON, but no worker reads `steps`, no scheduler dispatches `trigger_kind="schedule"`, no inbound endpoint accepts `trigger_kind="webhook"`, and the "manual run" action just stamps `last_run_at = now()` without executing anything ([`actions.ts:28-40`](<file:///Users/julianclarkson/Documents/flyingbluewhale/src/app/(platform)/console/ai/automations/[automationId]/actions.ts>)). Severity: **XL gap**.
2. **The runtime primitives already exist** — `job_queue` with `claim_jobs()` SKIP LOCKED, exponential-backoff retries, a deployed `job-worker` Edge Function on a 1-min cron, and an outbound `webhook_endpoints` + `webhook_deliveries` outbox with HMAC-SHA256 signing. An automation engine can be built **on top of** this rather than from scratch.
3. **No condition/filter language.** SmartSuite ships ~7 operators per field type with AND/OR groups up to 15 conditions; FLYTEHAUS has none — `trigger_config` is opaque JSON with no schema, no UI to author it, and no runtime to evaluate it.
4. **No action library.** SmartSuite offers 25+ pre-built actions (Create/Update/Find/Merge Records, Email, Slack, Teams, Twilio SMS/Voice, Google Drive/Sheets/Calendar, HubSpot, Salesforce, Jira, Generate PDF, AI Assist, Looping, Webhook). FLYTEHAUS has zero canonical action handlers wired to the automations table.
5. **No record-event triggers.** SmartSuite fires on record-created / record-updated / record-matches-condition. FLYTEHAUS has SSOT triggers writing to `audit_log` and an `emit_notification()` RPC, but no event bus that automations subscribe to.
6. **AI integration is a single chat endpoint.** `src/app/api/v1/ai/chat/route.ts` streams Claude responses for an interactive assistant; there is no AI Assist _action_, no AI _field agent_ (auto-summarize/classify/sentiment on field change), no structured output schema (Custom Outputs), no provider-abstraction layer.
7. **Scripting widget = 0% built.** SmartSuite ships a sandboxed JS widget with `get_record`, `proxy_fetch`, `download_data`, etc. FLYTEHAUS has no end-user scripting surface.
8. **Inbound webhook triggers do not exist.** Stripe webhooks are bespoke (`/api/v1/webhooks/stripe`), not extensible. Customers cannot publish their own webhook URL with auto-mapped JSON payloads.
9. **Scheduled-time triggers are unsolved.** `job_queue.run_at` supports one-shot delayed jobs, but there is no cron/recurrence engine, no "next 10 runs" preview, no per-org scheduler limits.
10. **Highest impact, lowest effort wins:** (a) wire a `automation_runs` ledger + dispatch loop into the existing `job-worker`, (b) ship 5 first-class actions (notify, email, webhook, update record, AI Assist), (c) lift `notify()`'s event-type registry into a record-event bus that automations can subscribe to. Estimated 3–4 weeks gets us to demonstrable parity for ~70% of customer use cases.

---

## 2. Automation Engine Architecture

### What SmartSuite ships

| Layer              | SmartSuite                                                                                                                                                                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authoring UI       | Block builder: trigger → conditions → ordered actions, with "Add Action" capping at 10 actions per automation, dynamic field references via `{{Field Name}}` token ([Creating an Automation](https://help.smartsuite.com/en/articles/4860573-creating-an-automation))                           |
| Trigger registry   | 8 native + 2+ integration trigger types ([Automation Triggers](https://help.smartsuite.com/en/articles/5162303-automation-triggers))                                                                                                                                                            |
| Condition language | Field-type-aware operators, AND/OR groups up to 15 conditions per trigger ([Automation Conditions](https://help.smartsuite.com/en/articles/6464896-automation-conditions))                                                                                                                      |
| Action registry    | 25+ actions across record CRUD, comms, integrations, doc-gen, control-flow ([SmartSuite Automation Actions](https://help.smartsuite.com/en/articles/5163903-smartsuite-automation-actions))                                                                                                     |
| Control flow       | Looping action (Find Records / webhook arrays / JSON arrays), `Current Item` token, nested conditional blocks; exactly 1 loop per automation, max 1,000 iterations on Signature plan ([Automation Action: Looping](https://help.smartsuite.com/en/articles/10657814-automation-action-looping)) |
| Run history        | 2 weeks (Free) → 3 years (Enterprise/Signature) retention; surfaces start time, status, duration, action count; admin email + in-app alerts on failure ([Automation Run History/Erroring](https://help.smartsuite.com/en/articles/7115398-automation-run-history-erroring))                     |
| Plan-tier metering | Monthly action caps: Team 25k, Pro 100k, Enterprise 500k ([Managing Automations](https://help.smartsuite.com/en/articles/4868648-managing-automations))                                                                                                                                         |
| Scheduling         | Minutes/Hours/Days/Weeks/Months/One-time intervals; "next 10 runs" preview ([Automation Triggers](https://help.smartsuite.com/en/articles/5162303-automation-triggers))                                                                                                                         |
| Inbound webhooks   | Per-automation URL accepting GET + POST JSON ≤1 MB at 5 req/s; nested objects converted to `customer.name` dot notation; arrays auto-detected ([Automation Trigger: Webhook](https://help.smartsuite.com/en/articles/10753627-automation-trigger-webhook))                                      |

### What FLYTEHAUS has today

| Layer                         | FLYTEHAUS state                                                                                                                                                                                                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authoring UI                  | `name`, `description`, `trigger_kind` enum, no condition or step editor — the page renders `trigger_config` and `steps` as raw `<pre>JSON</pre>` ([detail page](<file:///Users/julianclarkson/Documents/flyingbluewhale/src/app/(platform)/console/ai/automations/[automationId]/page.tsx>))       |
| Runner                        | None. `recordManualRunAction` updates `last_run_status='ok'` without dispatching anything                                                                                                                                                                                                          |
| Trigger registry              | Only the enum `'manual' \| 'schedule' \| 'webhook' \| 'event'` exists; nothing reads it                                                                                                                                                                                                            |
| Job infrastructure (reusable) | `job_queue` table with FOR UPDATE SKIP LOCKED claim, exp-backoff with jitter capped at 10 min, `dead`-letter state, `dedup_key` partial unique index ([`20260418_000019_job_queue.sql`](file:///Users/julianclarkson/Documents/flyingbluewhale/supabase/migrations/20260418_000019_job_queue.sql)) |
| Worker                        | `supabase/functions/job-worker/index.ts` deployed on `*/1 * * * *` cron, 8 known job types: `stripe.reconcile`, `usage.aggregate`, `email.send`, `notifications.digest`, `passkey.cleanup`, `audit.rollup`, `export.package`, `webhook.deliver`                                                    |
| Outbound webhooks             | `webhook_endpoints` + `webhook_deliveries` outbox, HMAC-SHA256 signing, per-endpoint failure counters; 16 canonical event types in [`src/lib/notify.ts`](file:///Users/julianclarkson/Documents/flyingbluewhale/src/lib/notify.ts)                                                                 |
| Audit                         | `audit_log` populated by SSOT triggers on every business table ([`20260417_000010_ssot_triggers.sql`](file:///Users/julianclarkson/Documents/flyingbluewhale/supabase/migrations/20260417_000010_ssot_triggers.sql))                                                                               |
| Run history                   | None. No `automation_runs` or `automation_step_runs` table                                                                                                                                                                                                                                         |
| Metering                      | `usage_events` exists for AI tokens; no automation-action counter                                                                                                                                                                                                                                  |

### Minimum viable engine to ship parity

1. **`automation_runs` ledger** (one row per execution): `automation_id, trigger_payload, started_at, finished_at, status, error_summary, action_count`. Append-only, RLS read-only for org members.
2. **`automation_step_runs`** (per-action ledger): `run_id, step_index, action_type, input, output, status, error, latency_ms`. Required so the UI can render a step-by-step timeline like SmartSuite's run history.
3. **`automation_schedules`** (per-automation cron rows the worker reads on a tick): `automation_id, rrule_or_cron, next_run_at, last_run_at`. The existing `job-worker` 1-min cron polls and enqueues `automation.run` jobs whose `dedup_key = ${automation_id}:${next_run_at}` so concurrent workers don't double-fire.
4. **`automation.run` job-queue handler** dispatches to a step interpreter that walks `steps` JSON, evaluates per-step `condition` JSON, calls a per-`action_type` handler, and writes `automation_step_runs` rows.
5. **Domain event bus** — extend the existing `notify()` registry (`src/lib/notify.ts:NotifyEvent`) to also emit a `domain_events` row; an `automation_subscriptions` table keeps `(org_id, event_type) → automation_id`. The worker tails `domain_events` and enqueues runs.
6. **Inbound webhook endpoint** at `/api/v1/automations/[automationId]/webhook` with per-automation HMAC secret, signature header verification, JSON ≤1 MB rate-limited via existing `ratelimit.ts`.
7. **Action registry interface** (`src/lib/automations/actions/<type>.ts`): `{ schema: ZodType, run(input, ctx): Promise<output> }`. Initial set: `notify`, `email.send`, `webhook.send`, `record.update`, `record.create`, `record.find`, `ai.assist`, `delay`, `branch`.
8. **Dynamic value resolver** — Mustache-like `{{step.0.output.id}}` / `{{trigger.record.name}}` substitution applied to action inputs at run time.

---

## 3. Trigger Matrix

| SmartSuite trigger                                                                                         | FLYTEHAUS equivalent                                                                                                                                                                   | Severity | Note                                                                           |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| Record matches a condition ([source](https://help.smartsuite.com/en/articles/5162303-automation-triggers)) | None — no event bus subscribed by `automations`                                                                                                                                        | XL       | Needs `domain_events` + condition evaluator                                    |
| Record is created                                                                                          | SSOT trigger writes `audit_log`, but no automation subscribes                                                                                                                          | L        | Easy once §2 step 5 lands                                                      |
| Record is updated                                                                                          | Same — `audit_log` only                                                                                                                                                                | L        | Same as above                                                                  |
| Form is submitted                                                                                          | `form_submissions` table exists; no trigger on insert                                                                                                                                  | M        | Add `AFTER INSERT` PG trigger emitting a `form.submitted` domain event         |
| At a scheduled time (interval-based)                                                                       | None — `job_queue.run_at` supports one-shot delays only                                                                                                                                | XL       | Needs `automation_schedules` + cron parser                                     |
| Button click ([source](https://help.smartsuite.com/en/articles/11583642-automation-trigger-button-click))  | None                                                                                                                                                                                   | M        | Server-action endpoint per automation; reuse `recordManualRunAction` shape     |
| Webhook (inbound) ([source](https://help.smartsuite.com/en/articles/10753627-automation-trigger-webhook))  | None — only Stripe-specific receiver                                                                                                                                                   | L        | Add `/api/v1/automations/[id]/webhook`                                         |
| Gmail email received                                                                                       | None                                                                                                                                                                                   | XL       | Out of scope for v1 — defer                                                    |
| Outlook email received                                                                                     | None                                                                                                                                                                                   | XL       | Defer                                                                          |
| Make/Zapier triggers ([source](https://help.smartsuite.com/en/articles/6805203-make-triggers-actions))     | None — `KNOWN_CONNECTORS` is a stub list in [`connectors.ts`](<file:///Users/julianclarkson/Documents/flyingbluewhale/src/app/(platform)/console/settings/integrations/connectors.ts>) | M        | Out-of-the-box Zapier integration uses our existing webhook endpoints registry |

---

## 4. Action Matrix

| SmartSuite action                                                                                                                           | FLYTEHAUS equivalent                                                                      | Severity | Note                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| Create a Record ([source](https://help.smartsuite.com/en/articles/5163903-smartsuite-automation-actions))                                   | None as automation primitive — server actions do this manually                            | L        | Map to `listOrgScoped`/`getOrgScoped` already in `src/lib/db/resource.ts`  |
| Update Records                                                                                                                              | None                                                                                      | L        | Same                                                                       |
| Find Records                                                                                                                                | None                                                                                      | L        | Same; needs cursor support for Looping action                              |
| Delete Records                                                                                                                              | None                                                                                      | M        | Soft-delete only; align with audit policy                                  |
| Merge Records                                                                                                                               | None                                                                                      | XL       | No native merge anywhere in the codebase                                   |
| Send an Email                                                                                                                               | `sendEmail()` in `src/lib/email.ts` (Resend) — not wired to automations                   | S        | Wrap as `email.send` action                                                |
| Create a Comment                                                                                                                            | `comments` / `deliverable_comments` exist                                                 | M        | Generic comment action needs polymorphic FK                                |
| Send a Notification                                                                                                                         | `notify()` already canonical                                                              | S        | Trivially wrap as `notify` action                                          |
| Generate PDF / DocsAutomator ([source](https://help.smartsuite.com/en/articles/12060448-automation-action-docsautomator))                   | `proposal-pdf`, `offer-letter` PDF flows exist as ad-hoc routes                           | L        | Lift to a generic `pdf.generate(template_id, data)` action                 |
| Send Webhook Request                                                                                                                        | None as automation primitive; `webhook.deliver` job exists for inbound subscriptions only | S        | Reuse `webhook.deliver` handler with arbitrary URL                         |
| Slack                                                                                                                                       | Stub in `KNOWN_CONNECTORS`; no actual sender                                              | M        | Bot-token + per-org channel mapping                                        |
| Microsoft Teams                                                                                                                             | None                                                                                      | M        | Same                                                                       |
| Twilio SMS / Voice                                                                                                                          | None                                                                                      | M        | Adds an env var + action                                                   |
| Google Drive / Sheets / Calendar                                                                                                            | None                                                                                      | XL       | Defer to v2                                                                |
| HubSpot / Salesforce / Jira / Intercom                                                                                                      | Stub in `KNOWN_CONNECTORS` only                                                           | XL       | Defer; ship Zapier bridge instead                                          |
| AI Assist (custom prompt + structured outputs) ([source](https://help.smartsuite.com/en/articles/11644263-automation-action-ai-assist))     | `src/lib/ai/extract-credential.ts` is a one-off Anthropic call                            | M        | Lift into a generic `ai.assist({prompt, output_schema})` action            |
| Looping (over Found Records / webhook arrays / JSON) ([source](https://help.smartsuite.com/en/articles/10657814-automation-action-looping)) | None                                                                                      | L        | Step interpreter must support `for_each` block with `current_item` binding |
| Conditional branching                                                                                                                       | None                                                                                      | L        | Same — `if/else_if/else` block                                             |
| Delay                                                                                                                                       | `job_queue.run_at` supports it; no UI                                                     | S        | Trivial action wrapping `enqueue({ runAt })`                               |
| Merge Records                                                                                                                               | None                                                                                      | M        | Defer                                                                      |

---

## 5. AI Capabilities

### What SmartSuite ships

| Surface                         | Description                                                                                                                                                                                                                                                                                                             | Source                                                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **AI Field Agents**             | Auto-fill Title/Text/Number/SmartDoc/Single-Select/Multi-Select/Status/Link fields from other field values. Tasks include content generation, classification, recommendations, summarization. Refresh either when referenced fields change OR manual invoke from grid. Output stored in field history as an "AI event". | [AI Field Agents](https://help.smartsuite.com/en/articles/12944386-ai-field-agents)                                        |
| **AI Assist automation action** | Custom prompts with `{{Field}}` references; **Custom Outputs** with typed return fields (Text, Number, Boolean, Date, Email, URL, Phone, Single-Select, Duration); supports file inputs (PDF) when the model allows it; results cascade into next steps.                                                                | [Automation Action: AI Assist](https://help.smartsuite.com/en/articles/11644263-automation-action-ai-assist)               |
| **SmartDoc AI Assistant**       | In-doc `/Ask AI`: generate, improve clarity, simplify, fix spelling, summarize, action-item extraction. Uses GPT-4 by default; 200 free requests/yr/workspace then BYO OpenAI key.                                                                                                                                      | [SmartSuite AI Assistant (SmartDoc)](https://help.smartsuite.com/en/articles/7900592-smartsuite-ai-assistant-smartdoc)     |
| **Provider abstraction**        | 9 providers via BYO-key: OpenAI, Anthropic, Google Gemini, Amazon Bedrock, Azure OpenAI, Perplexity, Nscale, IBM watsonx, xAI/Grok. Some use SigV4. Models offered: GPT-5 Mini default, GPT-5, GPT-4o, O1 Pro.                                                                                                          | [AI Assist: Connecting Your Provider](https://help.smartsuite.com/en/articles/11769675-ai-assist-connecting-your-provider) |

### What FLYTEHAUS has

- **One streaming chat endpoint** at [`src/app/api/v1/ai/chat/route.ts`](file:///Users/julianclarkson/Documents/flyingbluewhale/src/app/api/v1/ai/chat/route.ts) — `claude-opus-4-7` / `claude-sonnet-4-6` only, hard-coded SYSTEM prompt, conversation persistence in `ai_conversations` / `ai_messages`, usage metering via `recordUsage()`. Not callable from automations or fields.
- **One bespoke extractor** at [`src/lib/ai/extract-credential.ts`](file:///Users/julianclarkson/Documents/flyingbluewhale/src/lib/ai/extract-credential.ts) — extracts COI/W9 fields with strict JSON schemas. The right pattern, but locked to credentials.
- **No AI fields, no field agents, no provider abstraction, no custom outputs API.**

### Recommended additions (ranked)

1. **`ai.assist` automation action** — generalize `extract-credential.ts` into `runAi({ prompt, output_schema, model, files? })` returning Zod-validated structured output. Single biggest unlock; reuses existing Anthropic SDK + usage metering. **Effort: M.**
2. **AI Field Agents** — three columns added to relevant tables: `ai_agent_id`, `ai_last_run_at`, `ai_last_value`. A `ai_agents` table holds prompts + dependency-field list. SSOT trigger on dependency change enqueues an `ai.field.refresh` job. **Effort: L.**
3. **Provider abstraction** — `src/lib/ai/providers/{anthropic,openai,bedrock,azure}.ts` behind a common `Provider` interface; settings page lets each org BYO key encrypted at rest. **Effort: M.**
4. **AI search/ask-the-database** (out-of-scope for SmartSuite parity but high-impact) — RAG over `audit_log` + `notifications` + `tasks` summaries. **Effort: XL.**
5. **Sentiment + classification helpers** — pre-baked `ai.classify` / `ai.sentiment` actions are just `ai.assist` with curated prompt + Single-Select output schema. **Effort: S** once #1 lands.

---

## 6. Scripting / Extensibility

### What SmartSuite offers

- **Scripting Widget** — sandboxed iframe-hosted JS code editor on dashboards ([Scripting Widget](https://help.smartsuite.com/en/articles/11155730-scripting-widget)).
- **SDK functions** — `get_record()`, `redirect_to()`, `download_data()` (base64), `proxy_fetch()` (allowlisted URLs), `get_grid_selections()`, `smartsuite_*` CSS class helpers ([Advanced Scripting Functions](https://help.smartsuite.com/en/articles/13566882-advanced-scripting-functions)).
- **Script Engine** for scheduled jobs and API-driven execution ([Scripting collection](https://help.smartsuite.com/en/collections/18200557-scripting)).

### Recommendation: **defer indefinitely.**

Pros:

- Power users can patch missing actions without engineering.
- Differentiates from PSA tools without scripting.

Cons (decisive):

- Sandboxing JS in production is a meaningful security surface — `proxy_fetch` allowlists, CPU/memory caps, secret redaction, audit-trail of script execution.
- FLYTEHAUS' competitive edge is **opinionated production-ops vocabulary** (advancing, ROS, load-in, credentials, COI). A scripting hatch invites users to bend the model in ways that fight the platform.
- The `ai.assist` action covers ~80% of "I need a custom field calc" use cases at lower risk.

If/when scripting ships, scope it to **read-only** (`get_record`, `find_records`, `proxy_fetch` against a HTTPS allowlist) and require Workspace-Admin + 2-person review on save. Never write-back from a script.

---

## 7. Top 10 Implementation Recommendations (impact ÷ effort)

| #   | Recommendation                                                                                                                                                                                                                                                                                  | Files / paths                                                                                    | Size  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----- |
| 1   | Wire a real **automation runner** in `supabase/functions/job-worker/index.ts` that handles a new `automation.run` job type, walks `automations.steps` JSON, writes `automation_step_runs`. Add migration `automation_runs` + `automation_step_runs` tables.                                     | `supabase/functions/job-worker/index.ts` · new migration · `src/lib/automations/run.ts`          | **L** |
| 2   | Ship **5 starter actions** as a registry: `notify`, `email.send`, `webhook.send`, `record.update`, `delay`. Each is a 30-line module exporting `{ schema, run }`.                                                                                                                               | `src/lib/automations/actions/*.ts`                                                               | **M** |
| 3   | Build the **step builder UI** — replace the raw JSON `<pre>` with a block-based editor (drag-add steps, per-step config form rendered from `schema`).                                                                                                                                           | `src/app/(platform)/console/ai/automations/[automationId]/StepBuilder.tsx`                       | **L** |
| 4   | **Domain event bus** — extend [`src/lib/notify.ts`](file:///Users/julianclarkson/Documents/flyingbluewhale/src/lib/notify.ts) `NotifyEvent` to a discriminated union and add `domain_events` table written by SSOT triggers. Add `automation_subscriptions(org_id, event_type, automation_id)`. | `src/lib/notify.ts` · new migration · `src/lib/automations/dispatch.ts`                          | **L** |
| 5   | **`ai.assist` action** — lift `extract-credential.ts` pattern into a generic action that takes `{prompt, outputSchema}` and returns Zod-validated JSON.                                                                                                                                         | `src/lib/automations/actions/ai-assist.ts` (new) · `src/lib/ai/run.ts` (new)                     | **M** |
| 6   | **Inbound webhook trigger** — `POST /api/v1/automations/[automationId]/webhook` with per-automation HMAC verification, 1 MB body cap, ratelimit reuse. Auto-map JSON to `trigger.payload.<dot.path>`.                                                                                           | `src/app/api/v1/automations/[automationId]/webhook/route.ts` (new)                               | **S** |
| 7   | **Schedule trigger** — add `automation_schedules` table with `rrule` text column; tick-loop in `job-worker` that enqueues runs whose `next_run_at <= now()` with `dedup_key = ${id}:${ts}`. UI uses [rrule.js](https://github.com/jakubroztocil/rrule).                                         | new migration · `supabase/functions/job-worker/index.ts` · `src/components/RruleEditor.tsx`      | **M** |
| 8   | **Condition evaluator** — JSON DSL `{ all: [{field, op, value}] }` / `{ any: [...] }` with a per-field-type op map mirroring SmartSuite's set; evaluator is a pure function unit-tested independently of DB.                                                                                    | `src/lib/automations/conditions.ts`                                                              | **M** |
| 9   | **Run history page** — `/console/ai/automations/[id]/runs` + `/runs/[runId]` showing the per-step timeline; reuse the existing `audit_log` UI patterns. Tier-gate retention via a nightly `audit.rollup`-style purge job.                                                                       | `src/app/(platform)/console/ai/automations/[automationId]/runs/*`                                | **M** |
| 10  | **AI Field Agents v0** — choose one high-value field (`tickets.summary` auto-summarizing the description) as the lighthouse. Add `ai_agents` table + `ai.field.refresh` job + a small `<AIFieldAgent>` component. Proves the pattern; later opens up to all text/select fields.                 | new migration · `src/lib/automations/actions/ai-field.ts` · `src/components/ui/AIFieldAgent.tsx` | **L** |

Sequencing: 1 → 2 → 3 (in parallel with 4) → 6 → 7 → 8 → 5 → 9 → 10. Items 1–4 are the critical path; everything after is incremental.

---

## 8. Citations

- [Automations: Introduction](https://help.smartsuite.com/en/articles/4857223-automations-introduction)
- [Creating an Automation](https://help.smartsuite.com/en/articles/4860573-creating-an-automation)
- [Automation Triggers](https://help.smartsuite.com/en/articles/5162303-automation-triggers)
- [Automation Trigger: Webhook](https://help.smartsuite.com/en/articles/10753627-automation-trigger-webhook)
- [Automation Trigger: Button Click](https://help.smartsuite.com/en/articles/11583642-automation-trigger-button-click)
- [SmartSuite Automation Actions](https://help.smartsuite.com/en/articles/5163903-smartsuite-automation-actions)
- [Automation Action: Looping](https://help.smartsuite.com/en/articles/10657814-automation-action-looping)
- [Automation Action: AI Assist](https://help.smartsuite.com/en/articles/11644263-automation-action-ai-assist)
- [Automation Action: DocsAutomator](https://help.smartsuite.com/en/articles/12060448-automation-action-docsautomator)
- [Automation Conditions](https://help.smartsuite.com/en/articles/6464896-automation-conditions)
- [Managing Automations](https://help.smartsuite.com/en/articles/4868648-managing-automations)
- [Automation Run History/Erroring](https://help.smartsuite.com/en/articles/7115398-automation-run-history-erroring)
- [Common Automation Error Troubleshooting](https://help.smartsuite.com/en/articles/7855608-common-automation-error-troubleshooting)
- [Make Triggers & Actions](https://help.smartsuite.com/en/articles/6805203-make-triggers-actions)
- [SmartSuite AI Assistant (SmartDoc)](https://help.smartsuite.com/en/articles/7900592-smartsuite-ai-assistant-smartdoc)
- [AI Field Agents](https://help.smartsuite.com/en/articles/12944386-ai-field-agents)
- [AI Assist: Connecting Your Provider](https://help.smartsuite.com/en/articles/11769675-ai-assist-connecting-your-provider)
- [Scripting Widget](https://help.smartsuite.com/en/articles/11155730-scripting-widget)
- [Advanced Scripting Functions](https://help.smartsuite.com/en/articles/13566882-advanced-scripting-functions)
- [SmartSuite API Overview](https://help.smartsuite.com/en/articles/4356333-smartsuite-api-overview)
- [SmartSuite Automations collection](https://help.smartsuite.com/en/collections/3584897-smartsuite-automations)
- [AI collection](https://help.smartsuite.com/en/collections/3984031-ai)
- [Scripting collection](https://help.smartsuite.com/en/collections/18200557-scripting)
