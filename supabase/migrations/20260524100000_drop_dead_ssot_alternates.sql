-- R24.1, R24.2, R25.1, R27.1 — drop the parallel-schema SSOT alternates
-- identified in reports/3NF_SSOT_FK_AUDIT_2026-05-24.md. All target rows
-- verified as junk/seed via direct inspection. App refs grepped to zero.

BEGIN;

-- ── R24.1: tasks_v2 ecosystem (9 smoke/E2E rows, all deps empty) ─────────
DROP TABLE IF EXISTS public.task_dependencies CASCADE;
DROP TABLE IF EXISTS public.task_status_history CASCADE;
DROP TABLE IF EXISTS public.task_recurring_definitions CASCADE;
DROP TABLE IF EXISTS public.task_assignments CASCADE;
DROP TABLE IF EXISTS public.corrective_actions CASCADE;
DROP TABLE IF EXISTS public.tasks_v2 CASCADE;

-- ── R24.2: form_definitions ecosystem (all empty) ────────────────────────
DROP TABLE IF EXISTS public.ufs_form_submissions CASCADE;
DROP TABLE IF EXISTS public.form_field_options CASCADE;
DROP TABLE IF EXISTS public.form_fields CASCADE;
DROP TABLE IF EXISTS public.form_drafts CASCADE;
DROP TABLE IF EXISTS public.form_definitions CASCADE;

-- ── R25.1: knowledge_articles ecosystem ──────────────────────────────────
DROP TABLE IF EXISTS public.knowledge_revisions CASCADE;
DROP TABLE IF EXISTS public.knowledge_subscribers CASCADE;
DROP TABLE IF EXISTS public.knowledge_relations CASCADE;
DROP TABLE IF EXISTS public.knowledge_articles CASCADE;
DROP TABLE IF EXISTS public.knowledge_collections CASCADE;
ALTER TABLE public.post_mortems DROP COLUMN IF EXISTS ukb_article_id;

-- ── R27.1: drop deliverables.status — but first sync drift + repoint deps ─
UPDATE public.deliverables SET status = deliverable_state WHERE status IS DISTINCT FROM deliverable_state;

DROP VIEW IF EXISTS public.v_xpms_atom_rollup_recursive CASCADE;
DROP VIEW IF EXISTS public.v_xpms_atom_rollup CASCADE;
DROP POLICY IF EXISTS deliverables_update_consolidated ON public.deliverables;

ALTER TABLE public.deliverables DROP COLUMN status;

CREATE POLICY deliverables_update_consolidated ON public.deliverables FOR UPDATE
USING (
  private.has_org_role(org_id, ARRAY['owner','admin','controller','collaborator'])
  OR (submitted_by = (SELECT auth.uid()) AND deliverable_state = ANY (ARRAY['draft'::deliverable_state, 'revision_requested'::deliverable_state]))
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
  (SELECT count(*)::integer FROM deliverables d WHERE d.atom_id = a.id AND d.deleted_at IS NULL AND d.deliverable_state = ANY (ARRAY['approved'::deliverable_state, 'delivered'::deliverable_state])) AS deliverables_approved,
  (SELECT count(*)::integer FROM deliverables d WHERE d.atom_id = a.id AND d.deleted_at IS NULL AND d.deliverable_state = ANY (ARRAY['briefed'::deliverable_state, 'draft'::deliverable_state, 'submitted'::deliverable_state, 'in_review'::deliverable_state, 'revision_requested'::deliverable_state])) AS deliverables_open,
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

COMMIT;
