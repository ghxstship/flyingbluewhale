-- ============================================================================
-- Annotations — extend notify trigger to fan out @-mentions
-- ============================================================================
-- Phase 2.1 of the SmartSuite parity roadmap (Conversations + Mentions).
-- Per https://help.smartsuite.com/en/articles/4752876-mentions, when a comment
-- contains an @-mention the named user receives an inbox notification with a
-- direct link back to the record. We piggyback the existing
-- `annotations_notify()` trigger so mentions are delivered atomically with the
-- assignee + watcher fan-out (one transaction, one source of truth).
--
-- Wire:
--   * The `comments` server action parses mentions on the client side, resolves
--     handles to user ids, and writes the resolved set into the new annotation's
--     `metadata.mentions` JSONB array. Shape per element:
--       { "kind": "user", "id": "<uuid>", "handle": "alice" }
--       { "kind": "team", "id": null,     "handle": "prod"  }
--   * On INSERT this trigger reads `metadata->'mentions'`, iterates the
--     `kind = 'user'` entries, and inserts a `notifications` row with
--     `kind = 'mention.comment'` so the /me/notifications/inbox "Mentioned"
--     tab (filter `kind LIKE 'mention.%'`) picks them up.
--   * Team mentions are no-op'd today — Teams arrive in Phase 5. We swallow
--     them gracefully so the same comment payload works once Teams ship.
--
-- This migration is a CREATE OR REPLACE on `annotations_notify()` only — the
-- trigger binding itself (`annotations_notify_trg`) is untouched. Existing
-- assignee + watcher + creator-on-resolve fan-outs are preserved verbatim.
-- Idempotent — safe to re-apply.
-- ============================================================================

create or replace function annotations_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor    uuid;
  v_user     uuid;
  v_href     text;
  v_title    text;
  v_body     text;
  v_root     uuid;
  v_mention  jsonb;
  v_mention_user uuid;
  v_creator_name text;
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

    -- ── @-Mention fan-out ─────────────────────────────────────────────────
    -- Read parsed mentions from metadata. Shape: jsonb array of objects with
    -- { kind, id, handle }. Skip silently if absent / malformed.
    if jsonb_typeof(new.metadata -> 'mentions') = 'array' then
      -- Look up creator's display name for the notification title.
      select coalesce(u.name, split_part(u.email, '@', 1), 'Someone')
        into v_creator_name
        from users u
       where u.id = new.created_by;
      v_creator_name := coalesce(v_creator_name, 'Someone');

      for v_mention in
        select * from jsonb_array_elements(new.metadata -> 'mentions')
      loop
        -- Team mentions: deferred to Phase 5 — no-op for now.
        if (v_mention ->> 'kind') is distinct from 'user' then
          continue;
        end if;
        begin
          v_mention_user := (v_mention ->> 'id')::uuid;
        exception when others then
          continue;
        end;
        if v_mention_user is null then continue; end if;
        -- Skip self-mentions and dedupe with assignee (assignee already got
        -- a notification above).
        if v_mention_user is not distinct from v_actor then continue; end if;
        if v_mention_user is not distinct from new.assigned_to then continue; end if;

        insert into notifications (org_id, user_id, kind, title, body, href)
        values (
          new.org_id,
          v_mention_user,
          'mention.comment',
          v_creator_name || ' mentioned you in a ' || new.kind::text,
          left(coalesce(new.title, new.body), 240),
          v_href
        );
      end loop;
    end if;

    -- Audit
    insert into audit_log (org_id, actor_id, action, target_table, target_id, metadata)
    values (new.org_id, v_actor, 'annotation.created', 'annotations', new.id,
      jsonb_build_object(
        'kind', new.kind, 'severity', new.severity,
        'target_table', new.target_table, 'target_id', new.target_id,
        'parent_id', new.parent_id,
        'mentions', coalesce(new.metadata -> 'mentions', '[]'::jsonb)
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

-- ============================================================================
-- Verification (informational)
-- ============================================================================
-- Expected after apply:
--   * `annotations_notify()` reads `metadata.mentions`, fans out
--     `kind = 'mention.comment'` notifications for each user mention.
--   * Existing assignee, watcher, creator-on-resolve, and reassign behaviors
--     are unchanged.
--   * Team mentions (`kind = 'team'`) are silently ignored until Phase 5.
-- ============================================================================
