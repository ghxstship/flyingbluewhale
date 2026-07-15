-- Workforce separation lifecycle — the offboarding mirror of onboarding.
--
-- Surfaced by the 2026-07 lifecycle audit: staff/crew separation was just a row
-- DELETE, which erased the person's record along with any separation date or
-- reason, and left onboarding (new_hire_flows) with no counterpart.
--
-- LDP: `engagement_state` is the CYCLICAL operational lifecycle of a person's
-- engagement with the org (active -> separated -> active on re-engagement), so
-- it takes the `_state` suffix, not `_phase` and never `status`.
--
-- Additive + defaulted: every existing row reads `active`, so no surface changes
-- behaviour until the separate action is used.

alter table public.crew_members
  add column if not exists engagement_state text not null default 'active'
    check (engagement_state in ('active', 'separated')),
  add column if not exists separated_at timestamptz,
  add column if not exists separation_reason text;

alter table public.workforce_members
  add column if not exists engagement_state text not null default 'active'
    check (engagement_state in ('active', 'separated')),
  add column if not exists separated_at timestamptz,
  add column if not exists separation_reason text;

-- Roster reads are org-scoped and will filter/segment on the state.
create index if not exists crew_members_org_engagement_state_idx
  on public.crew_members (org_id, engagement_state);
create index if not exists workforce_members_org_engagement_state_idx
  on public.workforce_members (org_id, engagement_state);

comment on column public.crew_members.engagement_state is
  'LDP cyclical lifecycle: active | separated. Separation preserves the row (and separated_at/separation_reason) instead of deleting it.';
comment on column public.workforce_members.engagement_state is
  'LDP cyclical lifecycle: active | separated. Separation preserves the row (and separated_at/separation_reason) instead of deleting it.';
