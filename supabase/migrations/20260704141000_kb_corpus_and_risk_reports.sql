-- Competitive-scan 2026-07 delta (docs/research/competitor-scan-2026-07/):
--
-- 1) `kb_article` joins the embedding_source_type enum so the org knowledge
--    base can be walked into the RAG corpus and the grounded Copilot can
--    answer from company knowledge (Momentus "Ask Mo" / Connecteam AI Agent /
--    Bizzabo Bizzy custom-KB parity). kb_articles is the CANONICAL knowledge
--    store (3NF audit §1.2), yet it was the one text-rich source the corpus
--    could not index.
--
-- 2) `ai_risk_reports` — persisted per-project AI risk assessments (Asana
--    Fall-2025 "AI Risk Reports" / monday.com predictive-risk parity).
--    Immutable generated artifacts: each generation INSERTs a new row and the
--    surface shows the latest, so there is no lifecycle column at all (LDP:
--    nothing cycles, nothing sequences — created_at is the only clock).
--    Mirrors the ai_schedule_suggestions/ai_proposal_drafts artifact pattern.

-- ---------------------------------------------------------------------------
-- 1) Knowledge base → RAG corpus
-- ---------------------------------------------------------------------------
-- Additive enum extension; existing values and rows are untouched. Not used
-- inside this migration, so it is transaction-safe on PG 12+.
alter type public.embedding_source_type add value if not exists 'kb_article';

-- ---------------------------------------------------------------------------
-- 2) AI project risk reports
-- ---------------------------------------------------------------------------
create table if not exists public.ai_risk_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  -- The live signals snapshot the model was shown (overdue tasks, budget
  -- variance, open incidents, stalled assignments, schedule pressure).
  prompt_context jsonb not null default '{}'::jsonb,
  -- The structured, Zod-validated model output (overall grade + risks[]).
  report_data jsonb not null default '{}'::jsonb,
  model text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.ai_risk_reports is
  'Per-project AI risk assessments (competitive-scan 2026-07 delta). Immutable generated artifacts — newest row per project is the live report. prompt_context is the signal snapshot, report_data the validated model output.';

create index if not exists ai_risk_reports_org_idx
  on public.ai_risk_reports (org_id);
create index if not exists ai_risk_reports_project_idx
  on public.ai_risk_reports (project_id, created_at desc);
create index if not exists ai_risk_reports_created_by_idx
  on public.ai_risk_reports (created_by);

alter table public.ai_risk_reports enable row level security;

-- Same posture as the sibling AI artifact tables (ai_proposal_drafts,
-- ai_schedule_suggestions): org members read+write their org's rows.
drop policy if exists org_members_all on public.ai_risk_reports;
create policy org_members_all on public.ai_risk_reports
  using (private.is_org_member(org_id));
