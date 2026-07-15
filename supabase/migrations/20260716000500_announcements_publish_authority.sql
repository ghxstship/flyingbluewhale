-- Announcements: "Only manager+ can publish announcements" was a string, not a rule.
-- (ADR-0008 Amendment 7, part 3 — handoff from the volunteer/media backfill session.)
--
-- ## Why the Amendment 7 sweep missed this
--
-- Amendment 7 enumerated tables where the APP asserts an identity boundary — 253
-- `.eq("user_id", session.userId)`-class filters across 65 tables — and asked
-- whether RLS agreed. `announcements` was never a candidate: the app does NOT
-- narrow it by identity, because org-wide reads are the documented design
-- (Amendment 1). A table whose READS are deliberately wide, but whose WRITES
-- carry authority, is invisible to that method. The sweep looked for broken
-- promises and this table never made one.
--
-- The live invariant missed it too, and that is the more useful half:
--
--     select count(*) from pg_policies
--      where cmd='ALL' and with_check is null and qual is not null;   -- 0
--
-- `announcements_org_rw` is FOR ALL with a WITH CHECK **present** — it is just
-- `is_org_member(org_id)`, identical to its USING. Same outcome as the chat
-- self-join, different mechanism: not an inherited write check, but a write
-- check that is no stricter than the read check. A `with_check IS NULL` audit
-- cannot see it. The real predicate is **"is the write check stronger than the
-- read check on a table where writing is an authority act?"**
--
-- ## The defect
--
-- Confirmed live as crew@gvteway.test (`member` role / `crew` persona) over
-- PostgREST, and reported independently by the backfill session against a
-- `vendor`-persona contractor in a different org:
--
--   · INSERT `publish_state='published'`, `project_id=NULL` — an **org-wide
--     broadcast to the entire company, authored by a member-band account**.
--     Succeeded.
--   · DELETE an announcement they did not author — **hard** delete, row gone.
--     Succeeded.
--
-- Every app writer disagrees, in literal user-facing copy:
--
--   new/actions.ts       if (!isManagerPlus(session)) return { error: "Only manager+ can publish announcements" }
--   [id]/edit/actions.ts if (!isManagerPlus(session)) return { error: "Only manager+ can edit announcements" }
--   [id]/actions.ts      if (!isManagerPlus(session)) return;   // delete + archive
--
-- This is the time-off shape exactly. `decideTimeOffRequest` carried the comment
-- "Re-checked here rather than trusted from the caller so neither shell can skip
-- the gate by hiding a button" — true of both shells, and irrelevant to a
-- PostgREST call. A string in an action is not a boundary.
--
-- Portal personas are ordinary `memberships` rows, so `is_org_member` includes
-- `contractor`, `client`, `guest` and `viewer`: an external counterparty could
-- broadcast to the whole company. `/m/feed` and `/p/[slug]/announcements` only
-- ever READ; no shell has ever offered these personas a compose box. The DB did.
--
-- ## The fix
--
-- Reads are UNCHANGED — org-wide `is_org_member` is the documented model
-- (Amendment 1), and narrowing it would break the crew/vendor/volunteer/media
-- feeds this table exists to serve. Only the write side moves, to the band the
-- app already claims:
--
--   SELECT  is_org_member(org_id)                       — unchanged
--   INSERT  owner|admin|manager                         — matches isManagerPlus
--   UPDATE  owner|admin|manager                         — edit, archive, and the
--                                                         soft delete all UPDATE
--   DELETE  owner|admin                                 — see below
--
-- DELETE is the admin band, deliberately narrower than the app's own gate:
-- `deleteAnnouncement` is a **soft** delete (`update ... set deleted_at`), so no
-- app path hard-deletes an announcement, ever. The hard DELETE that destroyed a
-- row in the probe is a capability the product does not use. Left as a latent
-- admin capability rather than dropped outright — the same disposition
-- `chat_rooms` DELETE got in Amendment 5 part 2, and for the same reason:
-- destroying a company-wide communication and its read receipts should not be
-- reachable from a surface that only ever meant to hide it.

drop policy if exists announcements_org_rw on public.announcements;

-- The feed is for everyone in the org. That is the point of the table, and is
-- the one part of it Amendment 1 got right.
create policy announcements_select on public.announcements
  for select using (private.is_org_member(org_id));

create policy announcements_insert on public.announcements
  for insert with check (private.has_org_role(org_id, array['owner', 'admin', 'manager']));

-- Both USING and WITH CHECK, explicitly: USING picks which rows you may touch,
-- WITH CHECK pins the result, so a manager cannot move an announcement into
-- another org on the way out.
create policy announcements_update on public.announcements
  for update using (private.has_org_role(org_id, array['owner', 'admin', 'manager']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager']));

create policy announcements_delete on public.announcements
  for delete using (private.has_org_role(org_id, array['owner', 'admin']));
