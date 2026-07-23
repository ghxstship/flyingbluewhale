-- F1 · Field custody moves must land in the asset_movements ledger
-- (docs/compvss/MOBILE_BEST_PRACTICES_2026-07.md, fix-now F1, ratified).
--
-- ## The hole
--
-- Every custody move (COMPVSS /m/inventory + /m/check-in, ATLVS
-- /studio/assets) routes through the shared `transitionAssetState`
-- (src/lib/db/asset-transition.ts): FSM check, TOCTOU-safe `assets.state`
-- flip, `asset_movements` ledger append, audit emit. Its app gate is
-- manager+ OR the ADR-0015 `asset:custody` grant — and the grants resolver
-- is LIVE (`resolveGrants` in src/lib/auth.ts rides
-- `public.effective_capabilities`). But the RLS layer still says otherwise:
--
--   · `assets_update` (20260703120000) admits ONLY the manager band
--     (owner/admin/controller/collaborator/manager). A custody-granted crew
--     member passes the app gate, then the conditional UPDATE matches zero
--     rows — an RLS no-op returns NO error (repo canon), so the field sees
--     the misleading "Asset state changed concurrently" and the custody
--     chain has a hole exactly where custody physically changes hands.
--   · `ual_mv_org` (baseline) lets ANY org member INSERT ANY movement row —
--     no actor binding, no kind restriction. Too loose to be a ledger and
--     too coarse to express "the field may record its own handoff".
--
-- ## The fix — mirror the app gate at the DB, narrowly
--
-- 1. `assets_custody_update`: an org member holding `asset:custody` (per
--    `public.effective_capabilities`, the same source the app gate reads)
--    may UPDATE an asset — confined to live rows in custody-shaped states.
--    Managers keep the wide `assets_update`; policies are permissive-OR.
-- 2. `ual_mv_org` is REPLACED by two actor-bound INSERT arms:
--      · manager band → any movement row they record themselves;
--      · custody grant → custody kinds only (`checkout`/`return`/`transfer`),
--        recorded by themselves, and the custodian column names THEIR OWN
--        party (auth.uid() → parties per the parties canon — parties.ts is
--        the one auth-uid→party translation layer).
--    INSERT only: the append-only ledger stays append-only —
--    `ual_mv_no_update` / `ual_mv_no_delete` are untouched.
--
-- `movement_kind` note: `movementKindFor` (src/lib/db/assets.ts) maps the
-- check-in pair `in_use→available` to `return` and `in_transit→available`
-- to `transfer`, so the custody arm must admit all three kinds. Checkout
-- binds `to_custodian_id`; return/transfer bind `from_custodian_id`.
--
-- LDP: no new columns; `assets.state` stays the `ual_state` home and the
-- ledger stays the immutable UAL journal. RLS canon respected: explicit
-- WITH CHECK everywhere, subqueries only against tables the caller can
-- read under their own RLS (`assets_select` + `uis_parties_org` are both
-- org-member reads), `effective_capabilities` is SECURITY DEFINER and can
-- only answer for auth.uid().

-- 1 · Custody-granted members may flip the asset facet.
--     Scope: live rows only (a custody grant is not a soft-delete or
--     resurrect power), and only rows whose state is custody-shaped —
--     USING pins the eligible FROM side (the CHECK_OUT.from ∪ CHECK_IN.from
--     set), WITH CHECK pins the custody TO side (in_use | available), so a
--     granted member cannot drive an asset into retired/lost/maintenance
--     nor touch a retired row. The app-layer FSM narrows further.
create policy assets_custody_update on public.assets
  for update
  to authenticated
  using (
    private.is_org_member(org_id)
    and deleted_at is null
    and state in ('available', 'reserved', 'acquired', 'in_use', 'in_transit')
    and exists (
      select 1 from public.effective_capabilities(org_id) cap
      where cap = 'asset:custody'
    )
  )
  with check (
    private.is_org_member(org_id)
    and deleted_at is null
    and state in ('in_use', 'available')
    and exists (
      select 1 from public.effective_capabilities(org_id) cap
      where cap = 'asset:custody'
    )
  );

-- 2 · Replace the loose any-member ledger INSERT with actor-bound arms.
drop policy if exists ual_mv_org on public.asset_movements;

-- 2a · Manager band: any movement row, recorded by themselves. This is the
--      console path (`transitionAssetState` always writes
--      `recorded_by = session.userId`), now enforced instead of assumed.
create policy ual_mv_manager_insert on public.asset_movements
  for insert
  to authenticated
  with check (
    recorded_by = (select auth.uid())
    and exists (
      select 1 from public.assets a
      where a.id = asset_movements.asset_id
        and private.has_org_role(
          a.org_id,
          array['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]
        )
    )
  );

-- 2b · Field custody arm: a member holding `asset:custody` records their
--      own handoff — custody kinds only, actor = auth.uid(), custodian =
--      the caller's own party in the asset's org (checkout binds the TO
--      side, return/transfer bind the FROM side). INSERT only.
create policy ual_mv_field_custody_insert on public.asset_movements
  for insert
  to authenticated
  with check (
    recorded_by = (select auth.uid())
    and exists (
      select 1
      from public.assets a
      join public.parties p
        on p.org_id = a.org_id
       and p.auth_user_id = (select auth.uid())
       and p.deleted_at is null
      where a.id = asset_movements.asset_id
        and private.is_org_member(a.org_id)
        and exists (
          select 1 from public.effective_capabilities(a.org_id) cap
          where cap = 'asset:custody'
        )
        and (
          (asset_movements.movement_kind = 'checkout'
            and asset_movements.to_custodian_id = p.id)
          or (asset_movements.movement_kind in ('return', 'transfer')
            and asset_movements.from_custodian_id = p.id)
        )
    )
  );
