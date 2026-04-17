-- flyingbluewhale · row-level security policies
-- Defense-in-depth layer #4 (middleware + layout + server action are #1–3).

alter table orgs                   enable row level security;
alter table users                  enable row level security;
alter table memberships            enable row level security;
alter table projects               enable row level security;
alter table tickets                enable row level security;
alter table ticket_scans           enable row level security;
alter table advancing_submissions  enable row level security;

-- ─── orgs ────────────────────────────────────────────────
-- A user can see orgs they're a member of.
create policy orgs_select on orgs for select
  using (is_org_member(id));

-- Only owners/admins can update their org.
create policy orgs_update on orgs for update
  using (has_org_role(id, array['owner','admin']))
  with check (has_org_role(id, array['owner','admin']));

-- Inserts/deletes handled by service role (signup flow).

-- ─── users ───────────────────────────────────────────────
-- A user can see themself, and other users in shared orgs.
create policy users_select_self on users for select
  using (id = auth.uid() or exists (
    select 1 from memberships m1
    join memberships m2 on m1.org_id = m2.org_id
    where m1.user_id = auth.uid() and m2.user_id = users.id
  ));

create policy users_update_self on users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ─── memberships ─────────────────────────────────────────
create policy memberships_select on memberships for select
  using (user_id = auth.uid() or is_org_member(org_id));

create policy memberships_insert_admin on memberships for insert
  with check (has_org_role(org_id, array['owner','admin']));

create policy memberships_update_admin on memberships for update
  using (has_org_role(org_id, array['owner','admin']))
  with check (has_org_role(org_id, array['owner','admin']));

create policy memberships_delete_admin on memberships for delete
  using (has_org_role(org_id, array['owner','admin']) or user_id = auth.uid());

-- ─── projects ────────────────────────────────────────────
create policy projects_select on projects for select
  using (is_org_member(org_id));

create policy projects_insert on projects for insert
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));

create policy projects_update on projects for update
  using (has_org_role(org_id, array['owner','admin','controller','collaborator']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));

create policy projects_delete on projects for delete
  using (has_org_role(org_id, array['owner','admin']));

-- ─── tickets ─────────────────────────────────────────────
create policy tickets_select on tickets for select
  using (is_org_member(org_id) or holder_email = (select email from auth.users where id = auth.uid()));

create policy tickets_insert on tickets for insert
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));

create policy tickets_update on tickets for update
  using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));

-- ─── ticket_scans ────────────────────────────────────────
create policy ticket_scans_select on ticket_scans for select
  using (exists (select 1 from tickets t where t.id = ticket_id and is_org_member(t.org_id)));

create policy ticket_scans_insert on ticket_scans for insert
  with check (exists (select 1 from tickets t where t.id = ticket_id
                       and has_org_role(t.org_id, array['owner','admin','controller','collaborator','crew','contractor'])));

-- ─── advancing_submissions ───────────────────────────────
create policy advancing_select on advancing_submissions for select
  using (
    submitter_user_id = auth.uid()
    or exists (select 1 from projects p where p.id = project_id and is_org_member(p.org_id))
  );

create policy advancing_insert on advancing_submissions for insert
  with check (submitter_user_id = auth.uid());

create policy advancing_update_submitter on advancing_submissions for update
  using (submitter_user_id = auth.uid() and status in ('pending','revision_requested'))
  with check (submitter_user_id = auth.uid());

create policy advancing_update_reviewer on advancing_submissions for update
  using (exists (select 1 from projects p where p.id = project_id
                  and has_org_role(p.org_id, array['owner','admin','controller','collaborator'])))
  with check (exists (select 1 from projects p where p.id = project_id
                       and has_org_role(p.org_id, array['owner','admin','controller','collaborator'])));
