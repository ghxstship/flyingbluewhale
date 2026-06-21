-- ── shift_notes (off time_entries.description) ────────────────────────────
create table public.shift_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  time_entry_id uuid not null references public.time_entries(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  as_manager boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index shift_notes_entry_idx on public.shift_notes (org_id, time_entry_id, created_at);
alter table public.shift_notes enable row level security;
create policy shift_notes_select on public.shift_notes for select using (private.is_org_member(org_id));
create policy shift_notes_insert on public.shift_notes for insert with check (private.is_org_member(org_id) and author_id = auth.uid());
create policy shift_notes_update on public.shift_notes for update using (author_id = auth.uid() or private.has_org_role(org_id, array['owner','admin'])) with check (author_id = auth.uid() or private.has_org_role(org_id, array['owner','admin']));
create policy shift_notes_delete on public.shift_notes for delete using (author_id = auth.uid() or private.has_org_role(org_id, array['owner','admin']));
create trigger trg_shift_notes_updated before update on public.shift_notes for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.shift_notes to authenticated;

-- ── handovers (off daily_logs notes hack) ─────────────────────────────────
create table public.handovers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  from_user_id uuid references auth.users(id) on delete set null,
  to_user_id uuid references auth.users(id) on delete set null,
  relief_label text,
  post_state text not null default 'all_clear' check (post_state in ('all_clear','watch_items','issues')),
  summary text not null,
  open_items text,
  assets_passed text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index handovers_org_idx on public.handovers (org_id, created_at desc);
alter table public.handovers enable row level security;
create policy handovers_select on public.handovers for select using (private.is_org_member(org_id));
create policy handovers_insert on public.handovers for insert with check (private.is_org_member(org_id) and from_user_id = auth.uid());
create policy handovers_update on public.handovers for update using (from_user_id = auth.uid() or private.has_org_role(org_id, array['owner','admin'])) with check (from_user_id = auth.uid() or private.has_org_role(org_id, array['owner','admin']));
create policy handovers_delete on public.handovers for delete using (from_user_id = auth.uid() or private.has_org_role(org_id, array['owner','admin']));
create trigger trg_handovers_updated before update on public.handovers for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.handovers to authenticated;

-- handover photos (3NF child, no repeating-group array)
create table public.handover_attachments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  handover_id uuid not null references public.handovers(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index handover_attachments_idx on public.handover_attachments (handover_id);
alter table public.handover_attachments enable row level security;
create policy handover_attachments_select on public.handover_attachments for select using (private.is_org_member(org_id));
create policy handover_attachments_insert on public.handover_attachments for insert with check (private.is_org_member(org_id));
create policy handover_attachments_delete on public.handover_attachments for delete using (private.has_org_role(org_id, array['owner','admin']) or exists (select 1 from public.handovers h where h.id = handover_id and h.from_user_id = auth.uid()));
grant select, insert, update, delete on public.handover_attachments to authenticated;
