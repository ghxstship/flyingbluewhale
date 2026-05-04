import "server-only";

import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { DEFAULT_CURRENCY, DEFAULT_LOCALE, DEFAULT_TIMEZONE, isSupportedLocale, type Locale } from "./config";
import {
  formatDate,
  formatDateParts,
  formatDateTime,
  formatList,
  formatMoney,
  formatNumber,
  formatRelative,
  formatTime,
} from "./format";
import { getRequestLocale, getRequestTimezone, loadMessages } from "./server";
import { makeT, type Messages } from "./t";

/**
 * Resolved per-request locale settings. The single source of truth that
 * Server Components should consume — never call `Intl.*` directly with the
 * default-locale fallback baked in here.
 *
 * Resolution order, highest priority first:
 *   1. `users.preferred_locale` / `preferred_timezone` / `preferred_currency`
 *      from the DB for the authed caller.
 *   2. `orgs.default_locale` / `default_timezone` / `default_currency` for
 *      the caller's first-membership org.
 *   3. The `locale` / `timezone` cookies set by the marketing
 *      `LocaleSwitcher`.
 *   4. The `Accept-Language` header (locale only).
 *   5. The hardcoded baseline in `config.ts` (`en` / `UTC` / `USD`).
 */
export type RequestLocaleSettings = {
  locale: Locale;
  /** BCP-47 tag for `Intl.*` — same as `locale` for now; widens later. */
  bcp47: string;
  timezone: string;
  currency: string;
};

async function readUserPrefs(): Promise<{
  locale?: string | null;
  timezone?: string | null;
  currency?: string | null;
  orgDefaults?: { locale: string; timezone: string; currency: string } | null;
} | null> {
  if (!hasSupabase) return null;
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Pull the user's per-account override and the most-tenured membership's
    // org defaults in parallel — the resolver merges them downstream.
    //
    // `select("*")` instead of a narrowed projection so this works on
    // pre-migration databases (e.g. preview branches without
    // 20260504000005_locale_preferences.sql applied yet) — the `currency`
    // column on `user_preferences` and the `default_*` columns on `orgs`
    // are added by that migration; reading them by name fails on stale
    // schemas, but `select("*")` returns whatever exists.
    const [{ data: prefs }, { data: orgRow }] = await Promise.all([
      supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("memberships")
        .select("orgs:org_id(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    type PrefsRow = { locale?: string | null; timezone?: string | null; currency?: string | null };
    type OrgRow = { default_locale?: string; default_timezone?: string; default_currency?: string };
    const prefsRow = (prefs ?? null) as PrefsRow | null;
    // The relation lookup returns `orgs` as either a row or an array (depends
    // on inferred multiplicity). Normalize to a single row.
    const rawOrg = (orgRow as { orgs?: OrgRow | OrgRow[] } | null)?.orgs;
    const org: OrgRow | null = Array.isArray(rawOrg) ? (rawOrg[0] ?? null) : (rawOrg ?? null);

    const orgDefaults =
      org?.default_locale && org?.default_timezone && org?.default_currency
        ? {
            locale: org.default_locale,
            timezone: org.default_timezone,
            currency: org.default_currency,
          }
        : null;
    return {
      locale: prefsRow?.locale ?? null,
      timezone: prefsRow?.timezone ?? null,
      currency: prefsRow?.currency ?? null,
      orgDefaults,
    };
  } catch {
    // Pre-migration deploys: silent fall-through to cookie-only.
    return null;
  }
}

export async function getRequestLocaleSettings(): Promise<RequestLocaleSettings> {
  const [cookieLocale, cookieTimezone, userPrefs] = await Promise.all([
    getRequestLocale(),
    getRequestTimezone(),
    readUserPrefs(),
  ]);
  // Priority chain: user override → cookie → org default → hardcoded baseline.
  const candidateLocale = userPrefs?.locale ?? userPrefs?.orgDefaults?.locale ?? null;
  const baseTag = candidateLocale ? candidateLocale.split("-")[0] : null;
  const locale: Locale = isSupportedLocale(baseTag) ? baseTag : cookieLocale;
  const bcp47 = candidateLocale ?? locale;
  const timezone = userPrefs?.timezone ?? userPrefs?.orgDefaults?.timezone ?? cookieTimezone ?? DEFAULT_TIMEZONE;
  const currency = userPrefs?.currency ?? userPrefs?.orgDefaults?.currency ?? DEFAULT_CURRENCY;
  return { locale, bcp47, timezone, currency };
}

/**
 * Pre-bound formatters that snapshot the request's locale/timezone/currency.
 * Server Components should prefer these to calling `formatDate(...)` /
 * `formatMoney(...)` directly so the user's preferences flow through.
 */
export type RequestFormatters = {
  date: (d: Date | string | number | null | undefined, style?: "full" | "long" | "medium" | "short") => string;
  dateTime: (d: Date | string | number | null | undefined) => string;
  /** Time-only `HH:MM` (or `HH:MM:SS` with `seconds: true`). */
  time: (d: Date | string | number | null | undefined, opts?: { seconds?: boolean }) => string;
  /** Free-form date/time output with raw `Intl.DateTimeFormatOptions`. */
  dateParts: (d: Date | string | number | null | undefined, options: Intl.DateTimeFormatOptions) => string;
  relative: (d: Date | string | number | null | undefined, opts?: { compact?: boolean }) => string;
  money: (cents: number | null | undefined, currencyOverride?: string) => string;
  number: (
    n: number | null | undefined,
    opts?: { maximumFractionDigits?: number; style?: "decimal" | "percent" },
  ) => string;
  list: (items: string[], type?: "conjunction" | "disjunction") => string;
  settings: RequestLocaleSettings;
};

export async function getRequestFormatters(): Promise<RequestFormatters> {
  const settings = await getRequestLocaleSettings();
  const { locale, timezone, currency } = settings;
  return {
    settings,
    date: (d, style) => formatDate(d, { locale, timezone, dateStyle: style ?? "medium" }),
    dateTime: (d) => formatDateTime(d, { locale, timezone }),
    time: (d, opts) => formatTime(d, { locale, timezone, ...opts }),
    dateParts: (d, options) => formatDateParts(d, options, { locale, timezone }),
    relative: (d, opts) => formatRelative(d, { locale, ...opts }),
    money: (cents, currencyOverride) => formatMoney(cents, { locale, currency: currencyOverride ?? currency }),
    number: (n, opts) => formatNumber(n, { locale, ...opts }),
    list: (items, type) => formatList(items, { locale, type }),
  };
}

/**
 * Load both the active-locale catalog and the English fallback, returning a
 * `t()` translator that walks locale → en → key path. Server Components and
 * server actions should pull strings via this — client components receive
 * pre-resolved strings as props or use the `useTranslations` hook backed by
 * the same catalogs.
 *
 * The active locale is sourced from `getRequestLocaleSettings()` (DB → cookie
 * → header → baseline) so the translator and the formatters agree on the
 * same locale within a single request — otherwise `<html lang>` and `t()`
 * could resolve to different languages on the same page.
 */
export async function getRequestT(): Promise<{
  t: ReturnType<typeof makeT>;
  locale: Locale;
  messages: Messages;
}> {
  const { locale } = await getRequestLocaleSettings();
  const [active, fallback] = await Promise.all([
    loadMessages(locale),
    locale === DEFAULT_LOCALE ? Promise.resolve({} as Messages) : loadMessages(DEFAULT_LOCALE),
  ]);
  const fallbacks = locale === DEFAULT_LOCALE ? [] : [fallback as Messages];
  return { t: makeT(active as Messages, fallbacks), locale, messages: active as Messages };
}
