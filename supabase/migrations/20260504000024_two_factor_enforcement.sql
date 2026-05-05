-- ============================================================================
-- Two-Factor Authentication — per-role enforcement + recovery codes
-- ============================================================================
-- Phase 2.5 of the SmartSuite parity roadmap.
-- Per https://help.smartsuite.com/en/articles/9163772-two-factor-authentication
-- an org can require MFA from specific platform roles. We layer this on top of
-- Supabase Auth's native MFA primitives (`auth.mfa_factors`) — TOTP factors are
-- enrolled and verified through `supabase.auth.mfa.*` and the canonical store
-- is `auth.mfa_factors`. We don't shadow that here.
--
-- What we DO add:
--   1. `orgs.require_2fa_for jsonb` — a per-platform-role boolean map. The
--      middleware (`src/proxy.ts`) reads this and forces the user through
--      `/mfa/challenge` whenever their role is in the truthy set and the
--      current session aal is below 'aal2'. Empty object (the default)
--      = MFA optional for everyone.
--   2. `mfa_recovery_codes` — Supabase Auth doesn't ship recovery codes for
--      TOTP, so we maintain our own. Codes are hashed (sha256, plaintext is
--      shown ONCE at generation) and consumed atomically by setting `used_at`.
--      No RLS policies — only the service-role client touches this table.
--
-- Idempotent. Safe to re-apply.
-- ============================================================================

alter table orgs add column if not exists require_2fa_for jsonb not null default '{}'::jsonb;
comment on column orgs.require_2fa_for is
  'Per-platform-role MFA requirement. Shape: { "owner": true, "admin": true, ... }. '
  'Enforced by middleware: a user whose role is truthy here must satisfy aal2 to '
  'access org resources. Empty object = MFA not required for any role.';

create table if not exists mfa_recovery_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  code_hash   text not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists mfa_recovery_codes_user_idx
  on mfa_recovery_codes(user_id) where used_at is null;

alter table mfa_recovery_codes enable row level security;
-- Intentionally no policies — only the service-role client (which bypasses RLS)
-- ever reads or mutates this table. Anonymous + authenticated end-users are
-- denied by default once RLS is enabled with no permissive policy.

comment on table mfa_recovery_codes is
  'Single-use recovery codes for TOTP MFA. sha256(plaintext). Plaintext is shown '
  'once at generation time and never persisted. Service-role-only access.';
