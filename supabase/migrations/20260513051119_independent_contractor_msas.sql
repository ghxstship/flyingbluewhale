-- 20260513051119_independent_contractor_msas.sql
--
-- Independent Contractor MSA (Master Services Agreement) — one per
-- (org, crew_member). Signed once, applies to all future offer letters
-- for that crew member until version bump or revocation. Backfilled
-- from remote on 2026-05-23 (originally applied out-of-band).
--
-- Followed shortly by 20260519195510_msa_state_ldp.sql which renames
-- msa_status → msa_state per LDP naming discipline. This file captures
-- the original DDL as it landed in production for SSOT alignment.

-- =============================================================================
-- INDEPENDENT CONTRACTOR MSA (Master Services Agreement)
-- One per (org, crew_member). Signed once, applies to all future offer
-- letters for that crew member until version bump or revocation.
--
-- The MSA carries the heavy Nevada IC compliance language (NRS 608.0155
-- recitals, Relationship of the Parties, Terms & Conditions, Governing
-- Law, Exhibits B/C). Engagement letters reference it by link; signed-
-- once-per-relationship pattern matches industry practice (WME, CAA).
-- =============================================================================

create table public.independent_contractor_msas (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  crew_member_id uuid not null references public.crew_members(id) on delete cascade,

  -- Token-gated public access (mirrors offer_letters pattern)
  public_token uuid not null unique default gen_random_uuid(),
  access_code text not null default upper(substring(replace(gen_random_uuid()::text, '-', '') for 6)),
  token_expires_at timestamptz,

  -- Lifecycle
  msa_status text not null default 'draft'
    check (msa_status in ('draft','sent','viewed','signed','revoked','superseded')),
  version integer not null default 1,

  -- Snapshot of the body text at sign-time (legal immutability).
  -- Pulled from org_offer_letter_settings.default_terms + governing law at sign time.
  body_snapshot text,
  governing_law_snapshot text,

  -- Exhibits B + C (filled by contractor before/during signing)
  exhibit_b_other_clients jsonb not null default '[]'::jsonb,
  exhibit_c_capital_items jsonb not null default '[]'::jsonb,

  -- Chapter 624 + certs (for trade-scope MSAs)
  nscb_license_number text,
  nscb_classification text,
  nscb_monetary_limit_cents bigint,

  -- Engagement-tracking timestamps
  sent_at timestamptz,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  view_count integer not null default 0,
  signed_at timestamptz,
  signed_signature text,
  signed_ip inet,
  signed_user_agent text,
  revoked_at timestamptz,
  revoke_reason text,
  superseded_at timestamptz,
  superseded_by_msa_id uuid references public.independent_contractor_msas(id) on delete set null,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ic_msas_org_id_idx on public.independent_contractor_msas(org_id);
create index ic_msas_crew_member_id_idx on public.independent_contractor_msas(crew_member_id);
create index ic_msas_status_idx on public.independent_contractor_msas(msa_status);
create index ic_msas_public_token_idx on public.independent_contractor_msas(public_token);

-- One active (signed, non-revoked, non-superseded) MSA per crew member.
create unique index ic_msas_one_active_per_crew_idx
  on public.independent_contractor_msas(org_id, crew_member_id)
  where msa_status = 'signed';

create trigger touch_updated_at_ic_msas
  before update on public.independent_contractor_msas
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — org-scoped admin reads/writes; public token RPC handles signer access.
-- ---------------------------------------------------------------------------

alter table public.independent_contractor_msas enable row level security;

create policy ic_msas_org_select
  on public.independent_contractor_msas
  for select to authenticated
  using (private.is_org_member(org_id));

create policy ic_msas_org_insert
  on public.independent_contractor_msas
  for insert to authenticated
  with check (private.is_org_member(org_id));

create policy ic_msas_org_update
  on public.independent_contractor_msas
  for update to authenticated
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));

create policy ic_msas_org_delete
  on public.independent_contractor_msas
  for delete to authenticated
  using (private.is_org_member(org_id));

-- ---------------------------------------------------------------------------
-- Resolved view — joins crew_members + org for admin reads.
-- ---------------------------------------------------------------------------

create or replace view public.independent_contractor_msas_resolved
with (security_invoker = true)
as
select
  m.*,
  cm.name as crew_member_name,
  cm.email as crew_member_email,
  cm.phone as crew_member_phone,
  cm.role as crew_member_role,
  o.name as org_name
from public.independent_contractor_msas m
join public.crew_members cm on cm.id = m.crew_member_id
join public.orgs o on o.id = m.org_id;

grant select on public.independent_contractor_msas_resolved to authenticated;

-- ---------------------------------------------------------------------------
-- Helper: does this crew member have an active signed MSA?
-- Used by offer_letters_resolved to surface "MSA on file" state.
-- ---------------------------------------------------------------------------

create or replace function public.crew_member_active_msa(p_crew_member_id uuid)
returns table(
  msa_id uuid,
  signed_at timestamptz,
  version integer,
  public_token uuid
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select
    m.id,
    m.signed_at,
    m.version,
    m.public_token
  from public.independent_contractor_msas m
  where m.crew_member_id = p_crew_member_id
    and m.msa_status = 'signed'
    and m.revoked_at is null
    and m.superseded_at is null
  order by m.signed_at desc nulls last
  limit 1;
$$;

grant execute on function public.crew_member_active_msa(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- PUBLIC RPCs — token+code gated, mirror offer_letter pattern.
-- ---------------------------------------------------------------------------

create or replace function public.get_msa_by_token(p_token uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_row record;
begin
  select * into v_row
  from public.independent_contractor_msas_resolved
  where public_token = p_token
    and access_code = upper(p_code)
    and (token_expires_at is null or token_expires_at > now())
  limit 1;

  if not found then
    return null;
  end if;

  return to_jsonb(v_row);
end;
$$;

revoke execute on function public.get_msa_by_token(uuid, text) from public, anon, authenticated;
grant execute on function public.get_msa_by_token(uuid, text) to service_role;

create or replace function public.record_msa_view(p_token uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  update public.independent_contractor_msas
  set
    first_viewed_at = coalesce(first_viewed_at, now()),
    last_viewed_at = now(),
    view_count = view_count + 1,
    msa_status = case when msa_status = 'sent' then 'viewed' else msa_status end
  where public_token = p_token
    and access_code = upper(p_code)
    and (token_expires_at is null or token_expires_at > now());
end;
$$;

revoke execute on function public.record_msa_view(uuid, text) from public, anon, authenticated;
grant execute on function public.record_msa_view(uuid, text) to service_role;

create or replace function public.sign_msa(
  p_token uuid,
  p_code text,
  p_signature text,
  p_exhibit_b jsonb,
  p_exhibit_c jsonb,
  p_nscb_license text,
  p_nscb_classification text,
  p_nscb_monetary_limit_cents bigint,
  p_ip inet,
  p_user_agent text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_row record;
  v_org_settings record;
begin
  -- Verify token + code + not expired + not already signed
  select * into v_row
  from public.independent_contractor_msas
  where public_token = p_token
    and access_code = upper(p_code)
    and (token_expires_at is null or token_expires_at > now())
    and msa_status not in ('signed','revoked','superseded')
  for update;

  if not found then
    raise exception 'MSA not found, expired, or already signed';
  end if;

  -- Snapshot the body text + governing law from org settings
  select default_terms, default_governing_law
    into v_org_settings
  from public.org_offer_letter_settings
  where org_id = v_row.org_id;

  update public.independent_contractor_msas
  set
    msa_status = 'signed',
    signed_at = now(),
    signed_signature = p_signature,
    signed_ip = p_ip,
    signed_user_agent = p_user_agent,
    body_snapshot = coalesce(body_snapshot, v_org_settings.default_terms),
    governing_law_snapshot = coalesce(governing_law_snapshot, v_org_settings.default_governing_law),
    exhibit_b_other_clients = coalesce(p_exhibit_b, '[]'::jsonb),
    exhibit_c_capital_items = coalesce(p_exhibit_c, '[]'::jsonb),
    nscb_license_number = p_nscb_license,
    nscb_classification = p_nscb_classification,
    nscb_monetary_limit_cents = p_nscb_monetary_limit_cents
  where id = v_row.id
  returning * into v_row;

  return to_jsonb(v_row);
end;
$$;

revoke execute on function public.sign_msa(uuid, text, text, jsonb, jsonb, text, text, bigint, inet, text) from public, anon, authenticated;
grant execute on function public.sign_msa(uuid, text, text, jsonb, jsonb, text, text, bigint, inet, text) to service_role;
