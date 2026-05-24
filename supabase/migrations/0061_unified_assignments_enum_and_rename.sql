-- Unified Assignment Domain — Step 1/7
-- Lifecycle enum extension + canonical rename, catalog kind extension.
--
-- The `deliverable_state` enum is renamed to `fulfillment_state` because the
-- same lifecycle now drives both project-document deliverables (riders,
-- plots, lists) and per-individual assignments (tickets, credentials,
-- lodging, travel, vehicles, uniforms, catering, radios, tools, equipment).
-- Six new terminal values cover the physical-asset + ticket cases that
-- documents don't have: issued, transferred, redeemed, expired, voided,
-- returned. LDP-canonical: `*_state` because the lifecycle is cyclical
-- (a credential can be reissued; a ticket can be re-printed).
--
-- Also adds 'ticket' to catalog_kind so master_catalog_items becomes the
-- SSOT for every assignable thing in the system.

-- ============================================================
-- 1. Extend catalog_kind with 'ticket'
-- ============================================================

DO $$ BEGIN ALTER TYPE public.catalog_kind ADD VALUE IF NOT EXISTS 'ticket'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. Extend deliverable_state with assignment-lifecycle values
-- ============================================================

DO $$ BEGIN ALTER TYPE public.deliverable_state ADD VALUE IF NOT EXISTS 'issued'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.deliverable_state ADD VALUE IF NOT EXISTS 'transferred'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.deliverable_state ADD VALUE IF NOT EXISTS 'redeemed'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.deliverable_state ADD VALUE IF NOT EXISTS 'expired'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.deliverable_state ADD VALUE IF NOT EXISTS 'voided'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.deliverable_state ADD VALUE IF NOT EXISTS 'returned'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 3. Rename enum + column to fulfillment_state
-- ============================================================
-- View + policy depend on the type via OID, so the rename is transparent
-- to them — but we recreate both with the new name to keep pg_views/policy
-- bodies grep-clean. Drop dependents first because RENAME on a referenced
-- type is OK but the explicit ::deliverable_state casts in their bodies
-- would still reference the old name in pg_get_viewdef output.

DROP VIEW IF EXISTS public.v_xpms_atom_rollup_recursive;
DROP VIEW IF EXISTS public.v_xpms_atom_rollup;
DROP POLICY IF EXISTS deliverables_update_consolidated ON public.deliverables;

ALTER TYPE public.deliverable_state RENAME TO fulfillment_state;
ALTER TABLE public.deliverables RENAME COLUMN deliverable_state TO fulfillment_state;

-- ============================================================
-- 4. Recreate dependent view + policy with the new names
-- ============================================================

CREATE POLICY deliverables_update_consolidated ON public.deliverables FOR UPDATE
USING (
  private.has_org_role(org_id, ARRAY['owner','admin','controller','collaborator'])
  OR (submitted_by = (SELECT auth.uid()) AND fulfillment_state = ANY (ARRAY['draft'::fulfillment_state, 'revision_requested'::fulfillment_state]))
)
WITH CHECK (
  private.has_org_role(org_id, ARRAY['owner','admin','controller','collaborator'])
  OR submitted_by = (SELECT auth.uid())
);

CREATE VIEW public.v_xpms_atom_rollup AS
SELECT
  a.id, a.org_id, a.project_id, a.identifier, a.name, a.phase, a.state, a.wbs_path,
  nlevel(a.wbs_path) AS wbs_depth,
  COALESCE(a.cost_cents, 0::bigint) AS budget_cents,
  COALESCE((SELECT sum(e.amount_cents)::bigint FROM expenses e WHERE e.atom_id = a.id), 0::bigint) AS actual_cost_cents,
  COALESCE((SELECT sum(li.quantity * li.unit_price_cents::numeric)::bigint FROM po_line_items li WHERE li.atom_id = a.id), 0::bigint) AS committed_cents,
  COALESCE((SELECT sum(ii.quantity * ii.unit_price_cents::numeric)::bigint FROM invoice_line_items ii WHERE ii.atom_id = a.id), 0::bigint) AS invoiced_cents,
  COALESCE((SELECT sum(v.cost_delta_cents)::bigint FROM xpms_variance_ledger v WHERE v.tpc_atom_id = a.id), 0::bigint) AS variance_cost_cents,
  (SELECT count(*)::integer FROM xpms_variance_ledger v WHERE v.tpc_atom_id = a.id) AS variance_count,
  (SELECT count(*)::integer FROM tasks t WHERE t.xpms_atom_id = a.id) AS task_count,
  (SELECT count(*)::integer FROM tasks t WHERE t.xpms_atom_id = a.id AND t.status = 'done'::task_status) AS tasks_done,
  (SELECT count(*)::integer FROM deliverables d WHERE d.atom_id = a.id AND d.deleted_at IS NULL) AS deliverable_count,
  (SELECT count(*)::integer FROM deliverables d WHERE d.atom_id = a.id AND d.deleted_at IS NULL AND d.fulfillment_state = ANY (ARRAY['approved'::fulfillment_state, 'delivered'::fulfillment_state])) AS deliverables_approved,
  (SELECT count(*)::integer FROM deliverables d WHERE d.atom_id = a.id AND d.deleted_at IS NULL AND d.fulfillment_state = ANY (ARRAY['briefed'::fulfillment_state, 'draft'::fulfillment_state, 'submitted'::fulfillment_state, 'in_review'::fulfillment_state, 'revision_requested'::fulfillment_state])) AS deliverables_open,
  CASE
    WHEN (SELECT count(*) FROM tasks t WHERE t.xpms_atom_id = a.id) = 0 THEN NULL::numeric
    ELSE (SELECT count(*) FROM tasks t WHERE t.xpms_atom_id = a.id AND t.status = 'done'::task_status)::numeric / NULLIF((SELECT count(*) FROM tasks t WHERE t.xpms_atom_id = a.id), 0)::numeric
  END AS pct_complete
FROM xpms_atoms a;

CREATE VIEW public.v_xpms_atom_rollup_recursive AS
SELECT
  parent.id AS atom_id,
  parent.org_id, parent.project_id, parent.identifier, parent.name, parent.phase, parent.state, parent.wbs_path, parent.wbs_depth,
  sum(child.budget_cents)::bigint AS budget_cents_rollup,
  sum(child.actual_cost_cents)::bigint AS actual_cost_cents_rollup,
  sum(child.committed_cents)::bigint AS committed_cents_rollup,
  sum(child.invoiced_cents)::bigint AS invoiced_cents_rollup,
  sum(child.variance_cost_cents)::bigint AS variance_cost_cents_rollup,
  sum(child.variance_count)::integer AS variance_count_rollup,
  sum(child.task_count)::integer AS task_count_rollup,
  sum(child.tasks_done)::integer AS tasks_done_rollup,
  sum(child.deliverable_count)::integer AS deliverable_count_rollup,
  sum(child.deliverables_approved)::integer AS deliverables_approved_rollup,
  sum(child.deliverables_open)::integer AS deliverables_open_rollup,
  count(child.id)::integer AS descendant_count,
  CASE
    WHEN sum(child.budget_cents) > 0::numeric THEN sum(COALESCE(child.pct_complete, 0::numeric) * child.budget_cents::numeric) / NULLIF(sum(child.budget_cents), 0::numeric)
    WHEN sum(child.task_count) > 0 THEN sum(child.tasks_done)::numeric / NULLIF(sum(child.task_count), 0)::numeric
    ELSE NULL::numeric
  END AS pct_complete_rollup
FROM v_xpms_atom_rollup parent
JOIN v_xpms_atom_rollup child ON child.wbs_path <@ parent.wbs_path AND child.org_id = parent.org_id
GROUP BY parent.id, parent.org_id, parent.project_id, parent.identifier, parent.name, parent.phase, parent.state, parent.wbs_path, parent.wbs_depth;

COMMENT ON TYPE public.fulfillment_state IS
  'Canonical lifecycle for both project-document deliverables AND per-individual assignments (tickets, credentials, lodging, travel, vehicles, uniforms, catering, radios, tools, equipment). LDP _state — cyclical (reissuable, reprintable). Renamed from deliverable_state in migration 0061.';
