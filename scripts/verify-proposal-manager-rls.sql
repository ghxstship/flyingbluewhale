-- D1 live verification — "forced manager" RLS impersonation probe.
--
-- Proves that after 20260612180000_proposal_rls_manager_grant.sql a real
-- manager (membership role='manager', persona=NULL — i.e. NOT relying on the
-- demo org's persona='owner' masking) can INSERT a proposal, a proposal
-- share link, and a project under RLS.
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
--   On the UNFIXED schema each line reads FAIL (RLS rejected) — that is the
--   bug, and is what the migration above closes.

begin;

do $$
declare
  v_org      uuid;
  v_user     uuid;
  v_proposal uuid;
  v_slug     text := left('rls-probe-' || replace(gen_random_uuid()::text, '-', ''), 48);
  ok_prop    boolean := false;
  ok_link    boolean := false;
  ok_proj    boolean := false;
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
  --    the policy band (persona=NULL), so only role='manager' can satisfy RLS.
  update public.memberships
    set role = 'manager', persona = null
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

  -- 4c. projects INSERT (convertProposalToProjectAction surface)
  begin
    insert into public.projects (org_id, slug, name, created_by)
      values (v_org, v_slug, 'RLS probe — manager convert', v_user);
    ok_proj := true;
  exception
    when insufficient_privilege then ok_proj := false;
  end;

  -- 5. Report.
  raise notice 'forced manager: user=% org=% (role=manager, persona=NULL)', v_user, v_org;
  raise notice 'proposal insert: %',   case when ok_prop then 'PASS' else 'FAIL (RLS rejected)' end;
  raise notice 'share_link insert: %', case when ok_link then 'PASS' else 'FAIL (RLS rejected)' end;
  raise notice 'project insert: %',    case when ok_proj then 'PASS' else 'FAIL (RLS rejected)' end;

  if not (ok_prop and ok_link and ok_proj) then
    raise warning 'D1 NOT fixed on this schema — at least one manager write was rejected by RLS';
  else
    raise notice 'D1 verified — manager can create proposal + share link + project under RLS';
  end if;
end $$;

rollback;
