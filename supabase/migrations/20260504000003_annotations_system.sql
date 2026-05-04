-- ============================================================================
-- Annotations system — polymorphic flags, notes, comments, and tags
-- ============================================================================
-- Canonical primitive for "this record needs attention / confirmation /
-- discussion". Polymorphic across all entity types via (target_table,
-- target_id) — same shape as audit_log. Supersedes scattered free-form
-- `notes text` columns and the deliverable-only `deliverable_comments` table
-- as the org-wide pattern for follow-up tracking, integrated with the
-- existing `notifications` and `audit_log` primitives.
--
-- Design notes:
--   * Tasks own actionable work with deadlines. Annotations capture facts
--     that may or may not require work — confirmations, observations, gaps,
--     callouts, ad-hoc tags. An annotation can spawn a task via
--     `linked_task_id`.
--   * Threading uses self-referential `parent_id`. Replies inherit the
--     parent's `target_table` / `target_id` for entity scoping.
--   * INSERT auto-fires notifications to the assignee + watchers; resolution
--     also notifies the creator. Status transitions to `acknowledged` are
--     silent — they exist to take a flag off the active queue without
--     resolving it.
--   * Audit-log integration mirrors the standard target_table/target_id
--     pattern so cross-entity timelines stay coherent.
-- ============================================================================

-- ── Enums ──────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'annotation_kind') then
    create type annotation_kind as enum ('flag', 'note', 'comment', 'tag');
  end if;
  if not exists (select 1 from pg_type where typname = 'annotation_severity') then
    create type annotation_severity as enum ('info', 'warning', 'critical');
  end if;
  if not exists (select 1 from pg_type where typname = 'annotation_status') then
    create type annotation_status as enum ('open', 'acknowledged', 'resolved', 'dismissed');
  end if;
end $$;

-- ── annotations ────────────────────────────────────────────────────────────
create table if not exists annotations (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references orgs(id) on delete cascade,
  project_id            uuid references projects(id) on delete cascade,
  target_table          text not null,
  target_id             uuid not null,
  parent_id             uuid references annotations(id) on delete cascade,
  kind                  annotation_kind not null default 'flag',
  severity              annotation_severity not null default 'info',
  status                annotation_status not null default 'open',
  title                 text,
  body                  text not null,
  tags                  text[] not null default '{}',
  confirmation_required boolean not null default false,
  confirmed_by          uuid references users(id) on delete set null,
  confirmed_at          timestamptz,
  due_at                date,
  assigned_to           uuid references users(id) on delete set null,
  linked_task_id        uuid references tasks(id) on delete set null,
  metadata              jsonb not null default '{}'::jsonb,
  created_by            uuid references users(id) on delete set null,
  resolved_by           uuid references users(id) on delete set null,
  resolved_at           timestamptz,
  resolution_note       text,
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint annotations_resolution_consistency check (
    (status in ('resolved', 'dismissed') and resolved_at is not null)
    or (status not in ('resolved', 'dismissed') and resolved_at is null)
  ),
  constraint annotations_confirmation_consistency check (
    (confirmation_required = false)
    or (confirmation_required = true and (confirmed_at is null or confirmed_by is not null))
  )
);

create index if not exists annotations_org_status_idx
  on annotations (org_id, status) where deleted_at is null;
create index if not exists annotations_project_status_idx
  on annotations (project_id, status) where deleted_at is null and project_id is not null;
create index if not exists annotations_target_idx
  on annotations (target_table, target_id) where deleted_at is null;
create index if not exists annotations_assigned_open_idx
  on annotations (assigned_to, status) where deleted_at is null and assigned_to is not null;
create index if not exists annotations_parent_idx
  on annotations (parent_id) where parent_id is not null;
create index if not exists annotations_tags_idx
  on annotations using gin (tags);

-- Mirror the standard updated_at trigger
drop trigger if exists annotations_touch_updated_at on annotations;
create trigger annotations_touch_updated_at
  before update on annotations
  for each row execute function touch_updated_at();

-- ── annotation_watchers ────────────────────────────────────────────────────
-- Users who get notified on changes to a given annotation.
create table if not exists annotation_watchers (
  annotation_id uuid not null references annotations(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (annotation_id, user_id)
);

create index if not exists annotation_watchers_user_idx
  on annotation_watchers (user_id);

-- ── Notification + audit triggers ──────────────────────────────────────────
-- AFTER INSERT — notify assignee, watchers, and parent watchers (for replies).
-- AFTER UPDATE — notify creator on resolve; notify new assignee on reassign.
-- All triggers also write to audit_log so cross-entity timelines stay coherent.

create or replace function annotations_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid;
  v_user  uuid;
  v_href  text;
  v_title text;
  v_body  text;
  v_root  uuid;
begin
  v_actor := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  v_root  := coalesce(new.parent_id, new.id);
  v_href  := '/console/annotations/' || v_root::text;

  if tg_op = 'INSERT' then
    if new.parent_id is not null then
      v_title := 'New reply on a flag';
      v_body  := left(new.body, 240);
    elsif new.confirmation_required then
      v_title := upper(new.severity::text) || ': confirmation required';
      v_body  := coalesce(new.title, left(new.body, 240));
    else
      v_title := initcap(new.kind::text) || ' — ' || upper(new.severity::text);
      v_body  := coalesce(new.title, left(new.body, 240));
    end if;

    -- Notify assignee (if set and not the actor)
    if new.assigned_to is not null and new.assigned_to is distinct from v_actor then
      insert into notifications (org_id, user_id, title, body, href)
      values (new.org_id, new.assigned_to, v_title, v_body, v_href);
    end if;

    -- Notify watchers of this annotation OR its parent (for replies)
    for v_user in
      select distinct w.user_id
        from annotation_watchers w
       where w.annotation_id in (new.id, new.parent_id)
         and w.user_id is distinct from v_actor
         and w.user_id is distinct from coalesce(new.assigned_to, '00000000-0000-0000-0000-000000000000'::uuid)
    loop
      insert into notifications (org_id, user_id, title, body, href)
      values (new.org_id, v_user, v_title, v_body, v_href);
    end loop;

    -- Auto-watch the creator (so reply notifications land in their inbox)
    if new.created_by is not null then
      insert into annotation_watchers (annotation_id, user_id)
      values (coalesce(new.parent_id, new.id), new.created_by)
      on conflict do nothing;
    end if;

    -- Audit
    insert into audit_log (org_id, actor_id, action, target_table, target_id, metadata)
    values (new.org_id, v_actor, 'annotation.created', 'annotations', new.id,
      jsonb_build_object(
        'kind', new.kind, 'severity', new.severity,
        'target_table', new.target_table, 'target_id', new.target_id,
        'parent_id', new.parent_id
      ));
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Resolve / dismiss → notify creator (if not the actor)
    if old.status not in ('resolved', 'dismissed')
       and new.status in ('resolved', 'dismissed')
       and new.created_by is not null
       and new.created_by is distinct from v_actor then
      insert into notifications (org_id, user_id, title, body, href)
      values (new.org_id, new.created_by,
        'Flag ' || new.status::text,
        coalesce(new.resolution_note, coalesce(new.title, left(new.body, 240))),
        v_href);
    end if;

    -- Reassignment → notify new assignee
    if new.assigned_to is not null
       and old.assigned_to is distinct from new.assigned_to
       and new.assigned_to is distinct from v_actor then
      insert into notifications (org_id, user_id, title, body, href)
      values (new.org_id, new.assigned_to,
        'Flag assigned to you',
        coalesce(new.title, left(new.body, 240)),
        v_href);
    end if;

    -- Audit any state change worth tracking
    if old.status is distinct from new.status
       or old.assigned_to is distinct from new.assigned_to
       or old.confirmed_at is distinct from new.confirmed_at then
      insert into audit_log (org_id, actor_id, action, target_table, target_id, metadata)
      values (new.org_id, v_actor, 'annotation.updated', 'annotations', new.id,
        jsonb_build_object(
          'old_status', old.status, 'new_status', new.status,
          'old_assignee', old.assigned_to, 'new_assignee', new.assigned_to,
          'confirmed_at', new.confirmed_at
        ));
    end if;
    return new;
  end if;

  return new;
end $$;

drop trigger if exists annotations_notify_trg on annotations;
create trigger annotations_notify_trg
  after insert or update on annotations
  for each row execute function annotations_notify();

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table annotations enable row level security;
alter table annotation_watchers enable row level security;

drop policy if exists annotations_select on annotations;
create policy annotations_select on annotations
  for select to authenticated
  using (is_org_member(org_id) and deleted_at is null);

drop policy if exists annotations_insert on annotations;
create policy annotations_insert on annotations
  for insert to authenticated
  with check (is_org_member(org_id));

drop policy if exists annotations_update on annotations;
create policy annotations_update on annotations
  for update to authenticated
  using (
    is_org_member(org_id) and (
      created_by = auth.uid()
      or assigned_to = auth.uid()
      or has_org_role(org_id, array['owner','admin','controller','collaborator'])
    )
  )
  with check (is_org_member(org_id));

-- Soft-delete only — no DELETE policy. Use update set deleted_at = now().

drop policy if exists annotation_watchers_select on annotation_watchers;
create policy annotation_watchers_select on annotation_watchers
  for select to authenticated
  using (
    exists (select 1 from annotations a
             where a.id = annotation_watchers.annotation_id
               and is_org_member(a.org_id))
  );

drop policy if exists annotation_watchers_insert on annotation_watchers;
create policy annotation_watchers_insert on annotation_watchers
  for insert to authenticated
  with check (
    exists (select 1 from annotations a
             where a.id = annotation_watchers.annotation_id
               and is_org_member(a.org_id))
  );

drop policy if exists annotation_watchers_delete on annotation_watchers;
create policy annotation_watchers_delete on annotation_watchers
  for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from annotations a
                where a.id = annotation_watchers.annotation_id
                  and has_org_role(a.org_id, array['owner','admin']))
  );

-- ── Grants ─────────────────────────────────────────────────────────────────
grant select, insert, update on annotations to authenticated;
grant select, insert, delete on annotation_watchers to authenticated;

-- ── Helper SQL function — used by seeds and scripted backfills ────────────
-- Returns the new annotation id. Caller is responsible for setting the
-- session JWT claim if they need actor attribution.
create or replace function create_annotation(
  p_org_id     uuid,
  p_project_id uuid,
  p_target_table text,
  p_target_id  uuid,
  p_kind       annotation_kind,
  p_severity   annotation_severity,
  p_title      text,
  p_body       text,
  p_tags       text[] default '{}',
  p_assigned_to uuid default null,
  p_due_at     date default null,
  p_confirmation_required boolean default false,
  p_created_by uuid default null
) returns uuid language plpgsql as $$
declare
  v_id uuid;
begin
  insert into annotations (
    org_id, project_id, target_table, target_id, kind, severity,
    title, body, tags, assigned_to, due_at, confirmation_required, created_by
  ) values (
    p_org_id, p_project_id, p_target_table, p_target_id, p_kind, p_severity,
    p_title, p_body, p_tags, p_assigned_to, p_due_at, p_confirmation_required, p_created_by
  )
  returning id into v_id;
  return v_id;
end $$;

-- ============================================================================
-- Verification (informational)
-- ============================================================================
-- Expected after apply:
--   * Tables: annotations, annotation_watchers (RLS enabled).
--   * Enums: annotation_kind, annotation_severity, annotation_status.
--   * Indexes: 6 on annotations + 1 on annotation_watchers.
--   * Triggers: annotations_touch_updated_at, annotations_notify_trg.
--   * Function: create_annotation(...) helper.
-- ============================================================================
