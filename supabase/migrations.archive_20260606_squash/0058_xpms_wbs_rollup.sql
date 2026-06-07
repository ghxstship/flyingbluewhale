-- 0058_xpms_wbs_rollup.sql
--
-- XPMS Tracker — WBS hierarchy + rollup views.
--
-- Wires the construction-PM rollup pattern onto the existing XPMS canon:
--
--   1. `xpms_atoms.wbs_path` (ltree, generated) — materializes the
--      WBS path implicit in the token columns
--      (org.event.venue.zone.seq.revision). Indexed GiST for fast
--      `<@` (descendant) lookups.
--
--   2. `deliverables.atom_id` — closes the last artifact gap. Every
--      other artifact (tasks, expenses, po_line_items,
--      invoice_line_items, equipment, rentals, fabrication_orders,
--      crew_members, time_entries) already FKs into xpms_atoms;
--      deliverables didn't. Now they do.
--
--   3. `v_xpms_atom_rollup` — per-atom rollup, no fan-out (scalar
--      subqueries). Counts tasks, deliverables, variance entries and
--      sums budget / actual / committed / invoiced.
--
--   4. `v_xpms_atom_rollup_recursive` — same projection but aggregated
--      across all descendants via `wbs_path <@ parent.wbs_path`.
--      Used by the tracker tree at /console/projects/[id]/tracker.
--
-- Both views are `security_invoker=true` so the underlying table RLS
-- (xpms_atoms.is_org_member, tasks RLS, expenses RLS, etc.) is the
-- actual authorization boundary. No view-level grant relaxes that.

-- Required extension. ltree is shipped with Postgres core; this is a
-- no-op if already enabled.
CREATE EXTENSION IF NOT EXISTS ltree;

-- ─── 1. Materialize the WBS path ────────────────────────────────────────
--
-- The path is composed from the existing token columns. `_` is used
-- for null intermediate tokens so every atom has a uniform-depth path
-- (level == WBS depth), which keeps the tracker tree renderer simple.
-- regexp_replace strips anything ltree won't accept (it only allows
-- [A-Za-z0-9_]).

-- `concat_ws` is STABLE (variadic any), which Postgres rejects for
-- generated columns — switch to `||` so the expression is IMMUTABLE.
ALTER TABLE public.xpms_atoms
  ADD COLUMN IF NOT EXISTS wbs_path ltree
  GENERATED ALWAYS AS (
    text2ltree(
      regexp_replace(
             regexp_replace(org_token,                       '[^A-Za-z0-9_]', '_', 'g')
      || '.' || regexp_replace(coalesce(event_token, '_'),   '[^A-Za-z0-9_]', '_', 'g')
      || '.' || regexp_replace(coalesce(venue_token, '_'),   '[^A-Za-z0-9_]', '_', 'g')
      || '.' || regexp_replace(coalesce(zone_token, '_'),    '[^A-Za-z0-9_]', '_', 'g')
      || '.' || sequence_no::text
      || '.' || regexp_replace(revision,                     '[^A-Za-z0-9_]', '_', 'g'),
        '\.+', '.', 'g'
      )
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS xpms_atoms_wbs_path_gist_idx
  ON public.xpms_atoms USING gist (wbs_path);

CREATE INDEX IF NOT EXISTS xpms_atoms_project_id_idx
  ON public.xpms_atoms (project_id)
  WHERE project_id IS NOT NULL;

-- ─── 2. Close the deliverables artifact gap ─────────────────────────────

ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS atom_id uuid
  REFERENCES public.xpms_atoms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS deliverables_atom_id_idx
  ON public.deliverables (atom_id)
  WHERE atom_id IS NOT NULL;

COMMENT ON COLUMN public.deliverables.atom_id IS
  'Canonical XPMS atom this deliverable pins to. NULL = unpinned (legacy or org-scope deliverable).';

-- ─── 3. Per-atom rollup view ────────────────────────────────────────────
--
-- Scalar subqueries (rather than LEFT JOIN + GROUP BY) so fan-out
-- across artifact tables can't double-count. Each subquery hits the
-- atom_id index on its target table.

CREATE OR REPLACE VIEW public.v_xpms_atom_rollup
  WITH (security_invoker = true) AS
SELECT
  a.id,
  a.org_id,
  a.project_id,
  a.identifier,
  a.name,
  a.phase,
  a.state,
  a.wbs_path,
  nlevel(a.wbs_path) AS wbs_depth,
  coalesce(a.cost_cents, 0)::bigint                              AS budget_cents,
  coalesce((
    SELECT sum(e.amount_cents)::bigint
    FROM public.expenses e
    WHERE e.atom_id = a.id
  ), 0)                                                          AS actual_cost_cents,
  coalesce((
    SELECT sum(li.quantity * li.unit_price_cents)::bigint
    FROM public.po_line_items li
    WHERE li.atom_id = a.id
  ), 0)                                                          AS committed_cents,
  coalesce((
    SELECT sum(ii.quantity * ii.unit_price_cents)::bigint
    FROM public.invoice_line_items ii
    WHERE ii.atom_id = a.id
  ), 0)                                                          AS invoiced_cents,
  coalesce((
    SELECT sum(v.cost_delta_cents)::bigint
    FROM public.xpms_variance_ledger v
    WHERE v.tpc_atom_id = a.id
  ), 0)                                                          AS variance_cost_cents,
  (
    SELECT count(*)::int FROM public.xpms_variance_ledger v
    WHERE v.tpc_atom_id = a.id
  )                                                              AS variance_count,
  (
    SELECT count(*)::int FROM public.tasks t
    WHERE t.xpms_atom_id = a.id
  )                                                              AS task_count,
  (
    SELECT count(*)::int FROM public.tasks t
    WHERE t.xpms_atom_id = a.id AND t.status = 'done'
  )                                                              AS tasks_done,
  (
    SELECT count(*)::int FROM public.deliverables d
    WHERE d.atom_id = a.id AND d.deleted_at IS NULL
  )                                                              AS deliverable_count,
  (
    SELECT count(*)::int FROM public.deliverables d
    WHERE d.atom_id = a.id
      AND d.deleted_at IS NULL
      AND d.status = 'approved'
  )                                                              AS deliverables_approved,
  (
    SELECT count(*)::int FROM public.deliverables d
    WHERE d.atom_id = a.id
      AND d.deleted_at IS NULL
      AND d.status IN ('draft', 'submitted', 'in_review', 'revision_requested')
  )                                                              AS deliverables_open,
  CASE
    WHEN (SELECT count(*) FROM public.tasks t WHERE t.xpms_atom_id = a.id) = 0
      THEN NULL
    ELSE
      (SELECT count(*) FROM public.tasks t WHERE t.xpms_atom_id = a.id AND t.status = 'done')::numeric
      / NULLIF((SELECT count(*) FROM public.tasks t WHERE t.xpms_atom_id = a.id), 0)::numeric
  END                                                            AS pct_complete
FROM public.xpms_atoms a;

COMMENT ON VIEW public.v_xpms_atom_rollup IS
  'Per-atom rollup. Joins to artifact tables via scalar subqueries to avoid fan-out. Used as the input to v_xpms_atom_rollup_recursive.';

-- ─── 4. Recursive (WBS-tree) rollup ─────────────────────────────────────
--
-- For each atom (parent), aggregate every descendant (child.wbs_path
-- <@ parent.wbs_path, which includes the parent itself). Budget-
-- weighted % complete is the EVM BCWP/BCWS analog. Falls back to
-- task-count ratio when no children have a budget.

CREATE OR REPLACE VIEW public.v_xpms_atom_rollup_recursive
  WITH (security_invoker = true) AS
SELECT
  parent.id           AS atom_id,
  parent.org_id,
  parent.project_id,
  parent.identifier,
  parent.name,
  parent.phase,
  parent.state,
  parent.wbs_path,
  parent.wbs_depth,
  sum(child.budget_cents)::bigint            AS budget_cents_rollup,
  sum(child.actual_cost_cents)::bigint       AS actual_cost_cents_rollup,
  sum(child.committed_cents)::bigint         AS committed_cents_rollup,
  sum(child.invoiced_cents)::bigint          AS invoiced_cents_rollup,
  sum(child.variance_cost_cents)::bigint     AS variance_cost_cents_rollup,
  sum(child.variance_count)::int             AS variance_count_rollup,
  sum(child.task_count)::int                 AS task_count_rollup,
  sum(child.tasks_done)::int                 AS tasks_done_rollup,
  sum(child.deliverable_count)::int          AS deliverable_count_rollup,
  sum(child.deliverables_approved)::int      AS deliverables_approved_rollup,
  sum(child.deliverables_open)::int          AS deliverables_open_rollup,
  count(child.id)::int                       AS descendant_count,
  CASE
    -- Budget-weighted (EVM-style) when budgets exist on descendants.
    WHEN sum(child.budget_cents) > 0
      THEN
        sum(coalesce(child.pct_complete, 0) * child.budget_cents)::numeric
        / NULLIF(sum(child.budget_cents), 0)::numeric
    -- Fallback: aggregate task-count ratio.
    WHEN sum(child.task_count) > 0
      THEN sum(child.tasks_done)::numeric / NULLIF(sum(child.task_count), 0)::numeric
    ELSE NULL
  END                                        AS pct_complete_rollup
FROM public.v_xpms_atom_rollup parent
JOIN public.v_xpms_atom_rollup child
  ON child.wbs_path <@ parent.wbs_path
 AND child.org_id   = parent.org_id
GROUP BY
  parent.id, parent.org_id, parent.project_id, parent.identifier,
  parent.name, parent.phase, parent.state, parent.wbs_path, parent.wbs_depth;

COMMENT ON VIEW public.v_xpms_atom_rollup_recursive IS
  'WBS-tree rollup. Each row = an atom with totals across its entire descendant subtree. Powers /console/projects/[id]/tracker.';

-- Grants — views inherit row visibility from security_invoker, but we
-- still need column-level SELECT for authenticated. Anon stays out.
GRANT SELECT ON public.v_xpms_atom_rollup            TO authenticated;
GRANT SELECT ON public.v_xpms_atom_rollup_recursive  TO authenticated;
