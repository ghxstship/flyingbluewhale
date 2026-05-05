-- ============================================================================
-- Enterprise Auth — SAML SSO, SCIM provisioning, IP allowlist, event log
-- ============================================================================
-- Phase 5.2 of the SmartSuite parity roadmap.
--
-- Three opt-in enterprise-tier capabilities:
--   1. SAML / OIDC SSO providers per org (mirrors SmartSuite SSO).
--   2. SCIM 2.0 tokens per org for Idp-driven user/group provisioning.
--   3. IP allowlist enforced in middleware (CIDR ranges per org).
--   4. Event-log destinations for streaming audit_log out to S3/HTTP/Datadog.
--
-- Every feature is OPT-IN at the org level — empty tables = no enforcement,
-- so this migration is non-breaking on existing tenants.
--
-- Idempotent. Safe to re-apply.
-- ============================================================================

-- SAML / OIDC providers per org.
-- We sit on top of Supabase Auth's `sso.providers` API: when the admin adds a
-- provider here we also call `supabase.auth.admin.sso.providers.create({...})`
-- and store the returned id in `supabase_id`. The actual SAML flow goes
-- through `/auth/v1/sso?provider=<supabase_id>` — this row is the bookkeeping.
create table if not exists org_sso_providers (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  /** Type: 'saml' | 'oidc'. */
  provider_type   text not null check (provider_type in ('saml','oidc')),
  /** Display name (e.g. "Acme Okta"). */
  name            text not null,
  /** Supabase Auth provider id (from sso.providers). */
  supabase_id     text unique,
  /** IdP-side metadata (XML or URL). User-supplied at create time. */
  idp_metadata    text,
  /** Logout URL (SmartSuite Jan 2026 "SSO logout URL" feature). */
  logout_url      text,
  /** Email domain → provider routing. When user signs in with @<domain>,
      route them to this SAML provider. */
  email_domains   text[] not null default '{}',
  enabled         boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists org_sso_providers_org_idx on org_sso_providers(org_id);
create index if not exists org_sso_providers_email_domains_idx on org_sso_providers using gin (email_domains);

-- SCIM tokens per org.
-- Hashed (sha256). Plaintext shown ONCE at creation. The Idp authenticates to
-- our SCIM endpoints via `Authorization: Bearer <plaintext>`; we hash and
-- compare against `token_hash`.
create table if not exists org_scim_tokens (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  /** sha256(plaintext) */
  token_hash   text not null,
  /** Display name (which Idp this is for). */
  name         text not null,
  enabled      boolean not null default true,
  last_used_at timestamptz,
  created_by   uuid references users(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (org_id, name)
);

create index if not exists org_scim_tokens_token_hash_idx on org_scim_tokens(token_hash) where enabled = true;

-- IP allowlist per org. Empty allowlist = no enforcement (opt-in).
create table if not exists org_ip_allowlist (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  /** CIDR or single IP. Native postgres `cidr` type supports v4 + v6 with
      the `<<=` containment operator. */
  cidr        cidr not null,
  /** Optional human label (office, VPN, etc.). */
  label       text,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists org_ip_allowlist_org_idx on org_ip_allowlist(org_id) where enabled = true;

-- Event log destinations.
-- A cron worker (`event-log.publish`, every 5 min) drains audit_log rows for
-- each enabled destination, signs them, and POSTs/uploads. Cursor is tracked
-- on this row so a destination going down doesn't lose events.
create table if not exists org_event_log_destinations (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  /** 'http' | 's3' | 'datadog'. v1 ships HTTP; the others are scaffolded. */
  destination     text not null check (destination in ('http','s3','datadog')),
  /** Endpoint URL or S3 bucket+prefix or Datadog API config. */
  config          jsonb not null default '{}'::jsonb,
  /** sha256(shared secret) — for HMAC signature verification on the
      receiving side. */
  secret_hash     text,
  enabled         boolean not null default true,
  /** Cursor — last audit_log.id we've successfully published. */
  last_published_id uuid,
  last_published_at timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists org_event_log_dest_org_idx on org_event_log_destinations(org_id) where enabled = true;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS — owner/admin only. End users never touch these tables; the SCIM
-- endpoints use the service-role client (bypassing RLS) and authenticate the
-- caller via the Bearer SCIM token instead.
-- ─────────────────────────────────────────────────────────────────────────

alter table org_sso_providers enable row level security;
alter table org_scim_tokens enable row level security;
alter table org_ip_allowlist enable row level security;
alter table org_event_log_destinations enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'org_sso_providers' and policyname = 'sso_admin') then
    create policy "sso_admin" on org_sso_providers for all
      using (has_org_role(org_id, array['owner','admin']))
      with check (has_org_role(org_id, array['owner','admin']));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'org_scim_tokens' and policyname = 'scim_admin') then
    create policy "scim_admin" on org_scim_tokens for all
      using (has_org_role(org_id, array['owner','admin']))
      with check (has_org_role(org_id, array['owner','admin']));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'org_ip_allowlist' and policyname = 'ip_admin') then
    create policy "ip_admin" on org_ip_allowlist for all
      using (has_org_role(org_id, array['owner','admin']))
      with check (has_org_role(org_id, array['owner','admin']));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'org_event_log_destinations' and policyname = 'evtlog_admin') then
    create policy "evtlog_admin" on org_event_log_destinations for all
      using (has_org_role(org_id, array['owner','admin']))
      with check (has_org_role(org_id, array['owner','admin']));
  end if;
end $$;

comment on table org_sso_providers is
  'Per-org SAML/OIDC providers. Bookkeeping table — actual SAML flow lives in '
  'Supabase Auth `sso.providers`. Empty for an org = no SSO. Opt-in.';
comment on table org_scim_tokens is
  'Per-org SCIM 2.0 bearer tokens. sha256(plaintext). Plaintext shown once. Opt-in.';
comment on table org_ip_allowlist is
  'Per-org IP allowlist (CIDR ranges). Empty = no enforcement. Opt-in.';
comment on table org_event_log_destinations is
  'Per-org audit_log streaming targets. Cursor in last_published_id. Opt-in.';
