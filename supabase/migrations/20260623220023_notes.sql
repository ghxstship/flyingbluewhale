-- Notes — lightweight rich-text notes for the console (kit v7 RichTextEditor
-- archetype). Org-scoped, soft-deletable, authored HTML body. LDP naming:
-- `note_state` (cyclical operational), never bare `status`.
--
-- CODE-READY migration — not applied to the live project here. The operator
-- applies it, then regenerates database.types.ts.

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  title text not null default 'Untitled note',
  body_html text not null default '',
  note_state text not null default 'draft' check (note_state in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index notes_org_idx on public.notes (org_id, updated_at desc) where deleted_at is null;

alter table public.notes enable row level security;

create policy notes_select on public.notes
  for select using (private.is_org_member(org_id));
create policy notes_insert on public.notes
  for insert with check (private.is_org_member(org_id) and created_by = auth.uid());
create policy notes_update on public.notes
  for update using (created_by = auth.uid() or private.has_org_role(org_id, array['owner', 'admin']))
  with check (created_by = auth.uid() or private.has_org_role(org_id, array['owner', 'admin']));
create policy notes_delete on public.notes
  for delete using (created_by = auth.uid() or private.has_org_role(org_id, array['owner', 'admin']));

create trigger trg_notes_updated before update on public.notes
  for each row execute function public.compvss_set_updated_at();

grant select, insert, update, delete on public.notes to authenticated;
