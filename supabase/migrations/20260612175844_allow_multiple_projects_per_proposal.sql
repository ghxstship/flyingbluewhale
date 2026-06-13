-- Applied 2026-06-12 via Supabase MCP (version 20260612175844); file
-- recovered from the remote journal to keep local = remote in sync.
--
-- XPMS 2.0 topology: one Proposal carries N child Projects
-- (CSPACE26-27 = 1 proposal -> 4 projects). The 1:1
-- projects.proposal_id unique index predates this model; relax to a
-- plain index. NOTE: this removed the DB-level conversion idempotency
-- backstop (see lifecycle validation D2) — convertProposalToProjectAction
-- still guards via a reverse-FK check, but a partial unique index is the
-- recommended follow-up.
drop index if exists projects_proposal_id_unique;
create index if not exists idx_projects_proposal_id on projects (proposal_id);
