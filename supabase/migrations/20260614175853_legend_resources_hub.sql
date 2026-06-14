-- LEG3ND Knowledge — Resources Hub.
--
-- A curated library of resources (documents, links, templates, references,
-- videos) grouped by collection. Mirrors a knowledge / resource library
-- (Notion-style hub, Guru cards). Two org-scoped tables:
--   - resource_collections : named groups (name/description/sort_order)
--   - resources            : the library items themselves
--
-- File uploads are OUT OF SCOPE: only url/file_path text pointers are
-- stored. No Supabase Storage bucket, no signed URLs here.
--
-- NOTE: enums namespaced legend_* — a pre-existing public.resource_kind enum
-- (crew_role/equipment_class/...) belongs to an unrelated domain.
--
-- LDP naming discipline: NO bare `status`. The resource lifecycle is a
-- cyclical operational state → `resource_state` (postgres enum type, since
-- it is a lifecycle column). The discriminator `kind` is a plain enum
-- (taxonomy, not a lifecycle) so it keeps the `kind` name.

-- ── enum types ──────────────────────────────────────────────────────────
do $$ begin
  create type public.legend_resource_kind as enum ('link', 'document', 'template', 'video', 'reference');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.legend_resource_state as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

-- ── resource_collections ─────────────────────────────────────────────────
create table if not exists public.resource_collections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  description text,
  -- Manual ordering of collections on the hub. Lower sorts first.
  sort_order integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists resource_collections_org_sort_idx
  on public.resource_collections (org_id, sort_order, created_at)
  where deleted_at is null;

alter table public.resource_collections enable row level security;

create policy resource_collections_org_select
  on public.resource_collections for select
  using (private.is_org_member(org_id));

create policy resource_collections_org_write
  on public.resource_collections
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger resource_collections_touch_updated_at
  before update on public.resource_collections
  for each row execute function public.touch_updated_at();

-- ── resources ─────────────────────────────────────────────────────────────
-- `collection_id` is nullable: ungrouped resources surface in an "Ungrouped"
-- bucket on the hub. On collection delete the resource is preserved and the
-- pointer is nulled (SET NULL) rather than cascade-deleted.
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  collection_id uuid references public.resource_collections(id) on delete set null,
  title text not null,
  description text,
  kind public.legend_resource_kind not null default 'link',
  -- Pointers only — file uploads are out of scope. `url` for external/links,
  -- `file_path` for an already-stored object path (text reference, no upload).
  url text,
  file_path text,
  resource_state public.legend_resource_state not null default 'draft',
  tags text[] not null default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists resources_org_state_idx
  on public.resources (org_id, resource_state)
  where deleted_at is null;

create index if not exists resources_collection_idx
  on public.resources (org_id, collection_id)
  where deleted_at is null;

create index if not exists resources_tags_gin
  on public.resources using gin (tags)
  where deleted_at is null;

alter table public.resources enable row level security;

create policy resources_org_select
  on public.resources for select
  using (private.is_org_member(org_id));

create policy resources_org_write
  on public.resources
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger resources_touch_updated_at
  before update on public.resources
  for each row execute function public.touch_updated_at();
