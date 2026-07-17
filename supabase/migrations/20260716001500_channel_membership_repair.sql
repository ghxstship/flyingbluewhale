-- Channel messaging: repair the data, and make the party columns un-lie-able.
--
-- `messages` RLS (ums_msg_post / ums_msg_member) admits only channel members,
-- matched through channel_memberships.party_id -> parties.auth_user_id. But
-- nothing in the app ever wrote channel_memberships, so a console-created
-- channel could never be posted in by anyone. The app now seeds the creator as
-- an `admin` member and offers an add/remove-members surface; this migration
-- cleans up what the gap left in the data.
--
-- Root cause of the second defect: neither `channel_memberships.party_id` nor
-- `messages.author_party_id` had a foreign key to `parties`, so both silently
-- accepted AUTH USER ids. `postMessage` wrote `session.userId` into
-- `author_party_id` and the DB took it without complaint — 18/18 message rows
-- were wrong.

-- 1. Clear author ids that are not parties.
--
-- There is no honest repair for these. The rows were authored by the demo seed
-- user (test+owner@flyingbluewhale.app), which has NO party in the channels'
-- org (Demo Events Co.) — it is not even a member of that org. Its only party
-- lives in a different tenant, so "mapping the auth uid to its party" would
-- plant a foreign tenant's party as the author of another org's messages.
-- NULL is the truthful value: the column answers "which party wrote this", and
-- for these rows we do not know. It is nullable, and the UI renders NULL as
-- "Unknown". Written as a predicate over validity (not a row list) so it is
-- idempotent and can never touch a correct row.
update public.messages m
set author_party_id = null
where m.author_party_id is not null
  and not exists (select 1 from public.parties p where p.id = m.author_party_id);

-- 2. Revive channels that have messages but no members.
--
-- The six demo project channels were seeded in one batch, but only
-- #iii-points-2026-production got membership rows — leaving the other five
-- invisible and unreadable to everyone, seeded conversation included. A
-- memberless channel inherits the member set of its same-org, same-kind
-- siblings, which completes the half-finished seed without inventing a rule.
-- Same-org is load-bearing: it keeps the copy from crossing a tenant boundary.
-- No-ops cleanly where no sibling template exists (e.g. a fresh local DB).
insert into public.channel_memberships (channel_id, party_id, role)
select distinct dead.id, src.party_id, 'member'
from public.message_channels dead
join public.channel_memberships src on src.channel_id <> dead.id
join public.message_channels tmpl
  on tmpl.id = src.channel_id
 and tmpl.org_id = dead.org_id
 and tmpl.kind = dead.kind
where not exists (select 1 from public.channel_memberships x where x.channel_id = dead.id)
  and exists (select 1 from public.messages m where m.channel_id = dead.id)
on conflict (channel_id, party_id) do nothing;

-- 3. Purge the husks the e2e create-flow stranded.
--
-- It created channels it could never post into. Narrow by construction: no
-- messages, no members, nothing to lose. The spec now cleans up after itself.
delete from public.message_channels c
where c.name like 'E2E Channel %'
  and not exists (select 1 from public.messages m where m.channel_id = c.id)
  and not exists (select 1 from public.channel_memberships cm where cm.channel_id = c.id);

-- 4. Close the hole that allowed all of the above.
--
-- With these FKs an auth uid in a party column is rejected at write time
-- instead of being stored as a plausible-looking lie. This is what makes the
-- `author_party_id: session.userId` class of bug impossible rather than merely
-- fixed. Deliberate delete semantics: a departed party's memberships go with
-- them (cascade), while their messages survive authorless (set null) so a
-- channel's history is never silently rewritten.
alter table public.channel_memberships
  add constraint channel_memberships_party_id_fkey
  foreign key (party_id) references public.parties(id) on delete cascade;

alter table public.messages
  add constraint messages_author_party_id_fkey
  foreign key (author_party_id) references public.parties(id) on delete set null;

-- FK-backed lookups the new surfaces run on every channel read.
create index if not exists channel_memberships_party_id_idx on public.channel_memberships (party_id);
create index if not exists messages_author_party_id_idx on public.messages (author_party_id);
