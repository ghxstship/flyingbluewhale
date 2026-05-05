-- Settings completion (2026-04-25)
-- Builds the data layer behind every settings page that was previously
-- a UI stub. See docs/ia/03-ia-compression-proposal.md and the post-IA
-- settings audit. Every table is org-scoped with RLS.

------------------------------------------------------------------
-- 1. api_keys — programmatic access tokens (settings/api)
------------------------------------------------------------------
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  prefix text not null,                                  -- short visible identifier (sk_live_…)
  hashed_secret text not null,                           -- bcrypt of the full secret
  scopes text[] not null default '{}'::text[],
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_api_keys_org on api_keys (org_id) where revoked_at is null;

alter table api_keys enable row level security;
create policy api_keys_org_select on api_keys for select using (is_org_member(org_id));
create policy api_keys_org_insert on api_keys for insert with check (has_org_role(org_id, array['owner','admin']));
create policy api_keys_org_update on api_keys for update using (has_org_role(org_id, array['owner','admin']));
create policy api_keys_org_delete on api_keys for delete using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 2. org_domains — custom domains for portals (settings/domains)
------------------------------------------------------------------
create table if not exists org_domains (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  hostname text not null,                                -- portal.example.com
  purpose text not null default 'portal' check (purpose in ('portal','marketing','email')),
  verification_method text not null default 'txt' check (verification_method in ('txt','cname')),
  verification_token text not null default substr(md5(random()::text), 1, 24),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (hostname)
);
create index if not exists idx_org_domains_org on org_domains (org_id);

alter table org_domains enable row level security;
create policy org_domains_org_select on org_domains for select using (is_org_member(org_id));
create policy org_domains_org_insert on org_domains for insert with check (has_org_role(org_id, array['owner','admin']));
create policy org_domains_org_update on org_domains for update using (has_org_role(org_id, array['owner','admin']));
create policy org_domains_org_delete on org_domains for delete using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 3. org_integrations — per-connector install state (settings/integrations)
------------------------------------------------------------------
create table if not exists org_integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  connector text not null,                               -- 'stripe' | 'slack' | 'google' | 'clickup' | …
  status text not null default 'disabled' check (status in ('disabled','installing','installed','error')),
  config jsonb not null default '{}'::jsonb,
  installed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, connector)
);
create index if not exists idx_org_integrations_org on org_integrations (org_id);

alter table org_integrations enable row level security;
create policy org_integrations_org_select on org_integrations for select using (is_org_member(org_id));
create policy org_integrations_org_modify on org_integrations for all using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 4. import_runs — bulk-import job tracking (settings/imports)
------------------------------------------------------------------
create table if not exists import_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  kind text not null,                                    -- 'clients' | 'leads' | 'crew' | 'tasks' | …
  source text not null default 'csv',
  filename text,
  rows_total int not null default 0,
  rows_imported int not null default 0,
  rows_failed int not null default 0,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled')),
  error text,
  log jsonb,
  created_by uuid references auth.users(id),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_import_runs_org_created on import_runs (org_id, created_at desc);

alter table import_runs enable row level security;
create policy import_runs_org_select on import_runs for select using (is_org_member(org_id));
create policy import_runs_org_modify on import_runs for all using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 5. governance_committees + governance_policies (settings/governance)
------------------------------------------------------------------
create table if not exists governance_committees (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  charter text,
  cadence text,                                          -- 'weekly' | 'biweekly' | 'monthly' | 'ad_hoc'
  chair_user_id uuid references auth.users(id),
  members jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_committees_org on governance_committees (org_id);

create table if not exists governance_policies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  category text,                                         -- 'finance' | 'safety' | 'hr' | 'data'
  body text,
  effective_at timestamptz,
  reviewed_at timestamptz,
  next_review_at timestamptz,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  owner_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_policies_org on governance_policies (org_id);

alter table governance_committees enable row level security;
alter table governance_policies enable row level security;
create policy committees_org_select on governance_committees for select using (is_org_member(org_id));
create policy committees_org_modify on governance_committees for all using (has_org_role(org_id, array['owner','admin']));
create policy policies_org_select on governance_policies for select using (is_org_member(org_id));
create policy policies_org_modify on governance_policies for all using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 6. org_roles — custom permission roles (people/roles)
------------------------------------------------------------------
create table if not exists org_roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  slug text not null,
  label text not null,
  description text,
  permissions text[] not null default '{}'::text[],
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists idx_org_roles_org on org_roles (org_id);

alter table org_roles enable row level security;
create policy org_roles_org_select on org_roles for select using (is_org_member(org_id));
create policy org_roles_org_modify on org_roles for all using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 7. asset_links — credential → physical badge/card (people/credentials/asset-linker)
------------------------------------------------------------------
create table if not exists asset_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  credential_id uuid not null references credentials(id) on delete cascade,
  asset_kind text not null check (asset_kind in ('nfc_tag','rfid_card','barcode','qr_code')),
  asset_serial text not null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (org_id, asset_serial) -- a physical token only links once at a time
);
create index if not exists idx_asset_links_credential on asset_links (credential_id);

alter table asset_links enable row level security;
create policy asset_links_org_select on asset_links for select using (is_org_member(org_id));
create policy asset_links_org_modify on asset_links for all using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 8. orgs columns — compliance + datamap settings (jsonb so additions
--    don't require new migrations)
------------------------------------------------------------------
alter table orgs add column if not exists compliance_settings jsonb not null default '{}'::jsonb;
alter table orgs add column if not exists datamap jsonb not null default '{}'::jsonb;
