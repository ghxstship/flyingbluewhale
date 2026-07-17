-- Channels: give `message_channels` and `messages` a DELETE policy.
--
-- Neither table had one, so every DELETE was a silent no-op: RLS filters the
-- rows out of the statement's scope and Postgres reports success for deleting
-- nothing. PostgREST answers 204 and the caller believes it worked. That is
-- how the e2e teardown came to report "0 residual rows removed" on every run
-- while its `E2E Channel %` fixtures accumulated in the database untouched.
--
-- Retiring a channel is org-config, matching who may create one
-- (`ums_ch_insert` = is_org_manager_plus). Author-only for messages: the
-- person who wrote it may retract it, which is narrower than the manager band
-- and deliberately so — a manager silently deleting someone else's words is a
-- different feature with different consequences, and nothing has asked for it.
-- Deleting a channel cascades its memberships and messages (existing FKs).

create policy "ums_ch_delete" on public.message_channels
  for delete using (private.is_org_manager_plus(org_id));

create policy "ums_msg_delete" on public.messages
  for delete using (
    author_party_id in (
      select p.id from public.parties p where p.auth_user_id = (select auth.uid())
    )
  );
