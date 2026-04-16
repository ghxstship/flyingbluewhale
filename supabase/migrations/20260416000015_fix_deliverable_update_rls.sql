-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 015: Fix deliverable update policy
--
-- Bug: The "Submitters can update own drafts" policy used
-- USING clause which in PostgreSQL also applies as WITH CHECK.
-- When a submitter changes status from 'draft' to 'submitted',
-- the WITH CHECK evaluates against the NEW row where
-- status='submitted', causing it to fail.
--
-- Fix: Split into USING (which rows can be selected for update)
-- and WITH CHECK (what the new row can look like).
-- ═══════════════════════════════════════════════════════

drop policy if exists "Submitters can update own drafts" on deliverables;

-- Submitters can update their own deliverables that are currently in draft
-- The WITH CHECK allows any valid status (they can submit their draft)
create policy "Submitters can update own deliverables"
  on deliverables for update
  using (
    -- Row filter: can update own drafts, or internal can update anything
    (submitted_by = auth.uid() and status = 'draft')
    or is_internal_on_project(project_id)
    -- Also allow org admins
    or exists(
      select 1 from projects p
      join organization_members om on om.organization_id = p.organization_id
      where p.id = deliverables.project_id
        and om.user_id = auth.uid()
        and om.role in ('developer', 'owner', 'admin')
    )
  )
  with check (
    -- New row check: submitters can set any valid status on their own deliverables
    submitted_by = auth.uid()
    or is_internal_on_project(project_id)
    or exists(
      select 1 from projects p
      join organization_members om on om.organization_id = p.organization_id
      where p.id = deliverables.project_id
        and om.user_id = auth.uid()
        and om.role in ('developer', 'owner', 'admin')
    )
  );
