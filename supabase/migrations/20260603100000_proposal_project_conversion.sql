-- Proposal → Project lineage column.
--
-- Existing schema lets a proposal *reference* an existing project via
-- proposals.project_id, but there is no reverse pointer. A project born
-- from a signed proposal cannot identify its originating quote without
-- joining backwards through proposals.project_id, which (a) is nullable
-- and (b) is also used by manually-attached proposals (where the project
-- predates the quote). The two semantics are different and need separate
-- columns.
--
-- The unique partial index ensures conversion is idempotent at the DB
-- level: re-running convertProposalToProjectAction on the same proposal
-- cannot accidentally create a second project, even under a race
-- between two managers clicking Convert at once.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS proposal_id uuid
    REFERENCES public.proposals(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS projects_proposal_id_unique
  ON public.projects(proposal_id)
  WHERE proposal_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_proposal_id
  ON public.projects(proposal_id)
  WHERE proposal_id IS NOT NULL;

COMMENT ON COLUMN public.projects.proposal_id IS
  'Originating proposal lineage. Set by convertProposalToProjectAction when a signed proposal is converted into a live project. Unique partial index enforces at most one undeleted project per proposal.';
