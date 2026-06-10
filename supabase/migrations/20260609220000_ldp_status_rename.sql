-- LDP status-column rename program — Phase 6.
-- Authoritative map: docs/LDP_STATUS_RENAME_MAP.md
--
-- §1  69 column renames: every bare `status` on a base table becomes an
--     LDP-conformant `*_state` (or table-specific) column.
-- §2  plpgsql function bodies patched (sources do not auto-update on rename).
--     Table-aware replacements only — never global.
-- §3  Dual-write sync triggers + functions dropped (their canonical twin
--     columns are live and fully populated).
-- §4  RLS policies on the drop tables recreated against the twin columns.
-- §5  Dependent views (public_job_board, public_open_calls) recreated against
--     the twin columns. Neither view ever exposed a `status` output column,
--     so no alias is needed for public consumers.
-- §6  The 6 redundant `status` columns dropped.
-- §7  Partial/covering indexes that lived on the dropped columns recreated
--     (same names) against the twin columns.

-- ============================================================================
-- §1 — Renames
-- ============================================================================

alter table public.accreditation_changes        rename column status to change_state;
alter table public.ad_manifests                 rename column status to manifest_state;
alter table public.annotations                  rename column status to annotation_state;
alter table public.automation_runs              rename column status to run_state;
alter table public.automation_step_runs         rename column status to step_state;
alter table public.campaigns                    rename column status to campaign_state;
alter table public.contract_envelope_signers    rename column status to signer_state;
alter table public.cues                         rename column status to cue_state;
alter table public.daily_logs                   rename column status to log_state;
alter table public.delegation_entries           rename column status to entry_state;
alter table public.dispatch_runs                rename column status to run_state;
alter table public.dsar_requests                rename column status to request_state;
alter table public.equipment                    rename column status to equipment_state;
alter table public.events                       rename column status to event_state;
alter table public.expenses                     rename column status to expense_state;
alter table public.export_runs                  rename column status to run_state;
alter table public.form_defs                    rename column status to form_state;
alter table public.governance_policies          rename column status to policy_state;
alter table public.guard_tours                  rename column status to tour_state;
alter table public.import_runs                  rename column status to run_state;
alter table public.incidents                    rename column status to incident_state;
alter table public.inspections                  rename column status to inspection_state;
alter table public.invites                      rename column status to invite_state;
alter table public.invoice_reminders            rename column status to reminder_state;
alter table public.invoices                     rename column status to invoice_state;
alter table public.itil_changes                 rename column status to change_state;
alter table public.itil_problems                rename column status to problem_state;
alter table public.major_incidents              rename column status to incident_state;
alter table public.notification_deliveries     rename column status to delivery_state;
alter table public.notification_templates       rename column status to template_state;
alter table public.offer_letters                rename column status to letter_state;
alter table public.org_integrations             rename column status to integration_state;
alter table public.payment_applications         rename column status to application_state;
alter table public.playbooks                    rename column status to playbook_state;
alter table public.po_change_orders             rename column status to change_order_state;
alter table public.po_checklist_items           rename column status to item_state;
alter table public.proposal_phase_states        rename column status to phase_state;
alter table public.proposals                    rename column status to proposal_state;
alter table public.punch_items                  rename column status to item_state;
alter table public.punch_lists                  rename column status to list_state;
alter table public.purchase_orders              rename column status to po_state;
alter table public.rate_card_orders             rename column status to order_state;
alter table public.regulatory_filing_records    rename column status to filing_state;
alter table public.report_runs                  rename column status to run_state;
alter table public.requisitions                 rename column status to requisition_state;
alter table public.rfis                         rename column status to rfi_state;
alter table public.rfqs                         rename column status to rfq_state;
alter table public.risks                        rename column status to risk_state;
alter table public.role_documents               rename column status to document_state;
alter table public.safeguarding_reports         rename column status to report_state;
alter table public.safety_briefings             rename column status to briefing_state;
alter table public.service_requests             rename column status to request_state;
alter table public.settlements                  rename column status to settlement_state;
alter table public.sponsor_entitlements         rename column status to entitlement_state;
alter table public.submittals                   rename column status to submittal_state;
alter table public.sync_runs                    rename column status to run_state;
alter table public.tasks                        rename column status to task_state;
alter table public.threats                      rename column status to threat_state;
alter table public.tours                        rename column status to tour_state;
alter table public.trademarks                   rename column status to trademark_state;
alter table public.vendor_prequalifications     rename column status to prequalification_state;
alter table public.venue_closeout_items         rename column status to item_state;
alter table public.venue_design_specs           rename column status to spec_state;
alter table public.venue_handover_items         rename column status to item_state;
alter table public.venue_vop_sections           rename column status to section_state;
alter table public.visa_cases                   rename column status to case_state;
alter table public.wizard_definitions           rename column status to definition_state;
alter table public.work_order_broadcast_invites rename column status to invite_state;
alter table public.work_order_broadcasts        rename column status to broadcast_state;

-- ============================================================================
-- §2 — Function body patches
-- ============================================================================

-- invites.status -> invite_state
CREATE OR REPLACE FUNCTION public.accept_invite(p_token text)
 RETURNS TABLE(out_org_id uuid, out_org_slug text, out_role platform_role, out_project_id uuid, out_project_role project_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_invite_id uuid;
  v_org_id uuid;
  v_org_slug text;
  v_role public.platform_role;
  v_invite_email text;
  v_project_id uuid;
  v_project_role public.project_role;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_token is null or length(p_token) < 8 then
    raise exception 'invalid_token' using errcode = '22023';
  end if;

  select email into v_user_email from auth.users where id = v_user_id;
  if v_user_email is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select i.id, i.org_id, i.role, lower(i.email), i.project_id, i.project_role
    into v_invite_id, v_org_id, v_role, v_invite_email, v_project_id, v_project_role
  from public.invites i
  where i.token = p_token
    and i.invite_state = 'pending'
    and i.expires_at > now()
  for update;

  if v_invite_id is null then
    raise exception 'invite_invalid_or_expired' using errcode = '02000';
  end if;

  if v_invite_email <> lower(v_user_email) then
    raise exception 'invite_email_mismatch' using errcode = '42501';
  end if;

  insert into public.memberships (org_id, user_id, role, persona)
  values (v_org_id, v_user_id, v_role, v_role::text)
  on conflict (org_id, user_id) do update
    set role = excluded.role,
        persona = excluded.persona,
        deleted_at = null,
        updated_at = now();

  if v_project_id is not null then
    insert into public.project_members (project_id, user_id, role)
    values (v_project_id, v_user_id, v_project_role)
    on conflict (project_id, user_id) do update
      set role = excluded.role,
          updated_at = now();
  end if;

  update public.invites
     set invite_state = 'accepted',
         accepted_at = now(),
         accepted_by = v_user_id
   where id = v_invite_id;

  begin
    insert into public.user_preferences (user_id, last_org_id)
    values (v_user_id, v_org_id)
    on conflict (user_id) do update set last_org_id = excluded.last_org_id;
  exception when undefined_table then
    null;
  end;

  select slug into v_org_slug from public.orgs where id = v_org_id;
  return query select v_org_id, v_org_slug, v_role, v_project_id, v_project_role;
end;
$function$;

-- offer_letters.status -> letter_state
CREATE OR REPLACE FUNCTION public.accept_offer_letter(p_token uuid, p_code text, p_signature text, p_ip inet, p_user_agent text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid; v_org_id uuid; v_status offer_letter_status; v_resolved jsonb;
begin
  select id, org_id, letter_state into v_id, v_org_id, v_status
    from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code) limit 1;
  if v_id is null then raise exception 'Invalid token or access code'; end if;
  if v_status in ('declined','withdrawn','expired') then
    raise exception 'Letter is no longer accepting signatures (status=%)', v_status;
  end if;
  if length(coalesce(p_signature,'')) < 2 then
    raise exception 'Signature is required';
  end if;

  update offer_letters
     set letter_state = 'accepted', accepted_at = now(),
         accepted_signature = p_signature, accepted_ip = p_ip,
         accepted_user_agent = p_user_agent
   where id = v_id;

  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary, meta)
    values (v_id, v_org_id, 'accepted', p_signature,
      'Letter accepted and counter-signed.',
      jsonb_build_object('ip', p_ip::text, 'user_agent', p_user_agent));

  select snapshot into v_resolved from offer_letters where id = v_id;
  return v_resolved;
end;
$function$;

-- offer_letters.status -> letter_state
CREATE OR REPLACE FUNCTION public.decline_offer_letter(p_token uuid, p_code text, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid; v_org_id uuid; v_status offer_letter_status; v_resolved jsonb;
begin
  select id, org_id, letter_state into v_id, v_org_id, v_status
    from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code) limit 1;
  if v_id is null then raise exception 'Invalid token or access code'; end if;
  if v_status in ('accepted','withdrawn','expired') then
    raise exception 'Letter cannot be declined (status=%)', v_status;
  end if;

  update offer_letters
     set letter_state = 'declined', declined_at = now(), decline_reason = p_reason
   where id = v_id;

  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary, meta)
    values (v_id, v_org_id, 'declined', 'Recipient',
      coalesce('Letter declined: ' || p_reason, 'Letter declined.'),
      jsonb_build_object('reason', p_reason));

  select snapshot into v_resolved from offer_letters where id = v_id;
  return v_resolved;
end;
$function$;

-- offer_letters.status -> letter_state. The jsonb output key stays 'status' —
-- it is the public API shape consumed by the offer-letter portal pages.
CREATE OR REPLACE FUNCTION public.get_offer_letter_by_token(p_token uuid, p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_letter offer_letters;
  v_resolved jsonb;
  v_lifecycle jsonb;
begin
  select * into v_letter from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code) limit 1;
  if v_letter.id is null then return null; end if;
  if v_letter.token_expires_at is not null and v_letter.token_expires_at < now() then return null; end if;
  if v_letter.letter_state = 'withdrawn' then return null; end if;

  -- Lifecycle fields are *always* live (never frozen) so accept/decline/view
  -- state reflects current reality even on a sent or accepted letter.
  v_lifecycle := jsonb_build_object(
    'status', v_letter.letter_state,
    'sent_at', v_letter.sent_at,
    'first_viewed_at', v_letter.first_viewed_at,
    'last_viewed_at', v_letter.last_viewed_at,
    'view_count', v_letter.view_count,
    'accepted_at', v_letter.accepted_at,
    'accepted_signature', v_letter.accepted_signature,
    'accepted_ip', v_letter.accepted_ip::text,
    'accepted_user_agent', v_letter.accepted_user_agent,
    'declined_at', v_letter.declined_at,
    'decline_reason', v_letter.decline_reason,
    'withdrawn_at', v_letter.withdrawn_at,
    'updated_at', v_letter.updated_at
  );

  if v_letter.snapshot is not null then
    -- Snapshot = frozen contract; lifecycle = live state. Merge so the
    -- snapshot's contract terms cannot drift but status accurately reflects
    -- view/accept/decline events that happened after the snapshot was taken.
    return v_letter.snapshot || v_lifecycle;
  end if;

  select to_jsonb(r.*) into v_resolved
    from offer_letters_resolved r where r.id = v_letter.id;
  return v_resolved;
end;
$function$;

-- offer_letters.status -> letter_state
CREATE OR REPLACE FUNCTION public.record_offer_letter_view(p_token uuid, p_code text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid; v_org_id uuid; v_first timestamptz;
begin
  select id, org_id, first_viewed_at into v_id, v_org_id, v_first
    from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code) limit 1;
  if v_id is null then return; end if;

  update offer_letters
     set last_viewed_at = now(),
         first_viewed_at = coalesce(first_viewed_at, now()),
         view_count = view_count + 1,
         letter_state = case when letter_state = 'sent' then 'viewed'::offer_letter_status else letter_state end
   where id = v_id;

  if v_first is null then
    insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary)
      values (v_id, v_org_id, 'viewed', 'Recipient', 'Letter opened for the first time.');
  end if;
end;
$function$;

-- offer_letters.status -> letter_state
CREATE OR REPLACE FUNCTION public.snapshot_offer_letter()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if (OLD.letter_state = 'draft' and NEW.letter_state <> 'draft') and NEW.snapshot is null then
    select to_jsonb(r.*) into NEW.snapshot
      from offer_letters_resolved r
      where r.id = NEW.id;
    NEW.snapshot_at := now();
  end if;
  return NEW;
end;
$function$;

-- annotations.status -> annotation_state. Audit-metadata jsonb keys
-- old_status/new_status are kept (consumed shape), values read the new column.
CREATE OR REPLACE FUNCTION public.annotations_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

    if new.assigned_to is not null and new.assigned_to is distinct from v_actor then
      insert into notifications (org_id, user_id, title, body, href)
      values (new.org_id, new.assigned_to, v_title, v_body, v_href);
    end if;

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

    if new.created_by is not null then
      insert into annotation_watchers (annotation_id, user_id)
      values (coalesce(new.parent_id, new.id), new.created_by)
      on conflict do nothing;
    end if;

    if jsonb_typeof(new.metadata -> 'mentions') = 'array' then
      select coalesce(u.name, split_part(u.email, '@', 1), 'Someone')
        into v_creator_name
        from users u
       where u.id = new.created_by;
      v_creator_name := coalesce(v_creator_name, 'Someone');

      for v_mention in
        select * from jsonb_array_elements(new.metadata -> 'mentions')
      loop
        if (v_mention ->> 'kind') is distinct from 'user' then continue; end if;
        begin
          v_mention_user := (v_mention ->> 'id')::uuid;
        exception when others then
          continue;
        end;
        if v_mention_user is null then continue; end if;
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
    if old.annotation_state not in ('resolved', 'dismissed')
       and new.annotation_state in ('resolved', 'dismissed')
       and new.created_by is not null
       and new.created_by is distinct from v_actor then
      insert into notifications (org_id, user_id, title, body, href)
      values (new.org_id, new.created_by,
        'Flag ' || new.annotation_state::text,
        coalesce(new.resolution_note, coalesce(new.title, left(new.body, 240))),
        v_href);
    end if;

    if new.assigned_to is not null
       and old.assigned_to is distinct from new.assigned_to
       and new.assigned_to is distinct from v_actor then
      insert into notifications (org_id, user_id, title, body, href)
      values (new.org_id, new.assigned_to,
        'Flag assigned to you',
        coalesce(new.title, left(new.body, 240)),
        v_href);
    end if;

    if old.annotation_state is distinct from new.annotation_state
       or old.assigned_to is distinct from new.assigned_to
       or old.confirmed_at is distinct from new.confirmed_at then
      insert into audit_log (org_id, actor_id, action, target_table, target_id, metadata)
      values (new.org_id, v_actor, 'annotation.updated', 'annotations', new.id,
        jsonb_build_object(
          'old_status', old.annotation_state, 'new_status', new.annotation_state,
          'old_assignee', old.assigned_to, 'new_assignee', new.assigned_to,
          'confirmed_at', new.confirmed_at
        ));
    end if;
    return new;
  end if;

  return new;
end $function$;

-- expenses.status -> expense_state
CREATE OR REPLACE FUNCTION private.budgets_recompute_actual(p_org_id uuid, p_project_id uuid, p_department text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  total_cents bigint;
begin
  if p_project_id is null or p_department is null then return; end if;

  select coalesce(sum(amount_cents), 0)
    into total_cents
    from public.expenses
   where org_id = p_org_id
     and project_id = p_project_id
     and department = p_department
     and expense_state in ('approved', 'reimbursed');

  update public.budgets
     set actual_cents = total_cents,
         spent_cents = total_cents
   where org_id = p_org_id
     and project_id = p_project_id
     and department = p_department;
end;
$function$;

-- expenses.status -> expense_state (dual-write twin is receipt_state)
CREATE OR REPLACE FUNCTION private.expenses_sync_receipt_state()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if tg_op = 'INSERT' then
    if new.receipt_state is null and new.expense_state is not null then
      new.receipt_state := new.expense_state;
    elsif new.expense_state is null and new.receipt_state is not null then
      new.expense_state := new.receipt_state;
    end if;
  elsif tg_op = 'UPDATE' then
    -- If only one of the two changed in this update, mirror the change
    -- to the other. If both changed, prefer receipt_state as the
    -- canonical (post-LDP) value.
    if new.receipt_state is distinct from old.receipt_state then
      new.expense_state := new.receipt_state;
    elsif new.expense_state is distinct from old.expense_state then
      new.receipt_state := new.expense_state;
    end if;
  end if;
  return new;
end;
$function$;

-- invoices.status -> invoice_state
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

  -- Contract value: sum of active PO totals on this project. Approximation
  -- because we don't have a "prime contract" first-class concept yet
  -- (Round 49 added construction-PM contracts but data hasn't migrated).
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

  -- Costs to date: invoices paid + expenses incurred.
  SELECT COALESCE(SUM(i.amount_cents), 0) / 100.0
  INTO v_costs_to_date
  FROM public.invoices i
  WHERE i.project_id = p_project_id AND i.invoice_state IN ('paid','approved');

  -- ETC: 30% of contract by default until we wire to forecasts.
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

-- projects.status was already gone (project_state is live) — this seed was a
-- latent runtime defect. Patched: projects -> project_state,
-- proposals.status -> proposal_state, proposal_phase_states.status -> phase_state.
CREATE OR REPLACE FUNCTION public.seed_cornbread_abbey_road(p_org_slug text DEFAULT 'demo'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_org_id uuid;
  v_owner_id uuid;
  v_project_id uuid;
  v_client_id uuid;
  v_proposal_id uuid;
  v_phase_id uuid;
  v_co_id uuid;
  v_round_id uuid;
begin
  select id into v_org_id from orgs where slug = p_org_slug limit 1;
  if v_org_id is null then raise exception 'Org with slug % not found', p_org_slug; end if;

  select user_id into v_owner_id from memberships where org_id = v_org_id and role = 'owner' limit 1;

  insert into clients (org_id, name, contact_email, created_by)
    values (v_org_id, 'Cornbread Hemp', 'julian.clarkson@ghxstship.pro', v_owner_id)
    on conflict do nothing;
  select id into v_client_id from clients where org_id = v_org_id and name = 'Cornbread Hemp' limit 1;

  insert into projects (org_id, slug, name, description, project_state, start_date, end_date, client_id, created_by)
    values (
      v_org_id, 'cornbread-abbey-road',
      'Cornbread × Abbey Road on the River 2026',
      'Activation transport, install, and storage for Abbey Road on the River, Jeffersonville IN, May 21-25 2026.',
      'active', '2026-05-12', '2026-06-30', v_client_id, v_owner_id
    )
    on conflict (org_id, slug) do update set name = excluded.name, description = excluded.description
    returning id into v_project_id;

  delete from proposals where project_id = v_project_id;

  insert into proposals (org_id, project_id, client_id, title, amount_cents, proposal_state, sent_at, notes, created_by)
    values (
      v_org_id, v_project_id, v_client_id,
      'Cornbread × Abbey Road on the River 2026 — Activation Asset Management',
      1300500, 'sent', now() - interval '2 days',
      'CBH-ABR-2026-V1.0 — see lifecycle for delivery state.',
      v_owner_id
    )
    returning id into v_proposal_id;

  insert into proposal_phase_states (proposal_id, org_id, phase_num, phase_key, phase_name, phase_state, started_at, approved_at, approved_by)
    values (v_proposal_id, v_org_id, 1, 'discovery', 'Discovery & Creative Brief', 'complete', now() - interval '6 days', now() - interval '5 days', v_owner_id)
    returning id into v_phase_id;
  insert into proposal_gate_items (phase_state_id, proposal_id, org_id, ordinal, label, is_done, done_at, done_by) values
    (v_phase_id, v_proposal_id, v_org_id, 1, 'Signed creative brief with engagement parameters', true, now() - interval '5 days', v_owner_id),
    (v_phase_id, v_proposal_id, v_org_id, 2, 'Confirmed venue access windows — May 19 and May 26', true, now() - interval '5 days', v_owner_id),
    (v_phase_id, v_proposal_id, v_org_id, 3, 'Designated Cornbread representative assigned as PM counterpart', true, now() - interval '5 days', v_owner_id),
    (v_phase_id, v_proposal_id, v_org_id, 4, 'Final planter count locked against vendor inventory', true, now() - interval '5 days', v_owner_id);

  insert into proposal_phase_states (proposal_id, org_id, phase_num, phase_key, phase_name, phase_state, started_at)
    values (v_proposal_id, v_org_id, 2, 'concept', 'Concept Adaptation & Visualization', 'in_review', now() - interval '4 days')
    returning id into v_phase_id;
  insert into proposal_gate_items (phase_state_id, proposal_id, org_id, ordinal, label, is_done) values
    (v_phase_id, v_proposal_id, v_org_id, 1, 'Written approval of greenery palette', true),
    (v_phase_id, v_proposal_id, v_org_id, 2, 'Sign-off on lighting positions and timer schedule', true),
    (v_phase_id, v_proposal_id, v_org_id, 3, 'Confirmation of outdoor adaptation notes', false),
    (v_phase_id, v_proposal_id, v_org_id, 4, 'Approval to advance to engineering (2 business-day review window)', false);

  insert into proposal_phase_states (proposal_id, org_id, phase_num, phase_key, phase_name, phase_state, started_at)
    values (v_proposal_id, v_org_id, 3, 'engineering', 'Engineering & Technical Development', 'active', now() - interval '2 days')
    returning id into v_phase_id;
  insert into proposal_gate_items (phase_state_id, proposal_id, org_id, ordinal, label, is_done) values
    (v_phase_id, v_proposal_id, v_org_id, 1, 'Signed load & power plan against venue drop', false),
    (v_phase_id, v_proposal_id, v_org_id, 2, 'Approved anchor specification for planter ring', false),
    (v_phase_id, v_proposal_id, v_org_id, 3, 'Weather contingency plan distributed to all parties', false),
    (v_phase_id, v_proposal_id, v_org_id, 4, 'PE stamp obtained if required', false);

  insert into proposal_phase_states (proposal_id, org_id, phase_num, phase_key, phase_name, phase_state) values
    (v_proposal_id, v_org_id, 4, 'fabrication',  'Fabrication & Procurement',         'locked'),
    (v_proposal_id, v_org_id, 5, 'logistics',    'Logistics & Pre-Deployment',        'locked'),
    (v_proposal_id, v_org_id, 6, 'installation', 'Installation & Environment Build',  'locked'),
    (v_proposal_id, v_org_id, 7, 'activation',   'Activation & Live Operations',      'locked'),
    (v_proposal_id, v_org_id, 8, 'legacy',       'Strike, Storage & Legacy',          'locked');

  insert into proposal_change_orders (proposal_id, org_id, title, body, delta_cents, state, requested_by, requested_label)
    values (v_proposal_id, v_org_id, 'Add 2 planter boxes to ring',
      'Venue confirmed two additional planter positions adjacent to the activation face. Sourcing matched greenery and adding anchors.',
      51000, 'priced', v_owner_id, 'Julian Clarkson')
    returning id into v_co_id;

  insert into proposal_change_orders (proposal_id, org_id, title, body, delta_cents, state, requested_by, requested_label)
    values (v_proposal_id, v_org_id, 'Time-lapse documentation deliverable',
      'Add the optional install-day time-lapse from Phase 06.', 48500, 'requested', v_owner_id, 'Julian Clarkson');

  insert into proposal_revision_rounds (proposal_id, org_id, target_kind, round_num, title, summary, state, created_by)
    values (v_proposal_id, v_org_id, 'phase', 2, 'Greenery palette mockups', '3 mockups for the planter ring — pick one or request changes.', 'client_review', v_owner_id)
    returning id into v_round_id;
  insert into proposal_revisions (round_id, proposal_id, org_id, ordinal, label, note) values
    (v_round_id, v_proposal_id, v_org_id, 1, 'Option A — Cornbread Orange forward', 'Hero botanical reads warm; trailing vine in cedar.'),
    (v_round_id, v_proposal_id, v_org_id, 2, 'Option B — Cannabis green forward', 'Higher contrast against orange wall; reads more growth.'),
    (v_round_id, v_proposal_id, v_org_id, 3, 'Option C — Mixed palette', 'Even split — most similar to existing brand mood boards.');

  insert into proposal_approvals (proposal_id, org_id, kind, title, body, state, due_at)
    values (v_proposal_id, v_org_id, 'phase_gate', 'Phase 02 — Concept Adaptation Sign-Off',
      'Approve the greenery palette and lighting design to advance to engineering.', 'pending', now() + interval '2 days');

  insert into proposal_approvals (proposal_id, org_id, kind, title, body, state, signed_at, signed_by, signed_label)
    values (v_proposal_id, v_org_id, 'sow', 'Master Statement of Work',
      'Counter-signed SOW for Cornbread × Abbey Road on the River 2026.', 'signed', now() - interval '4 days', v_owner_id, 'Julian Clarkson');

  insert into proposal_files (proposal_id, org_id, category, name, storage_path, size_bytes, mime_type, uploaded_by) values
    (v_proposal_id, v_org_id, 'sow', 'CBH-ABR-2026-SOW-V1.pdf', 'demo/cbh-abr-2026/sow-v1.pdf', 248320, 'application/pdf', v_owner_id),
    (v_proposal_id, v_org_id, 'proposal', 'CBH-ABR-2026-Proposal-V1.0.pdf', 'demo/cbh-abr-2026/proposal-v1.pdf', 412800, 'application/pdf', v_owner_id),
    (v_proposal_id, v_org_id, 'contract', 'GHXSTSHIP-MSA-V3.pdf', 'demo/cbh-abr-2026/msa-v3.pdf', 184320, 'application/pdf', v_owner_id);

  perform log_proposal_activity(v_proposal_id, v_org_id, 'proposal.sent', v_owner_id, 'GHXSTSHIP', 'proposal', v_proposal_id, 'Proposal V1.0 sent to client.', '{}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'sow.signed', v_owner_id, 'Cornbread Hemp', 'approval', v_proposal_id, 'Master SOW counter-signed.', '{}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'phase.completed', v_owner_id, 'GHXSTSHIP', 'phase', v_proposal_id, 'Phase 01 — Discovery & Creative Brief completed.', '{"phase_num":1}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'phase.started',   v_owner_id, 'GHXSTSHIP', 'phase', v_proposal_id, 'Phase 02 — Concept Adaptation entered review.', '{"phase_num":2}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'phase.started',   v_owner_id, 'GHXSTSHIP', 'phase', v_proposal_id, 'Phase 03 — Engineering & Technical Development started.', '{"phase_num":3}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'co.priced',       v_owner_id, 'GHXSTSHIP', 'change_order', v_co_id, 'Change order #1 priced — awaiting client decision.', '{"delta_cents":51000}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'rev.created',     v_owner_id, 'GHXSTSHIP', 'revision_round', v_round_id, 'Revision round opened — greenery palette mockups.', '{"round_num":2}');

  return v_proposal_id;
end;
$function$;

-- offer_letters.status -> letter_state (insert column list)
CREATE OR REPLACE FUNCTION public.seed_salvage_city_ssot(p_org_slug text DEFAULT 'demo'::text)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_org_id uuid; v_project_id uuid; v_owner_id uuid;
  v_location_id uuid; v_venue_id uuid;
  v_julian_crew uuid; v_per_diem_rate uuid;
  v_count int := 0;
begin
  select id into v_org_id from orgs where slug = p_org_slug limit 1;
  select id into v_project_id from projects where org_id=v_org_id and slug='edclv26-salvage-city' limit 1;
  select user_id into v_owner_id from memberships where org_id=v_org_id and role='owner' limit 1;
  if v_org_id is null or v_project_id is null then raise exception 'Demo org or salvage city project missing.'; end if;

  insert into org_offer_letter_settings (org_id, default_payment_schedule, default_terms, default_inclusions, default_governing_law, default_employer)
  values (v_org_id,
    '60 % deposit on signature, 40 % balance on load-in',
    'Compensation paid on a 60 % deposit / 40 % balance on load-in basis unless otherwise noted. Travel and lodging arranged by the Five Senses logistics lead. Recipient agrees to comply with the Insomniac 2026 Safety & Social Media Policy and the GHXSTSHIP standard production rider. Confidential — not to be shared outside of the recipient and their direct counsel.',
    jsonb_build_array(
      'Production credentials and radio for the engagement window',
      'Boxed crew meals on call days',
      'On-site parking at Las Vegas Motor Speedway',
      'Coverage by the GHXSTSHIP general liability and workers comp policies'),
    'State of Florida', 'ghxstship')
  on conflict (org_id) do update set
    default_payment_schedule = excluded.default_payment_schedule,
    default_terms            = excluded.default_terms,
    default_inclusions       = excluded.default_inclusions,
    updated_at               = now();

  insert into locations (org_id, name, address, city, region, country, postcode)
  values (v_org_id, 'Las Vegas Motor Speedway', '7000 N Las Vegas Blvd', 'Las Vegas', 'NV', 'US', '89115')
  on conflict (org_id, name) do update set address=excluded.address, city=excluded.city, region=excluded.region;
  select id into v_location_id from locations where org_id=v_org_id and name='Las Vegas Motor Speedway' limit 1;

  insert into venues (org_id, project_id, location_id, name, kind, capacity)
  values (v_org_id, v_project_id, v_location_id, 'Nomads Land — Salvage City', 'live_site', 80)
  on conflict (org_id, project_id, name) do update set location_id=excluded.location_id, capacity=excluded.capacity;
  select id into v_venue_id from venues where org_id=v_org_id and project_id=v_project_id and name='Nomads Land — Salvage City' limit 1;

  insert into crew_members (org_id, user_id, name, email, phone, role, day_rate_cents)
  values (v_org_id, v_owner_id, 'Julian Clarkson', 'julian.clarkson@ghxstship.pro', '(407) 885-6011', 'Operations Director', 0)
  on conflict (org_id, lower(email)) do update set user_id=excluded.user_id, phone=excluded.phone, role=excluded.role;
  select id into v_julian_crew from crew_members where org_id=v_org_id and lower(email)='julian.clarkson@ghxstship.pro' limit 1;
  update org_offer_letter_settings set signing_authority_crew_member_id = v_julian_crew where org_id=v_org_id;

  with role_data(slug, label, department, description, responsibilities) as (values
    ('production-director',          'Production Director',                  'Production',  'Owns end-to-end production for Salvage City — schedule, crew, venue, vendor coordination, advancing, and final reconciliation.', jsonb_build_array('Hold the master schedule and run-of-show', 'Lead daily production briefings', 'Approve all departmental requisitions and POs against the project budget', 'Escalation point for production risk and incidents')),
    ('hospitality-manager',          'Hospitality Manager',                  'Hospitality', 'Owns floor flow, table management, and guest-facing service experience across all five seatings.', jsonb_build_array('Build and run the seating manifest in coordination with Ticket Fairy', 'Coordinate host/server staffing and pre-shift briefings', 'Walk every seating before doors and resolve guest issues in real time', 'Hand off the daysheet to Production at wrap')),
    ('production-manager-fb',        'Production Manager — F&B',             'Production',  'Manages the F&B production track — Levy, Chef Eyal Banayan, Crème by Me, and bar program coordination.', jsonb_build_array('Coordinate F&B advancing and BOH credentials', 'Support culinary and bar leads through load-in and service', 'Track allergen intake and incident reporting on each seating', 'Reconcile depletions and breakage nightly')),
    ('production-manager',           'Production Manager',                   'Production',  'Day-of production manager owning floor operations, crew assignments, and integration with technical departments.', jsonb_build_array('Run pre-show briefings and assign crew positions', 'Coordinate with R-Tech audio, 4Wall lighting, Paradox lighting design, and JTPro stage labor', 'Manage radio traffic on Channel 1', 'Own SOP execution and incident escalation')),
    ('credentials-travel-logistics', 'Credentials, Travel & Logistics',      'Logistics',   'Owns credentialing, travel booking, lodging, and per-diem coordination for the entire Salvage City team.', jsonb_build_array('Issue and track Insomniac credentials per crew', 'Book travel and lodging via Fan Experiences', 'Coordinate the Insomniac Safety & Social Media form for every team member', 'Maintain the master crew movement sheet')),
    ('finance-controller',           'Finance Controller',                   'Finance',     'Owns financial controls — invoicing, payroll, and expense reconciliation for the Salvage City production.', jsonb_build_array('Issue all crew invoices and process payroll', 'Track project budget against rate card', 'Reconcile vendor expenses and bar/F&B depletions', 'Close the project books within 30 days of strike')),
    ('executive-producer',           'Executive Producer',                   'Executive',   'Executive sponsor and final escalation for Salvage City production. Liaison between Five Senses, GHXSTSHIP, and Insomniac.', jsonb_build_array('Stakeholder communication with Insomniac executive team', 'Final approval on creative, F&B, and budget decisions', 'Final escalation point for safety, talent, and venue partner concerns')),
    ('production-crew-heavy',        'Production Crew — Heavy Equipment',    'Production',  'Operates heavy equipment (lifts, forklifts, telehandlers) during load-in, build, and strike.', jsonb_build_array('Operate forklift / lift equipment per OSHA certifications', 'Support trussing, decking, and large-format scenic install', 'Conduct daily equipment safety checks', 'Strike: load-out per the disposition plan')),
    ('production-crew-carpentry-av', 'Production Crew — Carpentry / AV',     'Production',  'Skilled carpentry and AV technical support during load-in, show, and strike.', jsonb_build_array('Support scenic carpentry, fixture install, and AV cabling', 'Daily safety checks of installed elements', 'Maintain crew tool inventory', 'Strike: load-out per the disposition plan')),
    ('production-assistant-driver',  'Production Assistant / Driver',         'Production',  'Production assistance and driver duties — runs, transport, and on-site support.', jsonb_build_array('On-site runs for production team', 'Driver for crew transport between hotel, venue, and outside vendors', 'Support PMs with floor logistics during show nights')),
    ('project-coordinator-remote',   'Project Coordinator (Remote)',         'Production',  'Remote project coordination — documentation, vendor follow-up, and pre-event advancing support.', jsonb_build_array('Track open advancing items in the production playbook', 'Maintain vendor communication and document file paths', 'Coordinate timezone-aware scheduling for production team meetings'))
  )
  insert into org_roles (org_id, slug, label, description, department, responsibilities, permissions, is_system)
  select v_org_id, slug, label, description, department, responsibilities, '{}'::text[], false from role_data
  on conflict (org_id, slug) do update set
    label=excluded.label, description=excluded.description, department=excluded.department, responsibilities=excluded.responsibilities;

  insert into rate_card_items (org_id, catalog, sku, name, description, unit_price_cents, currency, active)
  select v_org_id, 'crew_day_rates', 'CDR-' || r.slug, r.label || ' — Day Rate',
    'Per-day production crew rate for ' || r.label, 0, 'USD', true
   from org_roles r where r.org_id = v_org_id and r.slug = any (array[
     'production-director','hospitality-manager','production-manager-fb','production-manager',
     'credentials-travel-logistics','finance-controller','executive-producer',
     'production-crew-heavy','production-crew-carpentry-av','production-assistant-driver','project-coordinator-remote'])
  on conflict (org_id, sku) do update set name=excluded.name, description=excluded.description, active=excluded.active;

  insert into rate_card_items (org_id, catalog, sku, name, description, unit_price_cents, currency, active)
  values (v_org_id, 'crew_day_rates', 'PD-DAILY', 'Per Diem — Daily', 'Daily per diem for crew on travel days', 0, 'USD', true)
  on conflict (org_id, sku) do update set name=excluded.name;
  select id into v_per_diem_rate from rate_card_items where org_id=v_org_id and sku='PD-DAILY' limit 1;

  with crew_data(name, email, phone, role_slug) as (values
    ('Sarah Fry',              'frysarah8@gmail.com',           '(615) 708-3676', 'production-director'),
    ('Vida Sotakoun',          'vidasotakoun@gmail.com',        '(815) 298-8244', 'hospitality-manager'),
    ('Kade Barrett',           'kadebarrett808@icloud.com',     '(443) 735-8870', 'production-manager-fb'),
    ('Skylar Contini-Enneper', 'skylarenneper@gmail.com',       '(702) 689-6907', 'production-manager'),
    ('Corrine Lepere',         'corrinelepere@gmail.com',       '(845) 406-0261', 'production-manager'),
    ('Margo Williams',         'margo@five-senses.co',          null,             'credentials-travel-logistics'),
    ('Alvaro Hernandez',       'alvaro@five-senses.co',         null,             'finance-controller'),
    ('Paul Seigenthaler',      'paul.seigenthaler@insomniac.com','(856) 373-6541', 'executive-producer'),
    ('Brett Mosher',           'brett@ghxstship.pro',           null,             'production-crew-heavy'),
    ('Adam Waddle',            'adam@ghxstship.pro',            null,             'production-crew-carpentry-av'),
    ('Josh Parra',             'josh@ghxstship.pro',            null,             'production-crew-carpentry-av'),
    ('Mariah Williams',        'mariah@ghxstship.pro',          null,             'production-assistant-driver'),
    ('Amy Reed',               'amy@ghxstship.pro',             null,             'project-coordinator-remote')
  )
  insert into crew_members (org_id, name, email, phone, role, day_rate_cents)
  select v_org_id, name, email, phone, role_slug, 0 from crew_data
  on conflict (org_id, lower(email)) do update set name=excluded.name, phone=excluded.phone, role=excluded.role;

  with letter_data(email, employer, reports_to_email) as (values
    ('frysarah8@gmail.com',           'five_senses', 'julian.clarkson@ghxstship.pro'),
    ('vidasotakoun@gmail.com',        'five_senses', 'frysarah8@gmail.com'),
    ('kadebarrett808@icloud.com',     'five_senses', 'frysarah8@gmail.com'),
    ('skylarenneper@gmail.com',       'five_senses', 'frysarah8@gmail.com'),
    ('corrinelepere@gmail.com',       'five_senses', 'frysarah8@gmail.com'),
    ('margo@five-senses.co',          'five_senses', 'julian.clarkson@ghxstship.pro'),
    ('alvaro@five-senses.co',         'five_senses', 'julian.clarkson@ghxstship.pro'),
    ('paul.seigenthaler@insomniac.com','joint',      'julian.clarkson@ghxstship.pro'),
    ('brett@ghxstship.pro',           'ghxstship',   'julian.clarkson@ghxstship.pro'),
    ('adam@ghxstship.pro',            'ghxstship',   'julian.clarkson@ghxstship.pro'),
    ('josh@ghxstship.pro',            'ghxstship',   'julian.clarkson@ghxstship.pro'),
    ('mariah@ghxstship.pro',          'ghxstship',   'julian.clarkson@ghxstship.pro'),
    ('amy@ghxstship.pro',             'ghxstship',   'julian.clarkson@ghxstship.pro')
  )
  insert into offer_letters (org_id, project_id, crew_member_id, role_id, reports_to_crew_member_id,
    employer, classification, venue_id, rate_card_item_id, per_diem_rate_card_item_id,
    compensation_basis, access_code, token_expires_at, letter_state, created_by)
  select v_org_id, v_project_id, cm.id, r.id, rt.id,
    ld.employer::offer_letter_employer, '1099'::offer_letter_classification, v_venue_id,
    rc.id, v_per_diem_rate, 'per_day'::compensation_basis,
    generate_offer_access_code(), now() + interval '60 days', 'draft', v_owner_id
  from letter_data ld
  join crew_members cm on cm.org_id=v_org_id and lower(cm.email)=lower(ld.email)
  join org_roles r on r.org_id=v_org_id and r.slug=cm.role
  left join crew_members rt on rt.org_id=v_org_id and lower(rt.email)=lower(ld.reports_to_email)
  left join rate_card_items rc on rc.org_id=v_org_id and rc.sku='CDR-' || cm.role
  on conflict (org_id, project_id, crew_member_id) do update set
    role_id=excluded.role_id, reports_to_crew_member_id=excluded.reports_to_crew_member_id,
    employer=excluded.employer, venue_id=excluded.venue_id,
    rate_card_item_id=excluded.rate_card_item_id, per_diem_rate_card_item_id=excluded.per_diem_rate_card_item_id;

  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary)
  select ol.id, v_org_id, 'created', 'GHXSTSHIP', 'Seeded as draft for the Salvage City team.'
    from offer_letters ol where ol.project_id = v_project_id
     and not exists (select 1 from offer_letter_activity a where a.offer_letter_id=ol.id and a.kind='created');

  select count(*) into v_count from offer_letters where project_id=v_project_id;
  return v_count;
end;
$function$;

-- rfqs.status -> rfq_state
CREATE OR REPLACE FUNCTION public.submit_marketplace_inquiry(p_subject_kind text, p_handle text, p_message text, p_event_date date DEFAULT NULL::date, p_contact_email text DEFAULT NULL::text, p_contact_phone text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_org uuid;
  v_subject uuid;
  v_name text;
  v_inquiry uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  -- Resolve the subject under definer rights, re-checking the same is-public
  -- predicates the public_* directory views use. A handle that resolves to a
  -- private or deleted profile must look identical to one that never existed.
  if p_subject_kind = 'vendor' then
    select v.org_id, v.id, v.name into v_org, v_subject, v_name
    from public.vendors v
    where v.public_handle = p_handle and v.is_public_profile = true and v.deleted_at is null;
  elsif p_subject_kind = 'crew' then
    select cm.org_id, cm.id, cm.name into v_org, v_subject, v_name
    from public.crew_members cm
    where cm.public_handle = p_handle and cm.is_public_profile = true;
  elsif p_subject_kind = 'agency' then
    select a.org_id, a.id, a.display_name into v_org, v_subject, v_name
    from public.agencies a
    where a.public_handle = p_handle and a.is_public = true and a.deleted_at is null;
  elsif p_subject_kind = 'talent' then
    select tp.org_id, tp.id, tp.act_name into v_org, v_subject, v_name
    from public.talent_profiles tp
    where tp.public_handle = p_handle and tp.is_public = true and tp.deleted_at is null;
  elsif p_subject_kind = 'rfq' then
    select r.org_id, r.id, r.title into v_org, v_subject, v_name
    from public.rfqs r
    where r.public_slug = p_handle and r.visibility = 'public' and r.rfq_state = 'sent';
  else
    raise exception 'Unknown inquiry subject kind: %', p_subject_kind using errcode = '22023';
  end if;

  if v_subject is null then
    raise exception 'Subject not found or not public' using errcode = 'P0002';
  end if;

  insert into public.marketplace_inquiries (
    org_id, subject_kind, subject_id, subject_name, subject_handle,
    inquirer_user_id, message, event_date, contact_email, contact_phone
  ) values (
    v_org, p_subject_kind::public.marketplace_inquiry_subject, v_subject, v_name, p_handle,
    v_uid, p_message, p_event_date, nullif(p_contact_email, ''), nullif(p_contact_phone, '')
  )
  returning id into v_inquiry;

  return v_inquiry;
end;
$function$;

-- invoices.status -> invoice_state
CREATE OR REPLACE FUNCTION public.sync_budget_for_bucket(p_org_id uuid, p_project_id uuid, p_category text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_expense_total bigint;
  v_invoice_total bigint;
  v_total bigint;
begin
  select coalesce(sum(amount_cents), 0) into v_expense_total
  from expenses
  where org_id = p_org_id
    and (p_project_id is null or project_id = p_project_id)
    and (p_category   is null or category   = p_category);

  select coalesce(sum(amount_cents), 0) into v_invoice_total
  from invoices
  where org_id = p_org_id
    and invoice_state = 'paid'
    and (p_project_id is null or project_id = p_project_id);

  v_total := v_expense_total + v_invoice_total;

  update budgets
  set spent_cents = v_total
  where org_id = p_org_id
    and (project_id = p_project_id or (project_id is null and p_project_id is null))
    and (category   = p_category   or (category   is null and p_category   is null));
end;
$function$;

-- tasks.status -> task_state (insert column list)
CREATE OR REPLACE FUNCTION public.tg_action_item_to_task()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_meeting RECORD;
  v_project_id uuid;
  v_org_id uuid;
  v_task_id uuid;
BEGIN
  IF NEW.assignee_user_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.task_id IS NOT NULL THEN RETURN NEW; END IF;
  SELECT m.id, m.org_id, m.project_id INTO v_meeting FROM public.meetings m WHERE m.id = NEW.meeting_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  v_org_id := v_meeting.org_id;
  v_project_id := v_meeting.project_id;
  IF v_project_id IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.tasks (org_id, project_id, title, description, task_state, priority, due_at, assigned_to, created_by, created_at, updated_at)
  VALUES (v_org_id, v_project_id, LEFT(NEW.description, 200), 'Auto-created from meeting action item.', 'open', 'normal',
    CASE WHEN NEW.due_at IS NOT NULL THEN (NEW.due_at::timestamptz) ELSE NULL END,
    NEW.assignee_user_id, NEW.assignee_user_id, now(), now())
  RETURNING id INTO v_task_id;
  NEW.task_id := v_task_id;
  RETURN NEW;
END;
$function$;

-- purchase_orders.status -> po_state (trigger fires on purchase_orders)
CREATE OR REPLACE FUNCTION public.tg_check_vendor_compliance()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_vendor vendors%rowtype;
begin
  if new.vendor_id is null then return new; end if;
  if new.po_state not in ('sent','acknowledged','fulfilled') then return new; end if;
  if tg_op = 'UPDATE' and old.po_state = new.po_state and old.vendor_id is not distinct from new.vendor_id then
    return new;
  end if;

  select * into v_vendor from vendors where id = new.vendor_id;
  if not found then return new; end if;

  if not coalesce(v_vendor.w9_on_file, false) then
    raise exception 'Vendor "%" missing W-9; PO blocked. Update vendor record before binding.', v_vendor.name
      using errcode = 'check_violation';
  end if;

  if v_vendor.coi_expires_at is null or v_vendor.coi_expires_at < current_date then
    raise exception 'Vendor "%" COI expired or missing; PO blocked. Refresh insurance certificate.', v_vendor.name
      using errcode = 'check_violation';
  end if;

  return new;
end;
$function$;

-- punch_items.status -> item_state (insert column list)
CREATE OR REPLACE FUNCTION public.tg_inspection_item_to_punch()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_inspection RECORD;
  v_project_id uuid;
  v_org_id uuid;
  v_punch_code text;
BEGIN
  IF NEW.result IS NULL OR NEW.result <> 'fail' THEN RETURN NEW; END IF;
  IF (TG_OP = 'UPDATE' AND OLD.result = 'fail') THEN RETURN NEW; END IF;
  SELECT i.id, i.org_id, i.project_id INTO v_inspection FROM public.inspections i WHERE i.id = NEW.inspection_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  v_org_id := v_inspection.org_id;
  v_project_id := v_inspection.project_id;
  IF v_project_id IS NULL THEN RETURN NEW; END IF;
  v_punch_code := 'PUNCH-INSP-' || substr(NEW.id::text, 1, 8);
  INSERT INTO public.punch_items (org_id, project_id, code, title, description, priority, item_state, photo_path, created_at)
  VALUES (v_org_id, v_project_id, v_punch_code, COALESCE(NEW.prompt, 'Inspection failure'), NEW.notes, 'normal', 'open', NEW.photo_path, now())
  ON CONFLICT (org_id, code) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- accounting_periods has no status column (canonical column is `state`) — the
-- old body referenced p.status and was a latent runtime defect. Fixed.
CREATE OR REPLACE FUNCTION public.tg_je_period_lock()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM public.accounting_periods p WHERE p.id = NEW.period_id AND p.state IN ('locked','closed')) THEN
    RAISE EXCEPTION 'ULG period is locked/closed; entries are forbidden';
  END IF;
  RETURN NEW;
END $function$;

-- invoices.status -> invoice_state
CREATE OR REPLACE FUNCTION public.tg_sync_budget_spent_on_invoice()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'DELETE' and old.invoice_state = 'paid' then
    perform sync_budget_for_bucket(old.org_id, old.project_id, null);
  elsif tg_op = 'INSERT' and new.invoice_state = 'paid' then
    perform sync_budget_for_bucket(new.org_id, new.project_id, null);
  elsif tg_op = 'UPDATE' and (old.invoice_state = 'paid' or new.invoice_state = 'paid') then
    perform sync_budget_for_bucket(new.org_id, new.project_id, null);
    if old.project_id is distinct from new.project_id then
      perform sync_budget_for_bucket(old.org_id, old.project_id, null);
    end if;
  end if;
  return null;
end;
$function$;

-- ============================================================================
-- §3 — Drop the dual-write sync triggers + functions (canonical twins live)
-- ============================================================================

drop trigger if exists trg_fabrication_orders_phase_to_status on public.fabrication_orders;
drop function if exists public.tg_fabrication_orders_phase_to_status();

drop trigger if exists job_applications_sync_state on public.job_applications;
drop function if exists private.sync_job_application_state();

drop trigger if exists job_postings_sync_phase on public.job_postings;
drop function if exists private.sync_job_posting_phase();

drop trigger if exists open_calls_sync_phase on public.open_calls;
drop function if exists private.sync_open_call_phase();

drop trigger if exists open_call_submissions_sync_state on public.open_call_submissions;
drop function if exists private.sync_submission_state();

drop trigger if exists talent_offers_sync_state on public.talent_offers;
drop function if exists private.sync_talent_offer_state();

-- ============================================================================
-- §4 — Recreate RLS policies that referenced the soon-to-drop columns
-- ============================================================================

drop policy if exists job_postings_public_select on public.job_postings;
create policy job_postings_public_select on public.job_postings
  for select to anon, authenticated
  using (job_posting_phase = 'published'::job_posting_status and deleted_at is null);

drop policy if exists open_calls_public_select on public.open_calls;
create policy open_calls_public_select on public.open_calls
  for select to anon, authenticated
  using (open_call_phase = 'published'::open_call_status and deleted_at is null);

drop policy if exists anon_submit_open_calls on public.open_call_submissions;
create policy anon_submit_open_calls on public.open_call_submissions
  for insert to anon
  with check (
    submitter_user_id is null
    and guest_name is not null
    and guest_email is not null
    and exists (
      select 1 from open_calls oc
      where oc.id = open_call_submissions.open_call_id
        and oc.open_call_phase = 'published'::open_call_status
    )
  );

-- ============================================================================
-- §5 — Recreate dependent views against the canonical columns.
-- Neither view exposed a `status` output column (status appeared only in the
-- WHERE clause), so the public read path is unchanged.
-- ============================================================================

create or replace view public.public_job_board
with (security_invoker = off) as
 SELECT jp.id,
    jp.public_slug,
    jp.title,
    jp.description,
    jp.role_taxonomy,
    jp.region,
    jp.city,
    jp.country,
    jp.employment_type,
    jp.day_rate_min_cents,
    jp.day_rate_max_cents,
    jp.currency,
    jp.dates,
    jp.posting_type,
    jp.union_required,
    jp.certs_required,
    jp.travel_paid,
    jp.lodging_provided,
    jp.applicant_count,
    jp.published_at,
    jp.expires_at,
    o.name AS org_name,
    o.slug AS org_slug,
    o.logo_url AS org_logo_url
   FROM job_postings jp
     JOIN orgs o ON o.id = jp.org_id
  WHERE jp.job_posting_phase = 'published'::job_posting_status
    AND jp.deleted_at IS NULL
    AND (jp.expires_at IS NULL OR jp.expires_at > now());

create or replace view public.public_open_calls
with (security_invoker = off) as
 SELECT oc.id,
    oc.public_slug,
    oc.kind,
    oc.title,
    oc.description,
    oc.genre_tags,
    oc.trade_categories,
    oc.region,
    oc.venue_type,
    oc.performance_date,
    oc.fee_min_cents,
    oc.fee_max_cents,
    oc.currency,
    oc.deadline_at,
    oc.eligibility,
    oc.submission_count,
    oc.published_at,
    o.name AS org_name,
    o.slug AS org_slug,
    o.logo_url AS org_logo_url
   FROM open_calls oc
     JOIN orgs o ON o.id = oc.org_id
  WHERE oc.open_call_phase = 'published'::open_call_status
    AND oc.deleted_at IS NULL
    AND (oc.deadline_at IS NULL OR oc.deadline_at > now());

-- ============================================================================
-- §6 — Drop the redundant status columns (twins verified fully populated)
-- ============================================================================

alter table public.fabrication_orders    drop column status;
alter table public.job_applications      drop column status;
alter table public.job_postings          drop column status;
alter table public.open_calls            drop column status;
alter table public.open_call_submissions drop column status;
alter table public.talent_offers         drop column status;

-- ============================================================================
-- §7 — Recreate indexes that lived on the dropped columns (same names),
-- now keyed on the canonical twins. Includes the two partial UNIQUE indexes
-- that enforce one-application / one-submission per user.
-- ============================================================================

create unique index job_applications_one_per_user
  on public.job_applications (job_posting_id, applicant_user_id)
  where (job_application_state <> 'withdrawn'::job_application_status);

create index job_applications_posting_status_idx
  on public.job_applications (job_posting_id, job_application_state, applied_at desc);

create index job_postings_status_published_idx
  on public.job_postings (job_posting_phase, published_at desc)
  where (job_posting_phase = 'published'::job_posting_status and deleted_at is null);

create index job_postings_region_idx
  on public.job_postings (region, job_posting_phase);

create unique index open_call_submissions_one_per_user
  on public.open_call_submissions (open_call_id, submitter_user_id)
  where (submission_state <> 'withdrawn'::submission_status);

create index open_call_submissions_status_idx
  on public.open_call_submissions (open_call_id, submission_state);

create index open_calls_status_published_idx
  on public.open_calls (open_call_phase, published_at desc)
  where (open_call_phase = 'published'::open_call_status);

create index open_calls_kind_idx
  on public.open_calls (kind, open_call_phase);

create index talent_offers_status_idx
  on public.talent_offers (org_id, talent_offer_state, performance_date);

create index talent_offers_talent_idx
  on public.talent_offers (talent_profile_id, talent_offer_state);
