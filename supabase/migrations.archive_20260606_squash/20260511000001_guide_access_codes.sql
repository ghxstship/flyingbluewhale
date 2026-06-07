-- ============================================================================
-- Guide access codes — public-link-plus-code gate for internal personas.
-- ============================================================================
-- Public personas (tier 5: `guest`, `custom`) remain anon-readable when
-- `event_guides.published = true`. Internal personas (tier 1–4) gain a
-- second access path: a redeemed access code stamps a signed cookie that
-- the portal page consults alongside RLS. The cookie redemption is
-- recorded here for audit + revocation.
--
-- Idempotent (CREATE TABLE IF NOT EXISTS + ON CONFLICT for any seeds).
-- ============================================================================

create table if not exists guide_access_codes (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  project_id      uuid not null references projects(id) on delete cascade,
  persona         guide_persona not null,
  -- SHA-256 hex digest of the normalized code (uppercase, dashes stripped).
  -- The plaintext is shown to the operator exactly once on create and
  -- never stored.
  code_hash       text not null,
  -- First 4 chars of the plaintext (group form, e.g. "PROD") so the
  -- operator can disambiguate codes in the console without re-issuing.
  code_prefix     text not null,
  label           text,
  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz,
  revoked_at      timestamptz,
  max_uses        int,
  use_count       int not null default 0,
  last_used_at    timestamptz
);

create unique index if not exists guide_access_codes_hash_uq
  on guide_access_codes (project_id, code_hash);
create index if not exists guide_access_codes_project_persona_active
  on guide_access_codes (project_id, persona)
  where revoked_at is null;

create table if not exists guide_access_redemptions (
  id              uuid primary key default gen_random_uuid(),
  code_id         uuid not null references guide_access_codes(id) on delete cascade,
  project_id      uuid not null references projects(id) on delete cascade,
  persona         guide_persona not null,
  redeemed_at     timestamptz not null default now(),
  ip              inet,
  user_agent      text,
  -- JWT ID for revocation matching. Truncated to 32 chars in app code.
  cookie_jti      text not null
);
create index if not exists guide_access_redemptions_code_id
  on guide_access_redemptions (code_id, redeemed_at desc);
create index if not exists guide_access_redemptions_project
  on guide_access_redemptions (project_id, persona, redeemed_at desc);

-- RLS
alter table guide_access_codes enable row level security;
alter table guide_access_redemptions enable row level security;

-- Console CRUD: org members of the row's org can SELECT/INSERT/UPDATE/DELETE.
-- We use the canonical `private.is_org_member(org_id)` helper.
drop policy if exists "guide_access_codes_org_select" on guide_access_codes;
create policy "guide_access_codes_org_select"
  on guide_access_codes for select
  using (private.is_org_member(org_id));

drop policy if exists "guide_access_codes_org_insert" on guide_access_codes;
create policy "guide_access_codes_org_insert"
  on guide_access_codes for insert
  with check (private.is_org_member(org_id));

drop policy if exists "guide_access_codes_org_update" on guide_access_codes;
create policy "guide_access_codes_org_update"
  on guide_access_codes for update
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));

drop policy if exists "guide_access_codes_org_delete" on guide_access_codes;
create policy "guide_access_codes_org_delete"
  on guide_access_codes for delete
  using (private.is_org_member(org_id));

-- Redemptions: service-role-only at the data layer. The unlock API runs
-- under the service client (because anon visitors can't write under RLS),
-- and console reads of the audit trail happen via a SECURITY DEFINER view
-- (added below) that scopes to org members.
-- No policies created → RLS denies all anon/auth access; service role bypasses.

-- Audit view for the console (security definer; org-scoped).
create or replace view public.guide_access_redemption_log
with (security_invoker = on) as
select
  r.id,
  r.code_id,
  r.project_id,
  r.persona,
  r.redeemed_at,
  r.ip,
  r.user_agent,
  c.label as code_label,
  c.code_prefix,
  c.org_id
from guide_access_redemptions r
join guide_access_codes c on c.id = r.code_id;

-- Note: with security_invoker the view inherits the caller's privileges;
-- since guide_access_redemptions has no anon/auth SELECT policy, an
-- additional helper for the console reads through the service role in
-- application code (src/lib/db/guide-access.ts).

-- Touch updated_at on event_guides whenever an access code is created /
-- rotated / revoked so cached lists invalidate. Cheap.
create or replace function tg_guide_access_codes_touch_guide() returns trigger
  language plpgsql as $$
begin
  update event_guides
    set updated_at = now()
  where project_id = coalesce(new.project_id, old.project_id)
    and persona    = coalesce(new.persona, old.persona);
  return coalesce(new, old);
end;
$$;

drop trigger if exists guide_access_codes_touch on guide_access_codes;
create trigger guide_access_codes_touch
  after insert or update or delete on guide_access_codes
  for each row execute function tg_guide_access_codes_touch_guide();
