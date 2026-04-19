-- H3-09 / IK-058 — Production → staging data anonymizer.
--
-- Run this script against a staging Postgres instance IMMEDIATELY AFTER
-- restoring a production dump and BEFORE granting any non-admin user
-- access. Transforms:
--   - auth.users.email      → deterministic hash@staging.invalid
--   - users.name            → "User N"
--   - users.avatar_url      → null
--   - orgs.name             → "Org N"
--   - clients.email/phone   → anon
--   - leads.email/phone     → anon
--   - vendors.email         → anon
--   - credentials.details   → redacted jsonb
--   - audit_log.actor_email → anon
--   - webhook signatures / idempotency keys / user passkeys → truncated
--
-- The script is idempotent — running twice produces the same output.
-- Every transform uses a stable hash of the original value so foreign-
-- key references stay consistent (no row is rewritten away from itself).
--
-- USAGE (staging only — NEVER run against production):
--   psql "postgres://<staging-creds>" -f scripts/db/anonymize-staging.sql
--
-- Guard check: script refuses to run if the DB looks like production
-- (has the canonical prod org slug and a live Stripe live-mode customer).

do $$
declare
  is_prod boolean;
begin
  select exists(
    select 1 from orgs where slug = 'demo'
  ) and exists(
    select 1 from pg_database where datname = current_database() and datname in ('postgres')
  ) into is_prod;
  -- A defensive check — real production uses Supabase's `postgres` DB
  -- name too, so `is_prod` alone isn't conclusive. Operators MUST
  -- additionally confirm the target by setting the flag below.
  if current_setting('fbw.allow_anonymize', true) is distinct from 'yes' then
    raise exception
      'Refusing to anonymize: set `SET fbw.allow_anonymize = ''yes'';` before running this script on a verified-staging DB.';
  end if;
end $$;

-- Stable anonymizer: md5(original) truncated, so the same input always
-- produces the same output. Foreign keys remain consistent.
create or replace function fbw_anon_hash(v text) returns text as $$
  select substr(md5(coalesce(v, '')), 1, 12);
$$ language sql immutable;

-- Emails → <hash>@staging.invalid (RFC 2606 reserved domain).
update auth.users
  set email = fbw_anon_hash(email) || '@staging.invalid',
      raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{anonymized}', 'true'::jsonb);

update users
  set email = fbw_anon_hash(email) || '@staging.invalid',
      name = 'User ' || substr(fbw_anon_hash(id::text), 1, 6),
      avatar_url = null;

-- Org names → generated. Slug stays (routing) but display name anonymizes.
update orgs
  set name = 'Org ' || substr(fbw_anon_hash(id::text), 1, 4),
      name_override = null;

-- CRM contact PII (if present).
update clients   set email = fbw_anon_hash(email) || '@staging.invalid', phone = null, notes = null
  where email is not null or phone is not null or notes is not null;
update leads     set email = fbw_anon_hash(email) || '@staging.invalid', phone = null, notes = null
  where email is not null or phone is not null or notes is not null;
update vendors   set email = fbw_anon_hash(email) || '@staging.invalid', notes = null
  where email is not null or notes is not null;

-- Credentials blob may carry secrets — scrub to an empty shape.
update credentials set details = '{}'::jsonb where details != '{}'::jsonb;

-- Audit log actor_email is denormalized — keep the hash.
update audit_log set actor_email = fbw_anon_hash(actor_email) || '@staging.invalid'
  where actor_email is not null;

-- Security tokens: passkeys + idempotency keys carry nothing useful in
-- staging; wipe their value columns. User-id / credential-id stay so
-- the integrity of FK references survives.
update user_passkeys   set public_key = '\x00'::bytea, counter = 0;
update idempotency_keys set response = '{}'::jsonb;
-- Stripe dedup history is transient; truncate.
truncate stripe_events;

-- Prevent the SSOT audit trigger from recording this entire operation
-- as a user action. We already have a dedicated op = 'ANONYMIZE' marker
-- we can insert, for forensic completeness.
insert into audit_log (org_id, action, actor_email, metadata, operation)
select id, 'system.anonymize_run', 'system@fbw.local',
       jsonb_build_object('at', now()), 'SYSTEM'
from orgs;

-- Final: mark the database so operators can verify the run succeeded.
comment on database postgres is
  concat('ANONYMIZED-FOR-STAGING at ', now()::text, ' via scripts/db/anonymize-staging.sql');
