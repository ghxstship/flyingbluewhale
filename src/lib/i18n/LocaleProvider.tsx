"use client";

/**
 * Client-side counterpart to `getRequestFormatters` in `request.ts`.
 *
 * The Server Component layout resolves the user's locale + timezone +
 * currency once per request and passes the snapshot down via this provider.
 * Client components reach the same formatters through `useFormatters()` and
 * the same translator through `useT()` — no need to thread a dozen props
 * through every nested component, no risk of an unbound `Intl.*` call
 * silently using the user agent's locale.
 *
 * The provider also exposes the active settings so client widgets (e.g. a
 * timezone picker, a currency override) can mutate them and call the
 * `setLocalePreferences` server action to persist.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  formatDate as fmtDate,
  formatDateParts as fmtDateParts,
  formatDateTime as fmtDateTime,
  formatList as fmtList,
  formatMoney as fmtMoney,
  formatNumber as fmtNumber,
  formatRelative as fmtRelative,
  formatTime as fmtTime,
} from "./format";
import { makeT, type Messages } from "./t";
import { DEFAULT_CURRENCY, DEFAULT_LOCALE, DEFAULT_TIMEZONE, type Locale } from "./config";

export type LocaleContextValue = {
  locale: Locale;
  bcp47: string;
  timezone: string;
  currency: string;
  messages: Messages;
  fallbackMessages: Messages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ value, children }: { value: LocaleContextValue; children: ReactNode }) {
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  // Permit usage outside the provider in legacy trees — the formatters fall
  // back to the hardcoded defaults rather than throwing. Once every shell
  // wraps its tree, this branch becomes unreachable but it removes a class
  // of "missing provider" runtime errors from the migration.
  return (
    ctx ?? {
      locale: DEFAULT_LOCALE,
      bcp47: DEFAULT_LOCALE,
      timezone: DEFAULT_TIMEZONE,
      currency: DEFAULT_CURRENCY,
      messages: {},
      fallbackMessages: {},
    }
  );
}

export function useLocale(): LocaleContextValue {
  return useLocaleContext();
}

export function useT() {
  const { messages, fallbackMessages } = useLocaleContext();
  return useMemo(
    () => makeT(messages as Messages, fallbackMessages ? [fallbackMessages as Messages] : []),
    [messages, fallbackMessages],
  );
}

export function useFormatters() {
  const { locale, timezone, currency } = useLocaleContext();
  return useMemo(
    () => ({
      date: (d: Date | string | number | null | undefined, style?: "full" | "long" | "medium" | "short") =>
        fmtDate(d, { locale, timezone, dateStyle: style ?? "medium" }),
      dateTime: (d: Date | string | number | null | undefined) => fmtDateTime(d, { locale, timezone }),
      time: (d: Date | string | number | null | undefined, opts?: { seconds?: boolean }) =>
        fmtTime(d, { locale, timezone, ...opts }),
      dateParts: (d: Date | string | number | null | undefined, options: Intl.DateTimeFormatOptions) =>
        fmtDateParts(d, options, { locale, timezone }),
      relative: (d: Date | string | number | null | undefined, opts?: { compact?: boolean }) =>
        fmtRelative(d, { locale, ...opts }),
      money: (cents: number | null | undefined, currencyOverride?: string) =>
        fmtMoney(cents, { locale, currency: currencyOverride ?? currency }),
      number: (
        n: number | null | undefined,
        opts?: { maximumFractionDigits?: number; style?: "decimal" | "percent" },
      ) => fmtNumber(n, { locale, ...opts }),
      list: (items: string[], type?: "conjunction" | "disjunction") => fmtList(items, { locale, type }),
    }),
    [locale, timezone, currency],
  );
}
