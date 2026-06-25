-- SECURITY: least-privilege on SECURITY DEFINER functions + dangling grants.
--
-- 1. Cross-tenant-writable RPCs (compute_risk_scores_for_org,
--    generate_wip_snapshot_for_project): both are SECURITY DEFINER, take an
--    arbitrary org/project id, and write to that tenant's risk_scores /
--    wip_snapshots with NO internal membership check. They were EXECUTE-able by
--    PUBLIC (=> anon), so any logged-out caller could fabricate/recompute
--    another org's risk + WIP financials. Fix: revoke from PUBLIC + anon, and
--    add a private.is_org_member()/membership guard so even an authenticated
--    user can only target their own org. App callers pass session.orgId /
--    own-org projects, so legit use is unaffected.
--
-- 2. Trigger functions (snapshot_deliverable_on_submit, tg_community_post_*,
--    compvss_set_updated_at): only ever fired by triggers; never a callable
--    API surface. EXECUTE was granted to PUBLIC. Revoke from PUBLIC/anon/
--    authenticated (triggers run as table owner regardless).
--
-- 3. compvss_set_updated_at also had a role-mutable search_path — pin it.
--
-- 4. push_send_failures / webhook_events carry inert anon/authenticated table
--    grants (RLS-enabled, no policy => deny-all, service-role only). Revoke the
--    dangling grants for least privilege.
--
-- Token-gated public RPCs (get/accept/decline_offer_letter, *_msa,
-- record_*_view, redeem_guide_access_code, consume_proposal_share_link) keep
-- their anon EXECUTE: the token+code IS the authorization and the anon
-- marketing client is the legitimate caller. They are intentional/verified.

-- ── 1. Cross-tenant RPCs: add membership guard + tighten EXECUTE ─────────────
CREATE OR REPLACE FUNCTION public.compute_risk_scores_for_org(org uuid)
 RETURNS TABLE(project_id uuid, category risk_category, score numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_project RECORD;
  v_now timestamptz := now();
BEGIN
  IF org IS NULL THEN RAISE EXCEPTION 'org required'; END IF;
  -- Tenant guard: only a member of the target org may compute its scores.
  -- service_role bypasses RLS but private.is_org_member returns false for it;
  -- the platform action that calls this runs as the authenticated member.
  IF NOT private.is_org_member(org) THEN
    RAISE EXCEPTION 'not authorized for org %', org USING ERRCODE = '42501';
  END IF;

  FOR v_project IN
    SELECT p.id FROM public.projects p
    WHERE p.org_id = org AND p.deleted_at IS NULL
  LOOP
    DECLARE
      v_sched numeric := 0;
      v_total_acts int := 0;
      v_tight_acts int := 0;
    BEGIN
      SELECT COUNT(*), COUNT(*) FILTER (WHERE COALESCE(a.total_float_days, 0) <= 2)
      INTO v_total_acts, v_tight_acts
      FROM public.schedule_baselines b
      JOIN public.schedule_activities a ON a.baseline_id = b.id
      WHERE b.project_id = v_project.id
        AND b.baseline_state = 'active'
        AND b.deleted_at IS NULL;
      v_sched := CASE WHEN v_total_acts > 0 THEN v_tight_acts::numeric / v_total_acts ELSE 0 END;

      INSERT INTO public.risk_scores (org_id, project_id, scored_at, category, score, severity, drivers, model_version)
      VALUES (
        org, v_project.id, v_now, 'schedule',
        (v_sched * 100)::numeric(5,2),
        CASE WHEN v_sched >= 0.8 THEN 'critical' WHEN v_sched >= 0.55 THEN 'high' WHEN v_sched >= 0.3 THEN 'moderate' ELSE 'low' END,
        jsonb_build_object('tight_activities', v_tight_acts, 'total_activities', v_total_acts),
        'rules_v1'
      ) ON CONFLICT (project_id, category, scored_at) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    DECLARE
      v_inc_count int := 0;
      v_safety_score numeric := 0;
    BEGIN
      SELECT COUNT(*) INTO v_inc_count
      FROM public.incidents i
      WHERE i.project_id = v_project.id
        AND i.created_at >= v_now - INTERVAL '30 days';
      v_safety_score := LEAST(1.0, v_inc_count / 10.0);

      INSERT INTO public.risk_scores (org_id, project_id, scored_at, category, score, severity, drivers, model_version)
      VALUES (
        org, v_project.id, v_now, 'safety',
        (v_safety_score * 100)::numeric(5,2),
        CASE WHEN v_safety_score >= 0.8 THEN 'critical' WHEN v_safety_score >= 0.55 THEN 'high' WHEN v_safety_score >= 0.3 THEN 'moderate' ELSE 'low' END,
        jsonb_build_object('incidents_30d', v_inc_count),
        'rules_v1'
      ) ON CONFLICT (project_id, category, scored_at) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    DECLARE
      v_cf numeric := 0;
      v_ou numeric := 0;
      v_rev numeric := 0;
    BEGIN
      SELECT w.over_under_billed, w.revised_contract_amount
      INTO v_ou, v_rev
      FROM public.wip_snapshots w
      WHERE w.project_id = v_project.id
      ORDER BY w.snapshot_date DESC
      LIMIT 1;
      IF v_rev > 0 THEN
        v_cf := LEAST(1.0, ABS(v_ou) / v_rev * 4);
      END IF;

      INSERT INTO public.risk_scores (org_id, project_id, scored_at, category, score, severity, drivers, model_version)
      VALUES (
        org, v_project.id, v_now, 'cash_flow',
        (v_cf * 100)::numeric(5,2),
        CASE WHEN v_cf >= 0.8 THEN 'critical' WHEN v_cf >= 0.55 THEN 'high' WHEN v_cf >= 0.3 THEN 'moderate' ELSE 'low' END,
        jsonb_build_object('over_under_billed', v_ou, 'revised_contract', v_rev),
        'rules_v1'
      ) ON CONFLICT (project_id, category, scored_at) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;

  RETURN QUERY
  SELECT rs.project_id, rs.category, rs.score
  FROM public.risk_scores rs
  WHERE rs.org_id = org AND rs.scored_at = v_now;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_wip_snapshot_for_project(p_project_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_org_id uuid;
  v_today date := current_date;
  v_contract numeric := 0;
  v_approved_co numeric := 0;
  v_revised numeric := 0;
  v_costs_to_date numeric := 0;
  v_etc numeric := 0;
  v_eac numeric := 0;
  v_pct numeric := 0;
  v_earned numeric := 0;
  v_billed numeric := 0;
  v_id uuid;
BEGIN
  SELECT org_id INTO v_org_id FROM public.projects WHERE id = p_project_id;
  IF v_org_id IS NULL THEN RAISE EXCEPTION 'project not found'; END IF;
  -- Tenant guard: caller must belong to the project's org.
  IF NOT private.is_org_member(v_org_id) THEN
    RAISE EXCEPTION 'not authorized for project %', p_project_id USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(SUM(po.subtotal_cents), 0) / 100.0
  INTO v_contract
  FROM public.purchase_orders po
  WHERE po.project_id = p_project_id
    AND po.deleted_at IS NULL;

  SELECT COALESCE(SUM(co.amount_cents), 0) / 100.0
  INTO v_approved_co
  FROM public.po_change_orders co
  WHERE co.purchase_order_id IN (
    SELECT id FROM public.purchase_orders WHERE project_id = p_project_id AND deleted_at IS NULL
  )
  AND co.state = 'approved';

  v_revised := v_contract + v_approved_co;

  SELECT COALESCE(SUM(i.amount_cents), 0) / 100.0
  INTO v_costs_to_date
  FROM public.invoices i
  WHERE i.project_id = p_project_id AND i.invoice_state IN ('paid','approved');

  SELECT COALESCE(SUM(cfl.forecast_to_complete), 0)
  INTO v_etc
  FROM public.cost_forecast_lines cfl
  JOIN public.cost_forecasts cf ON cf.id = cfl.cost_forecast_id
  WHERE cf.project_id = p_project_id AND cf.deleted_at IS NULL
  ORDER BY cf.forecast_at DESC LIMIT 1;

  IF v_etc IS NULL OR v_etc = 0 THEN
    v_etc := GREATEST(v_revised - v_costs_to_date, 0);
  END IF;

  v_eac := v_costs_to_date + v_etc;
  v_pct := CASE WHEN v_eac > 0 THEN LEAST((v_costs_to_date / v_eac) * 100, 100) ELSE 0 END;
  v_earned := (v_pct / 100.0) * v_revised;

  SELECT COALESCE(SUM(pa.total_due_cents + pa.total_previously_paid_cents), 0) / 100.0
  INTO v_billed
  FROM public.payment_applications pa
  WHERE pa.project_id = p_project_id;

  INSERT INTO public.wip_snapshots (
    org_id, project_id, snapshot_date, contract_amount, approved_change_orders,
    revised_contract_amount, costs_to_date, estimated_cost_to_complete,
    estimated_at_completion, percent_complete, earned_revenue, billed_to_date,
    over_under_billed, generated_at
  ) VALUES (
    v_org_id, p_project_id, v_today, v_contract, v_approved_co,
    v_revised, v_costs_to_date, v_etc, v_eac, v_pct, v_earned, v_billed,
    v_earned - v_billed, now()
  )
  ON CONFLICT (project_id, snapshot_date) DO UPDATE SET
    contract_amount = EXCLUDED.contract_amount,
    approved_change_orders = EXCLUDED.approved_change_orders,
    revised_contract_amount = EXCLUDED.revised_contract_amount,
    costs_to_date = EXCLUDED.costs_to_date,
    estimated_cost_to_complete = EXCLUDED.estimated_cost_to_complete,
    estimated_at_completion = EXCLUDED.estimated_at_completion,
    percent_complete = EXCLUDED.percent_complete,
    earned_revenue = EXCLUDED.earned_revenue,
    billed_to_date = EXCLUDED.billed_to_date,
    over_under_billed = EXCLUDED.over_under_billed,
    generated_at = EXCLUDED.generated_at
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.compute_risk_scores_for_org(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_wip_snapshot_for_project(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.compute_risk_scores_for_org(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_wip_snapshot_for_project(uuid) TO authenticated, service_role;

-- ── 2 + 3. Trigger functions: pin search_path + revoke broad EXECUTE ─────────
ALTER FUNCTION public.compvss_set_updated_at() SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.compvss_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.snapshot_deliverable_on_submit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_community_post_comment_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_community_post_like_count() FROM PUBLIC, anon, authenticated;

-- ── 4. Drop inert anon/authenticated grants on deny-all service-role tables ──
REVOKE ALL ON public.push_send_failures FROM anon, authenticated;
REVOKE ALL ON public.webhook_events FROM anon, authenticated;
