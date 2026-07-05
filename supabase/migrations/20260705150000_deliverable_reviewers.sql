-- Kit 21 wave W2 — deliverable multi-reviewer tally (Frame.io canon). A join of
-- reviewers per deliverable, each with an independent verdict, so a doc-spec
-- shows "2 Of 4 Approved" and a Changes-Requested flag instead of a single
-- reviewed_by. Additive; the existing deliverables.reviewed_by stays. Applied
-- to the live project 2026-07-05 via the Supabase MCP; committed here for parity.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'deliverable_review_state') then
    create type public.deliverable_review_state as enum ('pending', 'approved', 'changes_requested');
  end if;
end$$;

create table if not exists public.deliverable_reviewers (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.orgs(id) on delete cascade,
  deliverable_id uuid not null references public.deliverables(id) on delete cascade,
  reviewer_id    uuid not null references auth.users(id) on delete cascade,
  review_state   public.deliverable_review_state not null default 'pending',
  note           text,
  assigned_at    timestamptz not null default now(),
  reviewed_at    timestamptz,
  unique (deliverable_id, reviewer_id)
);

create index if not exists deliverable_reviewers_deliverable_idx
  on public.deliverable_reviewers(deliverable_id);

alter table public.deliverable_reviewers enable row level security;

drop policy if exists deliverable_reviewers_read on public.deliverable_reviewers;
create policy deliverable_reviewers_read
  on public.deliverable_reviewers for select
  using (private.is_org_member(org_id));

drop policy if exists deliverable_reviewers_manage on public.deliverable_reviewers;
create policy deliverable_reviewers_manage
  on public.deliverable_reviewers for all
  using (private.has_org_role(org_id, array['owner','admin','manager']))
  with check (private.has_org_role(org_id, array['owner','admin','manager']));

drop policy if exists deliverable_reviewers_self_verdict on public.deliverable_reviewers;
create policy deliverable_reviewers_self_verdict
  on public.deliverable_reviewers for update
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());
