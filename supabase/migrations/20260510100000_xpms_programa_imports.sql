-- ADR-0004 Phase 4 — Programa imports as XPMS-cell-aligned schema.
--
-- Three new tables, each landing in its canonical (Class × Phase) cell:
--
--   pinboards / pinboard_items   → CREATIVE (1) × Concept (2)
--   vendor_products              → EXECUTIVE (0) × Development (3)
--   client_dashboards            → MARKETING (3) × Show (6)
--
-- Plus extension columns on `deliverables` for the schedule render
-- layer: PDF / XLSX / QR token, so a deliverable can be rendered as a
-- shareable artifact (Programa's FF&E Schedule pattern), landing in
-- (CREATIVE × Development) and (PRODUCTION × Development).
--
-- All tables: org-scoped, RLS-gated, soft-deletable, timestamped.
-- Naming follows LDP discipline (no `status` columns; `*_phase` for
-- macro arc; `*_state` for cyclical operational).

-- ---------------------------------------------------------------------
-- 1. PINBOARDS — Programa "Mood Boards / Pinboards"
--    Cell: (CREATIVE × Concept)
-- ---------------------------------------------------------------------

create table if not exists "public"."pinboards" (
  "id" uuid primary key default gen_random_uuid(),
  "org_id" uuid not null references public.orgs(id) on delete cascade,
  "project_id" uuid references public.projects(id) on delete cascade,
  "title" text not null check (char_length(title) between 1 and 200),
  "description" text,
  "cover_url" text,
  "share_token" text unique,           -- nullable; minted on share
  "share_passcode_hash" text,          -- bcrypt or sha256-hex
  "shared_at" timestamptz,
  "created_by" uuid references public.users(id),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "deleted_at" timestamptz,
  "xpms_atom_id" uuid                  -- optional XPMS atom linkage
);

create index "idx_pinboards_org_id" on public.pinboards (org_id);
create index "idx_pinboards_project_id" on public.pinboards (project_id);
create index "idx_pinboards_share_token" on public.pinboards (share_token) where share_token is not null;

alter table public.pinboards enable row level security;

create policy "pinboards_org_select" on public.pinboards for select
  using (private.is_org_member(org_id));
create policy "pinboards_org_insert" on public.pinboards for insert
  with check (private.is_org_member(org_id));
create policy "pinboards_org_update" on public.pinboards for update
  using (private.has_org_role(org_id, array['owner','admin','manager','member']))
  with check (private.has_org_role(org_id, array['owner','admin','manager','member']));
create policy "pinboards_org_delete" on public.pinboards for delete
  using (private.has_org_role(org_id, array['owner','admin','manager']));

create trigger "pinboards_set_updated_at"
  before update on public.pinboards
  for each row execute function public.bump_updated_at();

comment on table public.pinboards is
  'Mood-board / pinboard container, owned by a project. ADR-0004 Programa import → (CREATIVE × Concept) cell.';
comment on column public.pinboards.share_token is
  'Share-link token; minted via the same crypto pattern as proposal_share_links. Nullable until first share.';

-- ---------------------------------------------------------------------
-- 2. PINBOARD_ITEMS — image / spec ref / note inside a pinboard
-- ---------------------------------------------------------------------

create type "public"."pinboard_item_kind" as enum ('image', 'note', 'product_ref', 'swatch');

create table if not exists "public"."pinboard_items" (
  "id" uuid primary key default gen_random_uuid(),
  "pinboard_id" uuid not null references public.pinboards(id) on delete cascade,
  "org_id" uuid not null references public.orgs(id) on delete cascade,
  "kind" public.pinboard_item_kind not null default 'image',
  "title" text,
  "body" text,                         -- note text or caption
  "media_path" text,                   -- storage path for image / file
  "external_url" text,                 -- web-clipper source URL
  "vendor_product_id" uuid,            -- FK set after vendor_products created below
  "swatch_hex" text check (swatch_hex is null or swatch_hex ~ '^#[0-9a-fA-F]{6}$'),
  "position_x" integer not null default 0,
  "position_y" integer not null default 0,
  "width" integer,
  "height" integer,
  "z_index" integer not null default 0,
  "metadata" jsonb not null default '{}'::jsonb,
  "created_by" uuid references public.users(id),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "deleted_at" timestamptz
);

create index "idx_pinboard_items_pinboard_id" on public.pinboard_items (pinboard_id);
create index "idx_pinboard_items_org_id" on public.pinboard_items (org_id);
create index "idx_pinboard_items_vendor_product_id" on public.pinboard_items (vendor_product_id) where vendor_product_id is not null;

alter table public.pinboard_items enable row level security;

create policy "pinboard_items_org_select" on public.pinboard_items for select
  using (private.is_org_member(org_id));
create policy "pinboard_items_org_insert" on public.pinboard_items for insert
  with check (private.is_org_member(org_id));
create policy "pinboard_items_org_update" on public.pinboard_items for update
  using (private.has_org_role(org_id, array['owner','admin','manager','member']))
  with check (private.has_org_role(org_id, array['owner','admin','manager','member']));
create policy "pinboard_items_org_delete" on public.pinboard_items for delete
  using (private.has_org_role(org_id, array['owner','admin','manager','member']));

create trigger "pinboard_items_set_updated_at"
  before update on public.pinboard_items
  for each row execute function public.bump_updated_at();

-- ---------------------------------------------------------------------
-- 3. VENDOR_PRODUCTS — Programa "Product Library" / Web Clipper target
--    Cell: (EXECUTIVE × Development)
-- ---------------------------------------------------------------------

create table if not exists "public"."vendor_products" (
  "id" uuid primary key default gen_random_uuid(),
  "org_id" uuid not null references public.orgs(id) on delete cascade,
  "vendor_id" uuid references public.vendors(id) on delete set null,
  "title" text not null check (char_length(title) between 1 and 300),
  "summary" text,
  "sku" text,
  "external_url" text,                 -- the URL the web-clipper captured from
  "image_path" text,                   -- storage path; NULL while syncing
  "image_url" text,                    -- public CDN-rehosted URL when applicable
  "unit_price_cents" bigint check (unit_price_cents is null or unit_price_cents >= 0),
  "currency" text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  "supplier_sku" text,
  "supplier_lead_time_days" integer check (supplier_lead_time_days is null or supplier_lead_time_days >= 0),
  "tags" text[] not null default '{}',
  "category" text,
  "spec" jsonb not null default '{}'::jsonb,  -- free-form spec sheet payload
  "captured_via" text not null default 'manual' check (captured_via in ('manual','web_clipper','api','import')),
  "captured_at" timestamptz,
  "created_by" uuid references public.users(id),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "deleted_at" timestamptz,
  "xpms_atom_id" uuid
);

create index "idx_vendor_products_org_id" on public.vendor_products (org_id);
create index "idx_vendor_products_vendor_id" on public.vendor_products (vendor_id) where vendor_id is not null;
create index "idx_vendor_products_category" on public.vendor_products (category) where category is not null;
create index "idx_vendor_products_tags_gin" on public.vendor_products using gin (tags);

alter table public.vendor_products enable row level security;

create policy "vendor_products_org_select" on public.vendor_products for select
  using (private.is_org_member(org_id));
create policy "vendor_products_org_insert" on public.vendor_products for insert
  with check (private.has_org_role(org_id, array['owner','admin','manager','member']));
create policy "vendor_products_org_update" on public.vendor_products for update
  using (private.has_org_role(org_id, array['owner','admin','manager','member']))
  with check (private.has_org_role(org_id, array['owner','admin','manager','member']));
create policy "vendor_products_org_delete" on public.vendor_products for delete
  using (private.has_org_role(org_id, array['owner','admin','manager']));

create trigger "vendor_products_set_updated_at"
  before update on public.vendor_products
  for each row execute function public.bump_updated_at();

-- Wire the deferred FK from pinboard_items.vendor_product_id now that
-- the table exists.
alter table public.pinboard_items
  add constraint "pinboard_items_vendor_product_id_fkey"
  foreign key (vendor_product_id) references public.vendor_products(id) on delete set null;

comment on table public.vendor_products is
  'Programa-style buyable product registry. Captured by Web Clipper / manual / API. ADR-0004 (EXECUTIVE × Development) cell.';
comment on column public.vendor_products.captured_via is
  'Provenance of the row: manual entry, browser web-clipper, partner API, or bulk import.';

-- ---------------------------------------------------------------------
-- 4. DELIVERABLES — schedule-render-as-artifact extension columns
--    Cell: (CREATIVE × Development) and (PRODUCTION × Development)
-- ---------------------------------------------------------------------

alter table public.deliverables
  add column if not exists "rendered_pdf_path" text,
  add column if not exists "rendered_xlsx_path" text,
  add column if not exists "render_qr_token" text unique,
  add column if not exists "rendered_at" timestamptz,
  add column if not exists "rendered_by" uuid references public.users(id);

comment on column public.deliverables.rendered_pdf_path is
  'Storage path to the latest PDF render of this deliverable as a Programa-style schedule artifact. Refreshed by the render worker.';
comment on column public.deliverables.render_qr_token is
  'On-site QR-share token. Resolves to a public, unauthenticated read-only render of the deliverable.';

-- ---------------------------------------------------------------------
-- 5. CLIENT_DASHBOARDS — Programa "Branded Client Dashboard"
--    Cell: (MARKETING × Show)
-- ---------------------------------------------------------------------

create table if not exists "public"."client_dashboards" (
  "id" uuid primary key default gen_random_uuid(),
  "org_id" uuid not null references public.orgs(id) on delete cascade,
  "project_id" uuid not null references public.projects(id) on delete cascade,
  "client_id" uuid references public.clients(id) on delete set null,
  "title" text not null check (char_length(title) between 1 and 200),
  "subtitle" text,
  "cover_url" text,
  "branding" jsonb not null default '{}'::jsonb,
  "share_token" text unique,
  "share_passcode_hash" text,
  "expires_at" timestamptz,
  "shared_at" timestamptz,
  "last_viewed_at" timestamptz,
  -- Curated bundle: which artifacts surface on the dashboard. Each
  -- key is a section, value is an array of resource ids.
  "sections" jsonb not null default '{}'::jsonb,
  "created_by" uuid references public.users(id),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "deleted_at" timestamptz
);

create index "idx_client_dashboards_org_id" on public.client_dashboards (org_id);
create index "idx_client_dashboards_project_id" on public.client_dashboards (project_id);
create index "idx_client_dashboards_share_token" on public.client_dashboards (share_token) where share_token is not null;

alter table public.client_dashboards enable row level security;

create policy "client_dashboards_org_select" on public.client_dashboards for select
  using (private.is_org_member(org_id));
create policy "client_dashboards_org_insert" on public.client_dashboards for insert
  with check (private.has_org_role(org_id, array['owner','admin','manager','member']));
create policy "client_dashboards_org_update" on public.client_dashboards for update
  using (private.has_org_role(org_id, array['owner','admin','manager','member']))
  with check (private.has_org_role(org_id, array['owner','admin','manager','member']));
create policy "client_dashboards_org_delete" on public.client_dashboards for delete
  using (private.has_org_role(org_id, array['owner','admin','manager']));

create trigger "client_dashboards_set_updated_at"
  before update on public.client_dashboards
  for each row execute function public.bump_updated_at();

comment on table public.client_dashboards is
  'Branded single-link share for a project, aggregating proposals + specs + budgets + approvals + comments. ADR-0004 (MARKETING × Show) cell.';
