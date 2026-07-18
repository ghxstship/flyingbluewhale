-- COMPVSS optimization sweep (2026-07-18): the DB tier.
-- Grounded in the performance advisor + the back-end sweep. Adds the missing
-- hot index, closes the double-open-punch race, wraps two per-row auth.uid()
-- RLS evals, and splits 12 FOR ALL write policies so SELECT stops evaluating
-- a redundant second permissive policy per row.

-- 1. The hottest COMPVSS predicate was UNINDEXED: the open-punch read
--    (time_entries WHERE org_id=? AND user_id=? AND ended_at IS NULL) runs on
--    EVERY clock-in/out + the clock/time renders. A partial UNIQUE index both
--    serves that read and makes the read-then-insert clock-in race impossible
--    at the DB (a second concurrent/replayed punch now 23505s instead of
--    creating a second open entry). Verified 0 existing double-open rows.
create unique index if not exists time_entries_open_per_user
  on public.time_entries (org_id, user_id) where ended_at is null;

-- 2. The only unindexed FKs on COMPVSS / session-resolution paths.
create index if not exists catalog_item_gtins_bound_by_idx
  on public.catalog_item_gtins (bound_by);
-- parties.auth_user_id lost its standalone index when the global unique became
-- (org_id, auth_user_id) in 20260717231335; the FK + getMyPartyId need it.
create index if not exists parties_auth_user_id_idx
  on public.parties (auth_user_id) where auth_user_id is not null;

-- 3. RLS init-plan: these two re-evaluated auth.uid() per row. Wrap in a
--    scalar subselect so the planner evaluates it once.
drop policy if exists chat_message_reactions_owner_delete on public.chat_message_reactions;
create policy chat_message_reactions_owner_delete on public.chat_message_reactions
  for delete using (user_id = (select auth.uid()));
drop policy if exists chat_message_reactions_owner_write on public.chat_message_reactions;
create policy chat_message_reactions_owner_write on public.chat_message_reactions
  for insert with check (private.is_room_member(room_id) and user_id = (select auth.uid()));

-- 4. Split FOR ALL write policies into INSERT/UPDATE/DELETE so they no longer
--    act as a SECOND permissive SELECT policy (each SELECT was evaluating both
--    the read policy AND the write policy per row). Predicates preserved
--    verbatim; role targeting preserved (authenticated vs public).

-- 4a. org-role-gated, TO authenticated: catalog_item_gtins, field_templates
drop policy if exists catalog_item_gtins_iud on public.catalog_item_gtins;
create policy catalog_item_gtins_ins on public.catalog_item_gtins for insert to authenticated
  with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create policy catalog_item_gtins_upd on public.catalog_item_gtins for update to authenticated
  using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']))
  with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create policy catalog_item_gtins_del on public.catalog_item_gtins for delete to authenticated
  using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));

drop policy if exists field_templates_iud on public.field_templates;
create policy field_templates_ins on public.field_templates for insert to authenticated
  with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create policy field_templates_upd on public.field_templates for update to authenticated
  using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']))
  with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create policy field_templates_del on public.field_templates for delete to authenticated
  using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));

-- 4b. assignment-detail siblings (EXISTS over assignments a), TO authenticated
do $$
declare tbl text;
begin
  foreach tbl in array array['catering','credential','lodging','ticket','travel','vehicle'] loop
    execute format('drop policy if exists %I on public.%I', tbl||'_assignment_details_iud', tbl||'_assignment_details');
    execute format($f$create policy %I on public.%I for insert to authenticated
      with check (exists (select 1 from public.assignments a where a.id = assignment_id
        and private.has_org_role(a.org_id, array['owner','admin','manager','controller','collaborator'])))$f$,
      tbl||'_assignment_details_ins', tbl||'_assignment_details');
    execute format($f$create policy %I on public.%I for update to authenticated
      using (exists (select 1 from public.assignments a where a.id = assignment_id
        and private.has_org_role(a.org_id, array['owner','admin','manager','controller','collaborator'])))
      with check (exists (select 1 from public.assignments a where a.id = assignment_id
        and private.has_org_role(a.org_id, array['owner','admin','manager','controller','collaborator'])))$f$,
      tbl||'_assignment_details_upd', tbl||'_assignment_details');
    execute format($f$create policy %I on public.%I for delete to authenticated
      using (exists (select 1 from public.assignments a where a.id = assignment_id
        and private.has_org_role(a.org_id, array['owner','admin','manager','controller','collaborator'])))$f$,
      tbl||'_assignment_details_del', tbl||'_assignment_details');
  end loop;
end $$;

-- 4c. public-role write policies (no TO clause): daily_log_signoffs (org member),
--     pay_periods (org admin), spaces (manager band), space_post_reactions (self)
drop policy if exists daily_log_signoffs_write on public.daily_log_signoffs;
create policy daily_log_signoffs_ins on public.daily_log_signoffs for insert with check (private.is_org_member(org_id));
create policy daily_log_signoffs_upd on public.daily_log_signoffs for update using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));
create policy daily_log_signoffs_del on public.daily_log_signoffs for delete using (private.is_org_member(org_id));

drop policy if exists pay_periods_admin_write on public.pay_periods;
create policy pay_periods_admin_ins on public.pay_periods for insert with check (private.is_org_admin(org_id));
create policy pay_periods_admin_upd on public.pay_periods for update using (private.is_org_admin(org_id)) with check (private.is_org_admin(org_id));
create policy pay_periods_admin_del on public.pay_periods for delete using (private.is_org_admin(org_id));

drop policy if exists spaces_write_manager on public.spaces;
create policy spaces_write_manager_ins on public.spaces for insert with check (private.has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy spaces_write_manager_upd on public.spaces for update using (private.has_org_role(org_id, array['owner','admin','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy spaces_write_manager_del on public.spaces for delete using (private.has_org_role(org_id, array['owner','admin','controller','collaborator']));

drop policy if exists space_post_reactions_write_self on public.space_post_reactions;
create policy space_post_reactions_ins on public.space_post_reactions for insert with check (user_id = (select auth.uid()));
create policy space_post_reactions_del on public.space_post_reactions for delete using (user_id = (select auth.uid()));
