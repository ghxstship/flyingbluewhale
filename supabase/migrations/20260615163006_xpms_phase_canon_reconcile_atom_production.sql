-- Reconcile xpms_atom_phase + production_phase to the canonical XPMS production
-- lifecycle (Discovery → Design → Advance → Procurement → Build → Install →
-- Operate → Close), matching the project macro-phase enum (xpms_phase).
-- Existing rows are remapped positionally/semantically.

-- ── xpms_atom_phase ──────────────────────────────────────────────────────
drop view if exists public.v_xpms_atom_rollup_recursive;
drop view if exists public.v_xpms_atom_rollup;

alter type public.xpms_atom_phase rename to xpms_atom_phase_old;
create type public.xpms_atom_phase as enum
  ('discovery','design','advance','procurement','build','install','operate','close');

alter table public.xpms_atoms alter column phase drop default;
alter table public.xpms_atoms alter column phase type public.xpms_atom_phase using (
  case phase::text
    when 'discovery' then 'discovery'
    when 'concept' then 'design'
    when 'development' then 'advance'
    when 'advance' then 'procurement'
    when 'build' then 'build'
    when 'show' then 'install'
    when 'strike' then 'operate'
    when 'wrap' then 'close'
    else 'discovery'
  end::public.xpms_atom_phase);
alter table public.xpms_atoms alter column phase set default 'discovery';
drop type public.xpms_atom_phase_old;

create view public.v_xpms_atom_rollup as
 SELECT id, org_id, project_id, identifier, name, phase, state, wbs_path,
    nlevel(wbs_path) AS wbs_depth,
    COALESCE(cost_cents, 0::bigint) AS budget_cents,
    COALESCE((SELECT sum(e.amount_cents)::bigint FROM expenses e WHERE e.atom_id = a.id), 0::bigint) AS actual_cost_cents,
    COALESCE((SELECT sum(li.quantity * li.unit_price_cents::numeric)::bigint FROM po_line_items li WHERE li.atom_id = a.id), 0::bigint) AS committed_cents,
    COALESCE((SELECT sum(ii.quantity * ii.unit_price_cents::numeric)::bigint FROM invoice_line_items ii WHERE ii.atom_id = a.id), 0::bigint) AS invoiced_cents,
    COALESCE((SELECT sum(v.cost_delta_cents)::bigint FROM xpms_variance_ledger v WHERE v.tpc_atom_id = a.id), 0::bigint) AS variance_cost_cents,
    (SELECT count(*)::integer FROM xpms_variance_ledger v WHERE v.tpc_atom_id = a.id) AS variance_count,
    (SELECT count(*)::integer FROM tasks t WHERE t.xpms_atom_id = a.id) AS task_count,
    (SELECT count(*)::integer FROM tasks t WHERE t.xpms_atom_id = a.id AND t.task_state = 'done'::task_status) AS tasks_done,
    (SELECT count(*)::integer FROM deliverables d WHERE d.atom_id = a.id AND d.deleted_at IS NULL) AS deliverable_count,
    (SELECT count(*)::integer FROM deliverables d WHERE d.atom_id = a.id AND d.deleted_at IS NULL AND (d.fulfillment_state = ANY (ARRAY['approved'::fulfillment_state, 'delivered'::fulfillment_state]))) AS deliverables_approved,
    (SELECT count(*)::integer FROM deliverables d WHERE d.atom_id = a.id AND d.deleted_at IS NULL AND (d.fulfillment_state = ANY (ARRAY['briefed'::fulfillment_state, 'draft'::fulfillment_state, 'submitted'::fulfillment_state, 'in_review'::fulfillment_state, 'revision_requested'::fulfillment_state]))) AS deliverables_open,
    CASE WHEN ((SELECT count(*) FROM tasks t WHERE t.xpms_atom_id = a.id)) = 0 THEN NULL::numeric
         ELSE ((SELECT count(*) FROM tasks t WHERE t.xpms_atom_id = a.id AND t.task_state = 'done'::task_status))::numeric / NULLIF((SELECT count(*) FROM tasks t WHERE t.xpms_atom_id = a.id), 0)::numeric END AS pct_complete
   FROM xpms_atoms a;

create view public.v_xpms_atom_rollup_recursive as
 SELECT parent.id AS atom_id, parent.org_id, parent.project_id, parent.identifier, parent.name, parent.phase, parent.state, parent.wbs_path, parent.wbs_depth,
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
    CASE WHEN sum(child.budget_cents) > 0::numeric THEN sum(COALESCE(child.pct_complete, 0::numeric) * child.budget_cents::numeric) / NULLIF(sum(child.budget_cents), 0::numeric)
         WHEN sum(child.task_count) > 0 THEN sum(child.tasks_done)::numeric / NULLIF(sum(child.task_count), 0)::numeric
         ELSE NULL::numeric END AS pct_complete_rollup
   FROM v_xpms_atom_rollup parent
     JOIN v_xpms_atom_rollup child ON child.wbs_path <@ parent.wbs_path AND child.org_id = parent.org_id
  GROUP BY parent.id, parent.org_id, parent.project_id, parent.identifier, parent.name, parent.phase, parent.state, parent.wbs_path, parent.wbs_depth;

-- ── production_phase ─────────────────────────────────────────────────────
alter type public.production_phase rename to production_phase_old;
create type public.production_phase as enum
  ('DISCOVERY','DESIGN','ADVANCE','PROCUREMENT','BUILD','INSTALL','OPERATE','CLOSE');

alter table public.fabrication_orders alter column production_phase drop default;
alter table public.fabrication_orders alter column production_phase type public.production_phase using (
  case production_phase::text
    when 'DISCOVERY' then 'DISCOVERY' when 'CONCEPT' then 'DESIGN' when 'ENGINEERING' then 'ADVANCE'
    when 'PRE_PRO' then 'PROCUREMENT' when 'FAB' then 'BUILD' when 'LOGISTICS' then 'INSTALL'
    when 'INSTALL' then 'INSTALL' when 'STRIKE' then 'OPERATE' when 'ARCHIVED' then 'CLOSE'
    else 'DISCOVERY' end::public.production_phase);
alter table public.fabrication_orders alter column production_phase set default 'DISCOVERY';

alter table public.production_phase_transitions alter column from_phase type public.production_phase using (
  case from_phase::text
    when 'DISCOVERY' then 'DISCOVERY' when 'CONCEPT' then 'DESIGN' when 'ENGINEERING' then 'ADVANCE'
    when 'PRE_PRO' then 'PROCUREMENT' when 'FAB' then 'BUILD' when 'LOGISTICS' then 'INSTALL'
    when 'INSTALL' then 'INSTALL' when 'STRIKE' then 'OPERATE' when 'ARCHIVED' then 'CLOSE'
    else null end::public.production_phase);
alter table public.production_phase_transitions alter column to_phase type public.production_phase using (
  case to_phase::text
    when 'DISCOVERY' then 'DISCOVERY' when 'CONCEPT' then 'DESIGN' when 'ENGINEERING' then 'ADVANCE'
    when 'PRE_PRO' then 'PROCUREMENT' when 'FAB' then 'BUILD' when 'LOGISTICS' then 'INSTALL'
    when 'INSTALL' then 'INSTALL' when 'STRIKE' then 'OPERATE' when 'ARCHIVED' then 'CLOSE'
    else 'DISCOVERY' end::public.production_phase);
drop type public.production_phase_old;
