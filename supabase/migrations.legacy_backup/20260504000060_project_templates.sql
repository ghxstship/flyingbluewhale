-- ============================================================================
-- project_templates — reusable starter blueprints
-- ============================================================================
-- Phase 6.3 of the SmartSuite parity roadmap. SmartSuite ships solution
-- templates as a portable bundle of records + structure; we ship a leaner
-- version focused on production work: a project shape (status, modules
-- enabled, default sections) plus seeded child rows (deliverable templates,
-- tasks, guides). Per https://help.smartsuite.com/en/collections/2709053-smartsuite-solutions
-- ============================================================================

create table if not exists project_templates (
  id              uuid primary key default gen_random_uuid(),
  /** When org_id is null the template is global (platform-shipped). When set,
   *  it's an org-scoped private template. */
  org_id          uuid references orgs(id) on delete cascade,
  slug            text not null,
  name            text not null,
  description     text,
  /** Category for the gallery: festival | activation | tour | corporate | sponsor | custom. */
  category        text not null default 'custom',
  /** Marketing tagline. */
  tagline         text,
  /** Cover image URL (optional). */
  cover_image     text,
  /** Pre-seeded shape: { project: {...}, deliverables: [...], tasks: [...], guides: [...] }. */
  blueprint       jsonb not null default '{}'::jsonb,
  /** When true, surfaces in the public gallery. */
  enabled         boolean not null default true,
  is_official     boolean not null default false,
  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (org_id, slug)
);

create index if not exists project_templates_category_idx on project_templates(category) where enabled = true;
create index if not exists project_templates_org_idx on project_templates(org_id) where org_id is not null;
-- Postgres treats NULL as distinct in unique constraints — add a partial unique
-- index to enforce at most one global template per slug.
create unique index if not exists project_templates_global_slug_idx
  on project_templates (slug) where org_id is null;

alter table project_templates enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'project_templates' and policyname = 'tpl_select') then
    -- Visible: global templates (org_id null) OR own org's templates
    create policy "tpl_select" on project_templates for select
      using (org_id is null or is_org_member(org_id));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'project_templates' and policyname = 'tpl_admin_write') then
    create policy "tpl_admin_write" on project_templates for all
      using (org_id is not null and has_org_role(org_id, array['owner','admin','manager']))
      with check (org_id is not null and has_org_role(org_id, array['owner','admin','manager']));
  end if;
end $$;

create or replace function tg_project_templates_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists project_templates_updated_at_tg on project_templates;
create trigger project_templates_updated_at_tg
  before update on project_templates
  for each row execute function tg_project_templates_updated_at();

-- Seed a few official templates. These are platform-shipped (org_id null)
-- and visible to every org. Idempotent via the partial-unique index above.
do $$
begin
  insert into project_templates (org_id, slug, name, description, category, tagline, blueprint, is_official)
  select * from (values
    (null::uuid, 'festival'::text, 'Festival'::text, 'Multi-stage outdoor festival production with vendor management and accreditation.'::text,
     'festival'::text, 'Three days, one truth.'::text,
     '{"project":{"kind":"festival","modules":["operations","schedule","credentials","vendors","incidents","ros","advancing"]},"deliverables":[{"kind":"rider","title":"Stage Plot"},{"kind":"rider","title":"Input List"},{"kind":"document","title":"Production Schedule"}]}'::jsonb,
     true),
    (null, 'corporate-activation', 'Corporate Activation', 'Brand activation event with sponsor management, guest list, and AV coordination.',
     'activation', 'Activation, executed.',
     '{"project":{"kind":"activation","modules":["operations","schedule","sponsors","guests","invoicing"]},"deliverables":[{"kind":"document","title":"Run of Show"},{"kind":"document","title":"Sponsor Deck"}]}'::jsonb,
     true),
    (null, 'tour-day', 'Tour Day', 'Single-show day on a multi-city tour. Advancing, hospitality, transport.',
     'tour', 'Load in. Show. Load out.',
     '{"project":{"kind":"tour-day","modules":["operations","schedule","advancing","hospitality","transport"]},"deliverables":[{"kind":"rider","title":"Hospitality Rider"},{"kind":"rider","title":"Technical Rider"}]}'::jsonb,
     true),
    (null, 'sponsor-package', 'Sponsor Package', 'Sponsor activation across one event. Deliverables, deadlines, signoff.',
     'sponsor', 'Promised, delivered, billed.',
     '{"project":{"kind":"sponsor","modules":["sponsors","deliverables","invoicing"]},"deliverables":[{"kind":"document","title":"Activation Brief"},{"kind":"document","title":"Post-Event Report"}]}'::jsonb,
     true)
  ) as v(org_id, slug, name, description, category, tagline, blueprint, is_official)
  where not exists (
    select 1 from project_templates pt where pt.org_id is null and pt.slug = v.slug
  );
end $$;
