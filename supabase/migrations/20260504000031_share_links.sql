-- ============================================================================
-- share_links — HMAC-signed public share tokens
-- ============================================================================
-- Phase 3.5 of the SmartSuite parity roadmap. One primitive backs every
-- "send me a public link" surface: saved views, dashboards, generated PDFs,
-- proposals, guides.
--
-- Token format (HMAC-SHA256, app-side):
--   Base64URL of `${id}.${expiresAtMs || ''}.${nonce}` then `.${sig}`
--   Verified server-side; the URL never carries the secret.
--
-- Resource lookup is polymorphic via (resource_table, resource_id), the same
-- shape as audit_log + annotations. This is intentionally a primitive — each
-- downstream resource type wires its own renderer in its own phase. See
-- docs/research/smartsuite-parity/04-solutions-permissions-collab.md (#10).
-- ============================================================================

-- ── Enums ──────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'share_link_role') then
    create type share_link_role as enum ('viewer', 'commenter');
  end if;
end $$;

-- ── Table ──────────────────────────────────────────────────────────────────
create table if not exists share_links (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  resource_table  text not null,
  resource_id     uuid not null,
  -- What the link grants. Default 'viewer' (read-only). 'commenter' permits
  -- annotation insertions tied to the link.
  role            share_link_role not null default 'viewer',
  -- Hashed passcode (scrypt N=16384,r=8,p=1, encoded as scrypt$<saltB64>$<hashB64>).
  -- Optional. Null means no passcode required.
  passcode_hash   text,
  expires_at      timestamptz,
  max_uses        integer,
  uses            integer not null default 0,
  -- Optional human-readable label so the owner remembers what this link is for.
  label           text,
  -- Optional metadata for the resource (e.g. "embed mode", "hide toolbar").
  meta            jsonb not null default '{}'::jsonb,
  -- When set, the link is revoked.
  revoked_at      timestamptz,
  revoked_by      uuid references users(id) on delete set null,
  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Last time the link was successfully consumed.
  last_used_at    timestamptz
);

create index if not exists share_links_resource_idx on share_links(resource_table, resource_id);
create index if not exists share_links_org_idx on share_links(org_id) where revoked_at is null;
create index if not exists share_links_active_idx on share_links(id) where revoked_at is null;

alter table share_links enable row level security;

-- ── RLS policies (idempotent gated creation) ──────────────────────────────
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'share_links' and policyname = 'share_links_select') then
    create policy "share_links_select" on share_links for select
      using (is_org_member(org_id));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'share_links' and policyname = 'share_links_insert') then
    create policy "share_links_insert" on share_links for insert
      with check (
        is_org_member(org_id)
        and has_org_role(org_id, array['owner','admin','manager'])
      );
  end if;

  -- Updates are limited to revocation by the creator or org owners/admins.
  -- The full row schema is otherwise immutable post-create (token sig depends
  -- on id+expiry — mutating those would break verification).
  if not exists (select 1 from pg_policies where tablename = 'share_links' and policyname = 'share_links_revoke') then
    create policy "share_links_revoke" on share_links for update
      using (
        is_org_member(org_id)
        and (created_by = auth.uid() or has_org_role(org_id, array['owner','admin']))
      );
  end if;
end $$;

-- ── updated_at trigger ────────────────────────────────────────────────────
create or replace function tg_share_links_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists share_links_updated_at_tg on share_links;
create trigger share_links_updated_at_tg
  before update on share_links
  for each row execute function tg_share_links_updated_at();

-- ── consume_share_link — atomic single-row claim ──────────────────────────
-- Increments `uses` and stamps `last_used_at`, but only when the link is
-- still alive (not revoked, not expired, not exhausted). A single UPDATE …
-- RETURNING guarantees no race: two concurrent consumers each see exactly
-- one of (winner, loser) — the loser's predicate fails because `uses` was
-- already bumped past `max_uses` by the winner.
--
-- Raises 'share_link_invalid' (errcode 42501) when the row is gone, revoked,
-- expired, or exhausted. Callers translate that into a 4xx response.
--
-- security definer + grant to anon|authenticated so the unauth /share route
-- (running with anon JWT) can call it without SELECT permission on the row.
create or replace function consume_share_link(p_id uuid)
returns share_links
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row share_links;
begin
  update share_links
     set uses = uses + 1,
         last_used_at = now()
   where id = p_id
     and revoked_at is null
     and (expires_at is null or expires_at > now())
     and (max_uses is null or uses < max_uses)
   returning * into v_row;

  if v_row.id is null then
    raise exception 'share_link_invalid' using errcode = '42501';
  end if;

  return v_row;
end $$;

revoke execute on function consume_share_link(uuid) from public;
grant execute on function consume_share_link(uuid) to anon, authenticated;
