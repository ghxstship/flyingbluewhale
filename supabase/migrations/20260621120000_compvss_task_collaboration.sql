-- Shared updated_at trigger for COMPVSS field tables (3NF SSOT rebuild).
create or replace function public.compvss_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ── task_comments ─────────────────────────────────────────────────────────
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  mentions uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index task_comments_task_idx on public.task_comments (org_id, task_id, created_at);
alter table public.task_comments enable row level security;
create policy task_comments_select on public.task_comments for select using (private.is_org_member(org_id));
create policy task_comments_insert on public.task_comments for insert with check (private.is_org_member(org_id) and author_id = auth.uid());
create policy task_comments_update on public.task_comments for update using (author_id = auth.uid() or private.has_org_role(org_id, array['owner','admin'])) with check (author_id = auth.uid() or private.has_org_role(org_id, array['owner','admin']));
create policy task_comments_delete on public.task_comments for delete using (author_id = auth.uid() or private.has_org_role(org_id, array['owner','admin']));
create trigger trg_task_comments_updated before update on public.task_comments for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.task_comments to authenticated;

-- ── task_attachments (photos / files) ─────────────────────────────────────
create table public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  storage_path text not null,
  file_name text,
  mime_type text,
  attachment_kind text not null default 'photo' check (attachment_kind in ('photo','file')),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index task_attachments_task_idx on public.task_attachments (org_id, task_id, created_at);
alter table public.task_attachments enable row level security;
create policy task_attachments_select on public.task_attachments for select using (private.is_org_member(org_id));
create policy task_attachments_insert on public.task_attachments for insert with check (private.is_org_member(org_id) and uploaded_by = auth.uid());
create policy task_attachments_delete on public.task_attachments for delete using (uploaded_by = auth.uid() or private.has_org_role(org_id, array['owner','admin']));
grant select, insert, update, delete on public.task_attachments to authenticated;

-- ── task_events (append-only activity journal) ────────────────────────────
create table public.task_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  event_kind text not null check (event_kind in ('created','state_change','assigned','comment','attachment','due_change')),
  from_state text,
  to_state text,
  actor_id uuid references auth.users(id) on delete set null,
  body text,
  created_at timestamptz not null default now()
);
create index task_events_task_idx on public.task_events (org_id, task_id, created_at);
alter table public.task_events enable row level security;
create policy task_events_select on public.task_events for select using (private.is_org_member(org_id));
create policy task_events_insert on public.task_events for insert with check (private.is_org_member(org_id));
grant select, insert on public.task_events to authenticated;
