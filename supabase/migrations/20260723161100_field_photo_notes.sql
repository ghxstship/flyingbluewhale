-- T1-5 (ratified expansion) · Standalone geotagged photo notes.
--
-- The Capture surface's "Photo note" destination. Investigated stores that
-- did NOT fit before authoring this:
--   * public.reality_captures (/studio/captures) — a Matterport-style scan
--     registry (source/panorama_count/sqft/capture_state pipeline), not a
--     field photo artifact.
--   * the 20260721040956 field_* ops ledgers — no photo store among them.
--
-- Shape: one row per captured photo note. Bytes live in the same
-- `procore-parity` storage bucket as daily-log photos (org/user path layout,
-- `storage_org_scoped_upload` policy); this table is the record. Geotag
-- mirrors daily_log_photos (lat/lng/accuracy_m, null when the device gave no
-- fix — never guessed). `project_id`/`location_id` are the geofence
-- resolver's auto-filing, nullable because a note shot outside every fence
-- is still worth keeping.
--
-- LDP: no lifecycle — a photo note is an artifact, not a workflow.

create table if not exists public.field_photo_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  created_by uuid not null references public.users(id) on delete cascade,
  file_path text not null,
  note text,
  lat numeric,
  lng numeric,
  accuracy_m numeric,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_field_photo_notes_org_created on public.field_photo_notes (org_id, created_at desc);
create index if not exists idx_field_photo_notes_project on public.field_photo_notes (project_id) where project_id is not null;
create index if not exists idx_field_photo_notes_location on public.field_photo_notes (location_id) where location_id is not null;
create index if not exists idx_field_photo_notes_created_by on public.field_photo_notes (created_by);

create trigger field_photo_notes_touch_updated_at
  before update on public.field_photo_notes
  for each row execute function public.touch_updated_at();

alter table public.field_photo_notes enable row level security;

-- pg_default_acl grants anon SELECT on new tables — revoke explicitly.
revoke all on public.field_photo_notes from anon;
grant select, insert, update, delete on public.field_photo_notes to authenticated;

-- Org members read; any member inserts THEIR OWN note (member-insert-own —
-- capture is a crew capability, not a manager one); the author edits or
-- removes their own, the manager band can moderate any.
create policy field_photo_notes_select on public.field_photo_notes
  for select to authenticated
  using (private.is_org_member(org_id));

create policy field_photo_notes_insert_own on public.field_photo_notes
  for insert to authenticated
  with check (private.is_org_member(org_id) and created_by = (select auth.uid()));

create policy field_photo_notes_update on public.field_photo_notes
  for update to authenticated
  using (
    private.is_org_member(org_id)
    and (created_by = (select auth.uid()) or private.has_org_role(org_id, array['owner','admin','manager','controller']))
  )
  with check (
    private.is_org_member(org_id)
    and (created_by = (select auth.uid()) or private.has_org_role(org_id, array['owner','admin','manager','controller']))
  );

create policy field_photo_notes_delete on public.field_photo_notes
  for delete to authenticated
  using (
    private.is_org_member(org_id)
    and (created_by = (select auth.uid()) or private.has_org_role(org_id, array['owner','admin','manager','controller']))
  );
