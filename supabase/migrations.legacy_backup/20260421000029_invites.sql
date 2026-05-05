-- ═══════════════════════════════════════════════════════════════════
-- Migration 000029 — invites
-- ═══════════════════════════════════════════════════════════════════
--
-- Membership invites for onboarding a new user into an existing org.
-- An admin creates an invite row; Supabase emails the invitee a link to
-- /accept-invite/<token>; the invitee signs in/signs up and accepts,
-- which materializes as a memberships row.
--
-- Token is a base64 URL-safe 32-byte nonce (~43 chars). Status tracks
-- lifecycle (pending → accepted | revoked; expired is computed from
-- expires_at). Partial unique index on (org_id, email) where pending so
-- a given email can only have one live invite per org at a time.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists invites (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  email        text not null check (length(email) > 3 and email ~ '@'),
  role         platform_role not null default 'community',
  token        text unique not null default translate(encode(gen_random_bytes(32), 'base64'), '+/=', '-_'),
  status       text not null default 'pending' check (status in ('pending','accepted','revoked')),
  expires_at   timestamptz not null default (now() + interval '7 days'),
  invited_by   uuid not null references users(id) on delete restrict,
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  accepted_by  uuid references users(id) on delete set null
);

create unique index if not exists invites_org_email_pending_idx
  on invites (org_id, lower(email))
  where status = 'pending';
create index if not exists invites_token_idx on invites(token);
create index if not exists invites_email_idx on invites(lower(email));
create index if not exists invites_org_status_idx on invites(org_id, status);

alter table invites enable row level security;

-- Org admins/owners/developers can manage invites in their org.
create policy invites_select_admin on invites for select
  using (has_org_role(org_id, array['owner','admin','developer']));
create policy invites_insert_admin on invites for insert
  with check (has_org_role(org_id, array['owner','admin','developer']));
create policy invites_update_admin on invites for update
  using (has_org_role(org_id, array['owner','admin','developer']));
create policy invites_delete_admin on invites for delete
  using (has_org_role(org_id, array['owner','admin','developer']));

-- Authenticated recipient can read a live invite addressed to their email,
-- independent of org membership. Supports the accept-invite flow where
-- the invitee is not yet a member of the target org.
create policy invites_select_recipient on invites for select
  using (
    status = 'pending'
    and expires_at > now()
    and lower(email) = (select lower(email) from auth.users where id = auth.uid())
  );

-- Recipient may update only to transition pending → accepted. The row's
-- org membership is created by the server action in the same transaction;
-- the update here just stamps the acceptance.
create policy invites_accept_recipient on invites for update
  using (
    status = 'pending'
    and expires_at > now()
    and lower(email) = (select lower(email) from auth.users where id = auth.uid())
  )
  with check (
    status = 'accepted'
    and accepted_by = auth.uid()
    and lower(email) = (select lower(email) from auth.users where id = auth.uid())
  );

comment on table invites is
  'Membership invitations. Admins insert; invitees select-by-token + update to accepted.';
comment on column invites.token is
  'URL-safe base64 nonce. Shown in /accept-invite/<token> links. Treat as a secret.';
