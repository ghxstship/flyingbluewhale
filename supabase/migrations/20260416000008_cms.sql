-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 008: CMS (Block-Based Content)
-- ═══════════════════════════════════════════════════════

create type portal_track as enum ('artist', 'production', 'sponsor', 'guest', 'client');

-- CMS Pages
create table cms_pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  track portal_track not null,
  slug text not null,
  title text not null,
  blocks jsonb not null default '[]',
  visibility_tags text[] not null default '{}',
  published boolean not null default false,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, track, slug)
);

create index idx_cms_pages_project on cms_pages(project_id);
create index idx_cms_pages_track on cms_pages(track);
create index idx_cms_pages_published on cms_pages(published);

-- Revisions
create table cms_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references cms_pages(id) on delete cascade,
  version int not null,
  blocks jsonb not null,
  edited_by uuid not null references auth.users(id),
  edited_at timestamptz not null default now()
);

create index idx_cms_revisions_page on cms_revisions(page_id);

-- Auto-snapshot on publish
create or replace function snapshot_cms_on_publish()
returns trigger as $$
begin
  if old.published = false and new.published = true then
    new.version = old.version + 1;
    insert into cms_revisions (page_id, version, blocks, edited_by)
    values (new.id, new.version, new.blocks, auth.uid());
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger cms_page_publish_snapshot
  before update on cms_pages
  for each row execute function snapshot_cms_on_publish();
