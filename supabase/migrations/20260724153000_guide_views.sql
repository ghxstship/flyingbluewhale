-- KBYG guide view tracking (read receipts).
--
-- The Boarding Pass renderers (/p/[slug]/guide, /m/guide) record one row per
-- viewer per guide; a repeat visit refreshes viewed_at instead of stacking
-- rows. The guides CMS surfaces the per-persona viewer count so producers can
-- see whether the field actually opened their Know-Before-You-Go.
--
-- LDP note: viewed_at is a plain event timestamp, not a lifecycle column —
-- no *_phase/*_state naming applies.

create table public.guide_views (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  guide_id uuid not null references public.event_guides(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  persona text not null,
  viewed_at timestamptz not null default now()
);

-- One row per (guide, viewer). A FULL unique index rather than a partial
-- "where user_id is not null" one: NULL user_ids are distinct under the
-- default NULLS DISTINCT semantics (rows orphaned by user deletion never
-- conflict), and PostgREST's upsert emits a bare ON CONFLICT (guide_id,
-- user_id) which cannot infer a partial index — the renderers' read-receipt
-- upsert needs this index to be inferable.
create unique index guide_views_guide_user_key
  on public.guide_views (guide_id, user_id);

create index guide_views_org_guide_idx
  on public.guide_views (org_id, guide_id);

alter table public.guide_views enable row level security;

-- Viewers write their own read receipt (insert on first view, update on
-- refresh via the upsert path).
create policy guide_views_self_insert on public.guide_views
  for insert to authenticated
  with check (user_id = auth.uid());

create policy guide_views_self_update on public.guide_views
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Org members (the CMS) read view stats; viewers can always read their own.
create policy guide_views_org_read on public.guide_views
  for select using (private.is_org_member(org_id) or user_id = auth.uid());
