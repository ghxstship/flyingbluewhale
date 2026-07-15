-- message_channels had RLS enabled with ONLY a FOR SELECT policy
-- (ums_ch_member) and no INSERT/ALL policy. Every persona's channel-create
-- (the manager+ gated createChannel action) was therefore row-security
-- rejected — the "New Channel" form could never redirect off /new.
--
-- Two problems are fixed here, mirroring the app-level authorization
-- (isManagerPlus == owner/admin/manager == private.is_org_manager_plus):
--
--   1. The missing INSERT policy so manager+ may create org-scoped channels.
--
--   2. A latent mutual-recursion in the SELECT policy. ums_ch_member inlined a
--      subquery on channel_memberships, whose own ums_cm_org policy subqueries
--      message_channels back — a cycle Postgres rejects with "infinite
--      recursion detected in policy for relation message_channels". It stayed
--      hidden because the channels list silently errored/emptied and no write
--      path ever evaluated the policy; the new INSERT's RETURNING is the first
--      to hit it. The fix routes the membership check through a SECURITY
--      DEFINER helper (its body is not re-subjected to the caller's RLS), so
--      message_channels' policy no longer touches channel_memberships as an
--      RLS-applied relation and the cycle is broken. The read carve-out is
--      also widened from admin-only to manager+ so a plain manager can read
--      the row it just created back (the insert RETURNING and the channel
--      detail read are both subject to this SELECT policy). Message *content*
--      stays membership-gated via the untouched ums_msg_member.

-- SECURITY DEFINER membership check — breaks the message_channels <->
-- channel_memberships RLS cycle. Mirrors the shape of private.is_org_member.
create or replace function "private"."is_channel_member"("target_channel" "uuid")
  returns boolean
  language "sql" stable security definer
  set "search_path" to 'public'
  as $$
  select exists (
    select 1
    from "channel_memberships" "cm"
    join "parties" "p" on "p"."id" = "cm"."party_id"
    where "cm"."channel_id" = "target_channel"
      and "p"."auth_user_id" = (select "auth"."uid"())
  );
$$;

alter function "private"."is_channel_member"("uuid") owner to "postgres";

comment on function "private"."is_channel_member"("uuid") is
  'RLS helper. SECURITY DEFINER so its channel_memberships read is not re-subjected to the caller RLS — this is what breaks the message_channels <-> channel_memberships policy recursion. Returns false when auth.uid() is null.';

alter policy "ums_ch_member" on "public"."message_channels"
  using (
    "private"."is_org_manager_plus"("org_id")
    or "private"."is_channel_member"("id")
  );

create policy "ums_ch_insert" on "public"."message_channels"
  for insert to "authenticated"
  with check ("private"."is_org_manager_plus"("org_id"));
