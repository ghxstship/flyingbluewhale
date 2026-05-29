-- Migration: competitive_features
-- Adds schema for 5 competitor-parity features:
--   1. ai_schedule_suggestions  — AI-generated shift schedule drafts (Connecteam/Deputy parity)
--   2. ai_proposal_drafts       — AI-generated proposal narratives (iVvy Instant Proposal parity)
--   3. open_call_submissions.ai_match_score / ai_match_notes
--                               — AI crew/talent match scoring (Cvent CventIQ / Bizzabo parity)
-- Features 4 (signage feed) and 5 (labor costs view) are read-only over
-- existing tables — no schema additions required.

-- ----------------------------------------------------------------
-- 1. AI Schedule Suggestions
-- ----------------------------------------------------------------
CREATE TABLE public.ai_schedule_suggestions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id       uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  week_start       date        NOT NULL,
  prompt_context   jsonb       NOT NULL DEFAULT '{}',
  suggestion_data  jsonb       NOT NULL DEFAULT '{}',
  -- LDP: cyclical operational state — "generation_state" not "status"
  generation_state text        NOT NULL DEFAULT 'pending'
                   CHECK (generation_state IN ('pending', 'generated', 'applied', 'dismissed')),
  created_by       uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  applied_at       timestamptz
);

ALTER TABLE public.ai_schedule_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_all" ON public.ai_schedule_suggestions
  FOR ALL
  USING (private.is_org_member(org_id));

CREATE INDEX ai_schedule_suggestions_org_week
  ON public.ai_schedule_suggestions (org_id, week_start DESC);

-- ----------------------------------------------------------------
-- 2. AI Proposal Drafts
-- ----------------------------------------------------------------
CREATE TABLE public.ai_proposal_drafts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  proposal_id     uuid        REFERENCES public.proposals(id) ON DELETE SET NULL,
  prompt_context  jsonb       NOT NULL DEFAULT '{}',
  draft_content   text        NOT NULL DEFAULT '',
  -- LDP: cyclical operational state — "draft_state" not "status"
  draft_state     text        NOT NULL DEFAULT 'generated'
                  CHECK (draft_state IN ('generated', 'applied', 'dismissed')),
  created_by      uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_proposal_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_all" ON public.ai_proposal_drafts
  FOR ALL
  USING (private.is_org_member(org_id));

CREATE INDEX ai_proposal_drafts_org_proposal
  ON public.ai_proposal_drafts (org_id, proposal_id);

-- ----------------------------------------------------------------
-- 3. AI Match Score on open_call_submissions
-- ----------------------------------------------------------------
ALTER TABLE public.open_call_submissions
  ADD COLUMN IF NOT EXISTS ai_match_score numeric(4,1),
  ADD COLUMN IF NOT EXISTS ai_match_notes text;

COMMENT ON COLUMN public.open_call_submissions.ai_match_score IS
  'AI-generated fit score 0.0–100.0 (advisory only; human reviewer retains final decision).';
COMMENT ON COLUMN public.open_call_submissions.ai_match_notes IS
  'Brief AI rationale for the match score.';
