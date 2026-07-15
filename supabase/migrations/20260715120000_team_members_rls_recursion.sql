-- team_members had a self-referential RLS cycle. The write policies
-- (team_members_admin_insert / _update / _delete) each carried an inline
--   EXISTS (SELECT 1 FROM team_members tm
--           WHERE tm.team_id = team_members.team_id
--             AND tm.user_id = auth.uid() AND tm.role = 'admin')
-- clause (so a team's OWN admins can manage its membership without holding an
-- org manager+ role). But that subquery reads team_members while the policy is
-- being evaluated FOR team_members — Postgres rejects it with "infinite
-- recursion detected in policy for relation team_members" (42P17).
--
-- It stayed hidden because no path had exercised the write policy until the
-- Teams console create flow: createTeam() inserts the team (org-role gated,
-- fine) then auto-adds the creator as an admin member — that second insert is
-- the first evaluation of team_members_admin_insert, and it recurses. The
-- action swallows the raw PostgrestError as a generic "Failed to create team"
-- and never redirects, so a manager could never create a team.
--
-- Same class as 20260714130000 (message_channels <-> channel_memberships). The
-- fix routes the self-referential membership check through a SECURITY DEFINER
-- helper whose body is NOT re-subjected to the caller's RLS, breaking the
-- cycle. The org-role clause (via private.has_org_role over public.teams, whose
-- own teams_select policy is non-recursive) is unchanged, so the creator's
-- first membership insert still passes on the org-role branch.

create or replace function "private"."is_team_admin"("target_team" "uuid")
  returns boolean
  language "sql" stable security definer
  set "search_path" to 'public'
  as $$
  select exists (
    select 1
    from "team_members" "tm"
    where "tm"."team_id" = "target_team"
      and "tm"."user_id" = (select "auth"."uid"())
      and "tm"."role" = 'admin'
  );
$$;

alter function "private"."is_team_admin"("uuid") owner to "postgres";

comment on function "private"."is_team_admin"("uuid") is
  'RLS helper. SECURITY DEFINER so its team_members read is not re-subjected to the caller RLS — this is what breaks the team_members self-referential policy recursion. Returns false when auth.uid() is null.';

-- Rewrite the three write policies: keep the org manager+ branch (unchanged),
-- swap the recursive inline EXISTS for private.is_team_admin(team_id).

drop policy if exists "team_members_admin_insert" on "public"."team_members";
create policy "team_members_admin_insert" on "public"."team_members"
  for insert
  with check (
    ("team_id" in (
      select "t"."id" from "public"."teams" "t"
      where "private"."has_org_role"("t"."org_id", array['owner'::"text", 'admin'::"text", 'manager'::"text"])
    ))
    or "private"."is_team_admin"("team_id")
  );

drop policy if exists "team_members_admin_update" on "public"."team_members";
create policy "team_members_admin_update" on "public"."team_members"
  for update
  using (
    ("team_id" in (
      select "t"."id" from "public"."teams" "t"
      where "private"."has_org_role"("t"."org_id", array['owner'::"text", 'admin'::"text", 'manager'::"text"])
    ))
    or "private"."is_team_admin"("team_id")
  )
  with check (
    ("team_id" in (
      select "t"."id" from "public"."teams" "t"
      where "private"."has_org_role"("t"."org_id", array['owner'::"text", 'admin'::"text", 'manager'::"text"])
    ))
    or "private"."is_team_admin"("team_id")
  );

drop policy if exists "team_members_admin_delete" on "public"."team_members";
create policy "team_members_admin_delete" on "public"."team_members"
  for delete
  using (
    ("team_id" in (
      select "t"."id" from "public"."teams" "t"
      where "private"."has_org_role"("t"."org_id", array['owner'::"text", 'admin'::"text", 'manager'::"text"])
    ))
    or "private"."is_team_admin"("team_id")
  );
