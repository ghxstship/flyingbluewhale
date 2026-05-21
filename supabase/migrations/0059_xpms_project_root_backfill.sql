-- 0059_xpms_project_root_backfill.sql
--
-- Two-part follow-on to 0058 (xpms_wbs_rollup):
--
--   1. Update v_xpms_atom_rollup to read `deliverable_state` (the
--      canonical column added by 0049). Falls back to legacy `status`
--      column when state is NULL. 0058 read `status`, which under-
--      counted approvals on rows authored by the modern advancing
--      flows (which only set deliverable_state and leave status='draft'
--      default).
--
--   2. Idempotent backfill: for each project that already has at least
--      one xpms_atom, pin all orphan tasks (xpms_atom_id IS NULL) and
--      orphan deliverables (atom_id IS NULL) to the project's first
--      existing atom (ordered by created_at). Projects with zero atoms
--      stay empty in the tracker — that's the correct state, since
--      they have no WBS yet.
--
-- This intentionally does NOT create new "PROJECT-ROOT" atoms — going
-- down that path requires extending the canonical xtc_codes /
-- xtc_sections lookup chain with sentinel rows, which would pollute
-- the catalog. Operators pin orphans via the AtomPicker UI instead.

-- ─── 1. Update v_xpms_atom_rollup to use deliverable_state ───────────────

CREATE OR REPLACE VIEW public.v_xpms_atom_rollup
  WITH (security_invoker = true) AS
SELECT
  a.id, a.org_id, a.project_id, a.identifier, a.name, a.phase, a.state,
  a.wbs_path, nlevel(a.wbs_path) AS wbs_depth,
  coalesce(a.cost_cents, 0)::bigint AS budget_cents,
  coalesce((SELECT sum(e.amount_cents)::bigint FROM public.expenses e WHERE e.atom_id = a.id), 0) AS actual_cost_cents,
  coalesce((SELECT sum(li.quantity * li.unit_price_cents)::bigint FROM public.po_line_items li WHERE li.atom_id = a.id), 0) AS committed_cents,
  coalesce((SELECT sum(ii.quantity * ii.unit_price_cents)::bigint FROM public.invoice_line_items ii WHERE ii.atom_id = a.id), 0) AS invoiced_cents,
  coalesce((SELECT sum(v.cost_delta_cents)::bigint FROM public.xpms_variance_ledger v WHERE v.tpc_atom_id = a.id), 0) AS variance_cost_cents,
  (SELECT count(*)::int FROM public.xpms_variance_ledger v WHERE v.tpc_atom_id = a.id) AS variance_count,
  (SELECT count(*)::int FROM public.tasks t WHERE t.xpms_atom_id = a.id) AS task_count,
  (SELECT count(*)::int FROM public.tasks t WHERE t.xpms_atom_id = a.id AND t.status = 'done') AS tasks_done,
  (SELECT count(*)::int FROM public.deliverables d WHERE d.atom_id = a.id AND d.deleted_at IS NULL) AS deliverable_count,
  -- "Complete" = deliverable_state IN (approved, delivered). Legacy rows
  -- with state NULL fall back to status = 'approved'.
  (SELECT count(*)::int FROM public.deliverables d
     WHERE d.atom_id = a.id AND d.deleted_at IS NULL
       AND (
         (d.deliverable_state IS NOT NULL AND d.deliverable_state IN ('approved','delivered'))
         OR (d.deliverable_state IS NULL AND d.status = 'approved')
       )
  ) AS deliverables_approved,
  -- "Open" = anything not terminal (rejected, approved, delivered).
  (SELECT count(*)::int FROM public.deliverables d
     WHERE d.atom_id = a.id AND d.deleted_at IS NULL
       AND (
         (d.deliverable_state IS NOT NULL
           AND d.deliverable_state IN ('briefed','draft','submitted','in_review','revision_requested'))
         OR (d.deliverable_state IS NULL
           AND d.status IN ('draft','submitted','in_review','revision_requested'))
       )
  ) AS deliverables_open,
  CASE
    WHEN (SELECT count(*) FROM public.tasks t WHERE t.xpms_atom_id = a.id) = 0 THEN NULL
    ELSE (SELECT count(*) FROM public.tasks t WHERE t.xpms_atom_id = a.id AND t.status = 'done')::numeric
       / NULLIF((SELECT count(*) FROM public.tasks t WHERE t.xpms_atom_id = a.id), 0)::numeric
  END AS pct_complete
FROM public.xpms_atoms a;

-- ─── 2. Orphan-to-existing-atom backfill ───────────────────────────────

DO $$
DECLARE
  proj RECORD;
  fallback_atom_id uuid;
BEGIN
  FOR proj IN
    SELECT DISTINCT p.id, p.org_id
    FROM public.projects p
    WHERE p.deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM public.xpms_atoms a WHERE a.project_id = p.id)
      AND (
        EXISTS (SELECT 1 FROM public.tasks t        WHERE t.project_id = p.id AND t.xpms_atom_id IS NULL)
        OR EXISTS (SELECT 1 FROM public.deliverables d
                    WHERE d.project_id = p.id AND d.atom_id IS NULL AND d.deleted_at IS NULL)
      )
  LOOP
    -- Prefer an atom tagged with 'root' or 'backfill' if one exists;
    -- otherwise the oldest atom in the project.
    SELECT id INTO fallback_atom_id
    FROM public.xpms_atoms
    WHERE project_id = proj.id
    ORDER BY
      (CASE WHEN 'root'     = ANY(tags) THEN 0 ELSE 2 END),
      (CASE WHEN 'backfill' = ANY(tags) THEN 1 ELSE 2 END),
      created_at ASC
    LIMIT 1;

    UPDATE public.tasks SET xpms_atom_id = fallback_atom_id
      WHERE project_id = proj.id AND xpms_atom_id IS NULL;

    UPDATE public.deliverables SET atom_id = fallback_atom_id
      WHERE project_id = proj.id AND atom_id IS NULL AND deleted_at IS NULL;
  END LOOP;
END $$;
