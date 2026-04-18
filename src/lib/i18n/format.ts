/**
 * Locale-aware formatters. Use these everywhere — never call toLocaleString
 * or hardcode `$` in app code.
 */

import { DEFAULT_CURRENCY, DEFAULT_LOCALE, DEFAULT_TIMEZONE, type Locale } from "./config";

type FormatterOpts = { locale?: Locale; timezone?: string };

/** Amount is in minor units (cents). Converts to major and formats with currency. */
export function formatMoney(
  cents: number | null | undefined,
  opts: FormatterOpts & { currency?: string; fractionDigits?: number } = {},
): string {
  if (cents == null || Number.isNaN(cents)) return "";
  const locale = opts.locale ?? DEFAULT_LOCALE;
  const currency = (opts.currency ?? DEFAULT_CURRENCY).toUpperCase();
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: opts.fractionDigits ?? 2,
    maximumFractionDigits: opts.fractionDigits ?? 2,
  }).format(cents / 100);
}

export function formatNumber(
  n: number | null | undefined,
  opts: FormatterOpts & { style?: "decimal" | "percent" | "unit"; maximumFractionDigits?: number; unit?: string } = {},
): string {
  if (n == null || Number.isNaN(n)) return "";
  const locale = opts.locale ?? DEFAULT_LOCALE;
  return new Intl.NumberFormat(locale, {
    style: opts.style ?? "decimal",
    maximumFractionDigits: opts.maximumFractionDigits ?? 2,
    ...(opts.unit ? { unit: opts.unit } : {}),
  }).format(n);
}

export function formatDate(
  date: Date | string | number | null | undefined,
  opts: FormatterOpts & {
    dateStyle?: "full" | "long" | "medium" | "short";
    timeStyle?: "full" | "long" | "medium" | "short";
  } = {},
): string {
  if (date == null) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const locale = opts.locale ?? DEFAULT_LOCALE;
  const timezone = opts.timezone ?? DEFAULT_TIMEZONE;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: opts.dateStyle ?? "medium",
    timeStyle: opts.timeStyle,
    timeZone: timezone,
  }).format(d);
}

export function formatDateTime(
  date: Date | string | number | null | undefined,
  opts: FormatterOpts = {},
): string {
  return formatDate(date, { ...opts, dateStyle: "medium", timeStyle: "short" });
}

/** "3 hours ago", "in 2 days", etc. */
export function formatRelative(
  date: Date | string | number | null | undefined,
  opts: FormatterOpts = {},
): string {
  if (date == null) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const locale = opts.locale ?? DEFAULT_LOCALE;
  const diffSeconds = (d.getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];
  for (const [unit, divisor] of units) {
    if (Math.abs(diffSeconds) >= divisor || unit === "second") {
      return rtf.format(Math.round(diffSeconds / divisor), unit);
    }
  }
  return "";
}

export function formatList(
  items: string[],
  opts: FormatterOpts & { type?: "conjunction" | "disjunction"; style?: "long" | "short" | "narrow" } = {},
): string {
  const locale = opts.locale ?? DEFAULT_LOCALE;
  return new Intl.ListFormat(locale, { type: opts.type ?? "conjunction", style: opts.style ?? "long" }).format(items);
}
