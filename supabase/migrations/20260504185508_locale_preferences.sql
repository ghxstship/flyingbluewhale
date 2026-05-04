-- ============================================================================
-- i18n / l10n — locale, timezone, and currency preferences
-- ============================================================================
-- Closes the persistence loop behind language + region switching. The user-
-- level `locale` and `timezone` columns already exist on `user_preferences`
-- (see 20260417_000010_ssot_triggers.sql); this migration adds the missing
-- pieces:
--
--   * user_preferences.currency — ISO-4217 override (null = inherit org).
--                                 Same shape as `locale`/`timezone`; lives
--                                 alongside them so a single SELECT pulls
--                                 the full preference set.
--
--   * orgs.default_locale       — Fallback when a user has no preference.
--   * orgs.default_timezone     — Used everywhere a "the org's clock"
--                                 context applies (load-in dates, schedules
--                                 rendered to anonymous portal viewers).
--   * orgs.default_currency     — Default currency for new invoices /
--                                 proposals / line items.
--
-- Validation: locale matches the IANA Language Subtag Registry shape (2–3
-- letter primary tag, optional 4-letter script, optional region). Timezones
-- are not constrained at the DB layer — Postgres exposes the IANA list via
-- pg_timezone_names but constraining to it would require a sync contract;
-- the client validates on write.
--
-- Backfill: orgs default to ('en', 'UTC', 'USD') matching the in-app
-- DEFAULT_LOCALE / DEFAULT_TIMEZONE / DEFAULT_CURRENCY in
-- src/lib/i18n/config.ts. Safe under RLS — these are non-secret prefs.

alter table user_preferences
  add column if not exists currency text
    check (currency is null or currency ~ '^[A-Z]{3}$');

-- Tighten the existing locale column with a BCP-47 shape check. Existing
-- rows default to 'en' which already passes; new rows are validated.
alter table user_preferences
  drop constraint if exists user_preferences_locale_shape_check;
alter table user_preferences
  add constraint user_preferences_locale_shape_check
  check (locale is null or locale ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2}|-[0-9]{3})?$');

alter table orgs
  add column if not exists default_locale text not null default 'en'
    check (default_locale ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2}|-[0-9]{3})?$'),
  add column if not exists default_timezone text not null default 'UTC'
    check (char_length(default_timezone) between 1 and 64),
  add column if not exists default_currency text not null default 'USD'
    check (default_currency ~ '^[A-Z]{3}$');

-- Resolver used via RPC when the SDK can't easily compose the chain. Mirrors
-- the resolveLocale() ladder in src/lib/i18n/config.ts: user preference →
-- first-membership org default → hardcoded baseline.
create or replace function effective_user_locale_settings()
returns table (
  locale text,
  timezone text,
  currency text
)
language sql stable security definer set search_path = public as $$
  with u as (
    select locale, timezone, currency
    from user_preferences where user_id = auth.uid()
  ),
  o as (
    select default_locale, default_timezone, default_currency
    from orgs
    where id in (select org_id from memberships where user_id = auth.uid())
    order by created_at asc
    limit 1
  )
  select
    coalesce((select locale from u),   (select default_locale from o),   'en')   as locale,
    coalesce((select timezone from u), (select default_timezone from o), 'UTC')  as timezone,
    coalesce((select currency from u), (select default_currency from o), 'USD')  as currency;
$$;

grant execute on function effective_user_locale_settings() to authenticated;

comment on column user_preferences.currency is 'ISO-4217 currency override (null = inherit org default).';
comment on column orgs.default_locale is 'Org-wide default BCP-47 language tag.';
comment on column orgs.default_timezone is 'Org-wide default IANA timezone.';
comment on column orgs.default_currency is 'Org-wide default ISO-4217 currency for billing artifacts.';
