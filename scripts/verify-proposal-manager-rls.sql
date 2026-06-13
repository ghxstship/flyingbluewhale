-- D1 live verification — "forced manager" RLS impersonation probe.
--
-- Proves that after 20260612180000_proposal_rls_manager_grant.sql +
-- 20260613170000_convert_seed_rls_manager_grant.sql a real manager
-- (membership role='manager', persona='manager' — a persona NOT in the policy
-- band, i.e. NOT relying on the demo org's persona='owner' masking) can
-- INSERT, under RLS, every row the
-- proposal create/convert path writes: a proposal, a proposal share link, a
-- project, AND the convert-seed downstream rows (invoice, deliverable,
-- budget). Without the second migration the project insert PASSes but the
-- downstream seeds FAIL — the silent half-converted-project defect.
--
-- This is the canonical Postgres RLS-impersonation pattern: set the
-- `authenticated` role + `request.jwt.claims.sub`, which is exactly what
-- `private.has_org_role(org_id, required[])` (= `role::text = any(required)
-- OR persona = any(required)`, keyed on `auth.uid()`) evaluates at request
-- time.
--
-- READ-ONLY: the whole thing runs inside BEGIN … ROLLBACK, so it mutates a
-- demo membership and inserts three rows ONLY within the transaction and
-- leaves zero trace. Run it with the Supabase MCP (`execute_sql`) or psql
-- against the linked project. Watch the NOTICE output:
--
--   PASS expected on a FIXED schema:
--     NOTICE: proposal insert: PASS
--     NOTICE: share_link insert: PASS
--     NOTICE: project insert: PASS
--     NOTICE: invoice insert: PASS
--     NOTICE: deliverable insert: PASS
--     NOTICE: budget insert: PASS
--   On the UNFIXED schema the corresponding line reads FAIL (RLS rejected) —
--   that is the bug, and is what the migrations above close.

begin;

do $$
declare
  v_org      uuid;
  v_user     uuid;
  v_proposal uuid;
  v_project  uuid;
  v_slug     text := left('rls-probe-' || replace(gen_random_uuid()::text, '-', ''), 48);
  ok_prop    boolean := false;
  ok_link    boolean := false;
  ok_proj    boolean := false;
  ok_inv     boolean := false;
  ok_deliv   boolean := false;
  ok_budget  boolean := false;
begin
  -- 1. Resolve the demo org + an existing member to impersonate.
  select id into v_org from public.orgs where slug = 'demo' limit 1;
  if v_org is null then
    raise exception 'demo org not found — adjust the org slug for your environment';
  end if;
  select user_id into v_user
    from public.memberships
    where org_id = v_org and deleted_at is null
    order by created_at
    limit 1;
  if v_user is null then
    raise exception 'no demo-org membership found to impersonate';
  end if;

  -- 2. Force the exact bug condition: a manager whose persona does NOT match
  --    the policy band, so only role='manager' can satisfy RLS. persona is
  --    NOT NULL on the live schema, so we use 'manager' (a real persona value
  --    that is NOT one of owner/admin/controller/collaborator) rather than
  --    NULL — both defeat the has_org_role persona branch, but 'manager'
  --    respects the column constraint.
  update public.memberships
    set role = 'manager', persona = 'manager'
    where org_id = v_org and user_id = v_user;

  -- 3. Impersonate that user as the `authenticated` role for the rest of the txn.
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user::text, 'role', 'authenticated')::text,
    true
  );

  -- 4a. proposal INSERT (createProposalAction surface)
  begin
    insert into public.proposals (org_id, title, created_by)
      values (v_org, 'RLS probe — manager create', v_user)
      returning id into v_proposal;
    ok_prop := true;
  exception
    when insufficient_privilege then ok_prop := false;  -- 42501 = RLS WITH CHECK rejected
  end;

  -- 4b. proposal_share_links INSERT (publish surface) — needs the proposal id.
  if ok_prop then
    begin
      insert into public.proposal_share_links (proposal_id, token, created_by)
        values (v_proposal, 'probe-' || replace(gen_random_uuid()::text, '-', ''), v_user);
      ok_link := true;
    exception
      when insufficient_privilege then ok_link := false;
    end;
  end if;

  -- 4c. projects INSERT (convertProposalToProjectAction surface). Capture the
  --     id so the convert-seed probes below can attach to a real project row.
  begin
    insert into public.projects (org_id, slug, name, created_by)
      values (v_org, v_slug, 'RLS probe — manager convert', v_user)
      returning id into v_project;
    ok_proj := true;
  exception
    when insufficient_privilege then ok_proj := false;
  end;

  -- The convert-seed probes (4d–4f) mirror what convertProposalToProjectAction
  -- + seedFromBlocks() insert AFTER the project exists. Each guards the second
  -- migration (20260613170000_convert_seed_rls_manager_grant.sql); on the
  -- UNFIXED schema they FAIL silently in the app (the seeds soft-fail), leaving
  -- a half-converted project. They only run if the project insert succeeded.
  if ok_proj then
    -- 4d. invoices INSERT (deposit/balance seed surface). invoice_state has a
    --     'draft' default, so org_id/number/title/project_id is the minimal row.
    begin
      insert into public.invoices (org_id, project_id, number, title, amount_cents, created_by)
        values (v_org, v_project, 'RLS-PROBE-D', 'RLS probe — deposit', 100, v_user);
      ok_inv := true;
    exception
      when insufficient_privilege then ok_inv := false;
    end;

    -- 4e. deliverables INSERT (seedFromBlocks phase-deliverable surface).
    --     deliverables_insert gates on is_org_member, so this should PASS even
    --     pre-fix — it confirms the seed's deliverable leg is reachable.
    begin
      insert into public.deliverables (org_id, project_id, type, title, fulfillment_state)
        values (v_org, v_project, 'technical_rider', 'RLS probe — deliverable', 'briefed');
      ok_deliv := true;
    exception
      when insufficient_privilege then ok_deliv := false;
    end;

    -- 4f. budgets INSERT (seedFromBlocks investment-table surface).
    begin
      insert into public.budgets (org_id, project_id, name, category, amount_cents)
        values (v_org, v_project, 'RLS probe — budget', 'Production', 100);
      ok_budget := true;
    exception
      when insufficient_privilege then ok_budget := false;
    end;
  end if;

  -- 5. Report.
  raise notice 'forced manager: user=% org=% (role=manager, persona=NULL)', v_user, v_org;
  raise notice 'proposal insert: %',     case when ok_prop then 'PASS' else 'FAIL (RLS rejected)' end;
  raise notice 'share_link insert: %',   case when ok_link then 'PASS' else 'FAIL (RLS rejected)' end;
  raise notice 'project insert: %',      case when ok_proj then 'PASS' else 'FAIL (RLS rejected)' end;
  raise notice 'invoice insert: %',      case when ok_inv then 'PASS' else 'FAIL (RLS rejected)' end;
  raise notice 'deliverable insert: %',  case when ok_deliv then 'PASS' else 'FAIL (RLS rejected)' end;
  raise notice 'budget insert: %',       case when ok_budget then 'PASS' else 'FAIL (RLS rejected)' end;

  if not (ok_prop and ok_link and ok_proj and ok_inv and ok_deliv and ok_budget) then
    raise warning 'D1 NOT fully fixed on this schema — at least one manager write (create/convert or convert-seed) was rejected by RLS';
  else
    raise notice 'D1 verified — manager can create proposal + share link + project AND fully seed the convert (invoice + deliverable + budget) under RLS';
  end if;
end $$;

rollback;
