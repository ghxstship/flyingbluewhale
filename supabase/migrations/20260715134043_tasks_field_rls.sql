-- tasks RLS — let the field create and finish its own work.
--
-- Two defects, one root: the tasks policies were written for the console's
-- authoring model (manager band writes, everyone reads) and never
-- reconciled with what the app actually offers a crew member.
--
--   1. INSERT excluded the `member` band entirely, so a crew member could
--      not create a task at all. Anything spotted on site had to survive
--      until someone reached a desk — which is how it stops being recorded.
--      COMPVSS shipped no create surface, so nothing surfaced the block;
--      /m/tasks/new (Phase 2) hits it immediately.
--
--   2. UPDATE excluded `member` too — while the app explicitly permits the
--      ASSIGNEE to transition state:
--        src/app/(mobile)/m/tasks/[taskId]/actions.ts:44
--          if (!isManagerPlus(session) && !isAssignee) return ...
--      So the moment a manager assigns a task to a member, the member's UI
--      offers "Mark Done" and the database refuses it. Latent today only
--      because no member-band user currently has a task assigned.
--
-- The grants below are deliberately narrow. A member may:
--   • create a task ONLY as themselves, assigned to themselves;
--   • update a task ONLY while it remains assigned to them.
-- The WITH CHECK clauses mean a member cannot hand a task to someone else,
-- take someone else's, or create work in another person's name. Anything
-- broader stays with the manager band, unchanged.

-- ── INSERT ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tasks_insert" ON "public"."tasks";

CREATE POLICY "tasks_insert" ON "public"."tasks"
  FOR INSERT
  WITH CHECK (
    -- The console's authoring band, unchanged.
    "private"."has_org_role"("org_id", ARRAY['owner', 'admin', 'manager', 'controller', 'collaborator'])
    OR (
      -- Field self-tasking: my org, my name, my task.
      "private"."is_org_member"("org_id")
      AND "created_by" = ( SELECT "auth"."uid"() )
      AND "assigned_to" = ( SELECT "auth"."uid"() )
    )
  );

-- ── UPDATE ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tasks_update" ON "public"."tasks";

CREATE POLICY "tasks_update" ON "public"."tasks"
  FOR UPDATE
  USING (
    "private"."has_org_role"("org_id", ARRAY['owner', 'admin', 'manager', 'controller', 'collaborator'])
    OR (
      -- The assignee can work their own task — mirrors the app's
      -- `isManagerPlus(session) || row.assigned_to === session.userId`.
      "private"."is_org_member"("org_id")
      AND "assigned_to" = ( SELECT "auth"."uid"() )
    )
  )
  WITH CHECK (
    "private"."has_org_role"("org_id", ARRAY['owner', 'admin', 'manager', 'controller', 'collaborator'])
    OR (
      -- Still mine afterwards: a member cannot reassign a task away from
      -- themselves, nor move it to another org.
      "private"."is_org_member"("org_id")
      AND "assigned_to" = ( SELECT "auth"."uid"() )
    )
  );
