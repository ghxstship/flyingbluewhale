# Competitive Scan July 2026 — Delta Implementation Plan

**Date:** 2026-07-04
**Input:** [00-report.md](00-report.md) (verified competitor findings) × a code-verified inventory of what this repo already ships.
**Discipline:** this plan covers only the **delta** — patterns not already closed by prior programs (SmartSuite/ClickUp parity plan 2026-06-13, construction-PM parity rounds 35–78, workforce parity 0046–0051, reports engine v6.3, automations engine, AI field agents).

---

## 0. Recalibration — what already exists (code-verified)

| Market pattern | Repo reality | Verdict |
|---|---|---|
| Ask-the-platform AI (grounded, cited) | `/api/v1/ai/copilot` is a real RAG answer card (pgvector `match_document_chunks`, citations, confidence) — but the corpus excluded `kb_articles`, the canonical knowledge store | **Gap → SHIPPED in this change** |
| Scheduled project risk prediction | Reports engine + AI spine (`runAI`) existed; no risk assessment surface | **Gap → SHIPPED in this change** |
| Ambient AI agents | `src/lib/ai/agents.ts` "AI Field Agents" (declarative per-column agents, auto-refresh triggers, audit-logged) + full automations engine (`manual/schedule/webhook/event` triggers, `ai.assist` action, step ledger) | Largely covered; see P2 for the assignable-teammate layer |
| NL automation builder | Automations builder UI exists (`/studio/ai/automations`); not NL-driven | P2 |
| Built-in analytics vs BI | Reports engine v6.3 (77 metrics, 43 reports) + `/studio/settings/usage` | Covered; peer benchmarking = differentiator backlog |
| Actionable notifications | `src/lib/push/send.ts` supports action buttons → actions API | Covered |
| Meeting AI | `meeting-summary.ts` (paste transcript → recap + action items → tasks) | Covered for text; audio STT = backlog |
| Ops→finance loop (damage/loss → invoice) | `assignments` journal + invoices exist; no auto-draft link | P1 |
| AI course authoring | Learner LMS is rich (LEG3ND learn/quiz/certs/recerts); **no admin course builder at all** (content is seeded; `workforce/training` edits `kb_articles`) | P1 — biggest structural hole |
| Marketplace AI matching | Full manual workflow FSMs (submissions/offers/applications); zero ranking/shortlisting intelligence | P2 |
| Chat translation / smart replies | chat infra solid; no translation, reactions deferred (ADR-0014) | P1 (translation is small) |
| Time-clock hardening (auto clock-out) | Geofence classify exists (`classifyPunch`, informational) ; no auto clock-out | P2 |
| Smart bulk imports | Nothing generalized | P2 |
| Lead scoring | `leads` have `lead_phase` only; no scoring | P1 |

## 1. Shipped with this change (2026-07-04)

### 1.1 Knowledge base → AI corpus *(pattern 1 — Ask Mo / Connecteam AI Agent / Trainual AI Assistant / Bizzy custom-KB parity)*
- Migration `20260704141000_kb_corpus_and_risk_reports.sql`: `kb_article` added to `embedding_source_type` (applied).
- `walkOrgSources` walks `kb_articles` (title + body + tags, org-scoped) into the corpus; `/studio/ai/corpus` labels + copy updated; embed-source endpoint accepts the kind; RAG scope type extended.
- Result: the grounded Copilot now answers from company knowledge with citations — the exact feature Connecteam (Oct 2025), Trainual (Sep 2025), and Momentus (Feb 2026) shipped.
- Guard: `src/lib/ai/corpus.test.ts`.

### 1.2 AI Project Risk Reports *(pattern 5 — Asana Fall-2025 parity)*
- Same migration: `ai_risk_reports` (org/project-scoped, RLS `org_members_all`, immutable artifact rows — newest wins; no lifecycle column by design, LDP-clean).
- `src/lib/ai/risk-report.ts`: `gatherRiskSignals` (overdue/blocked/due-soon tasks, budget variance, open incidents, stalled advancing assignments, open deliverables, days-to-show) → `runAI` with a strict Zod schema (model can never invent numbers; prompt_context snapshot makes every report auditable) → persisted row + per-tenant usage metering.
- Surface: `RiskReportCard` on `/studio/projects/[projectId]/overview` with manager+ generate/refresh action.
- Guard: `src/lib/ai/risk-report.test.ts`.
- Follow-up (P1.4): weekly scheduled generation via the automations engine to match Asana's cadence.

## 2. Phase P1 — next (each ≤1 wk, rides existing infra)

1. **Damage/loss → draft invoice** *(Current RMS Aug 2025)* — when an `assignment_events` row marks a returned asset damaged/lost, auto-draft an `invoices` row (ap_source facet exists) with the catalog item's replacement value; operator confirms. Composes: assignments journal + invoices + notify.
2. **Course builder (admin authoring)** *(prereq for all LMS AI)* — CRUD for `courses`/`lessons`/`assessments` under `/studio/workforce/courses` (nav slot exists); FormShell + optimistic concurrency per house pattern. Then **AI course draft from KB article or document** (TalentLMS TalentCraft parity) via `runAI` — the corpus work (1.1) already extracts the text.
3. **Chat message translation** *(Connecteam Jun 2026)* — per-message "Translate" affordance in `/studio/inbox` + `/m/inbox/[roomId]` calling a small `runAI` translate helper; render inline under the original. i18n locales already enumerate the 7 target languages.
4. **Scheduled risk reports** — automation `schedule` trigger + a `risk.report` action wrapping 1.2's generator; notify owners on `high/critical`.
5. **Lead scoring** *(HoneyBook-class)* — derived score on `leads` list (recency, value, engagement signals), computed in-query first; AI grading only if the derived version proves insufficient.

## 3. Phase P2

- **Assignable AI teammates** — extend AI Field Agents from per-column writes to task-assignable agents (@mention in comments → agent run → audit-logged reply), reusing `automation` dispatch. (ClickUp Super Agents / Asana AI Teammates.)
- **NL automation builder** — "describe the workflow" → `runAI` emits an automations-engine rule draft the operator reviews before activation.
- **Marketplace shortlisting** *(Upwork Uma-lite)* — ranked candidate ordering on `open_call_submissions`/`job_applications` from structured fit signals, displayed as a sortable score with reasons; never auto-rejects.
- **Geofence auto clock-out** *(Connecteam Feb 2026)* — opt-in per `time_clock_zones` row; `classifyPunch` already computes outside-zone; add exit detection on punch heartbeat + timesheet flag + admin approval path.
- **Smart bulk imports** — CSV/paste importer with Zod row validation + duplicate detection for the event-setup tables (crew, catalog items, guests). (Momentus Smart Imports.)
- **Portal/attendee copilot** *(Bizzy)* — read-only grounded Q&A on `/p/[slug]/guide` + `/m/guide` over event-guide content + schedules; the copilot route already refuses to fabricate.

## 4. Explicitly rejected / deferred

- **Audio recording/live STT for meetings** — heavy media infra; paste-transcript flow covers the workflow today (same call as the 2026-06-13 plan's #9 deferral).
- **AI video presenters** (Docebo) — content-production feature, off-thesis for an ops console.
- **Freelancer-trained personal AI models** (Fiverr Go) — marketplace-seller monetization play, not our marketplace's shape.
- **Peer benchmarking analytics** — needs cross-tenant data governance design first (differentiator backlog, not parity).

## 5. Cross-cutting rules for every P1/P2 item

The 2026-06-13 plan's conventions apply verbatim: LDP naming (`*_phase`/`*_state`, `status` banned), RLS canon (`is_org_member`/`has_org_role`), migrations via Supabase MCP + types regen, `nav.ts` SSOT + sitemap gate, `urlFor` for cross-shell URLs, `/validate` green before merge, smoke-harness rows for new mobile surfaces/mutations.
