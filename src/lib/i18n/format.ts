/**
 * Locale-aware formatters. Use these everywhere — never call toLocaleString
 * or hardcode `$` in app code.
 */

import { DEFAULT_CURRENCY, DEFAULT_LOCALE, DEFAULT_TIMEZONE, type Locale } from "./config";

type FormatterOpts = { locale?: Locale; timezone?: string };

const EMPTY = "—";

/**
 * Amount is in minor units (cents). Converts to major and formats with currency.
 * Accepts either an options object or a currency string as second arg for ergonomics.
 */
export function formatMoney(
  cents: number | null | undefined,
  optsOrCurrency: (FormatterOpts & { currency?: string; fractionDigits?: number }) | string | null | undefined = {},
): string {
  if (cents == null || Number.isNaN(cents)) return EMPTY;
  const opts: FormatterOpts & { currency?: string; fractionDigits?: number } =
    typeof optsOrCurrency === "string"
      ? { currency: optsOrCurrency }
      : optsOrCurrency ?? {};
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
  if (n == null || Number.isNaN(n)) return EMPTY;
  const locale = opts.locale ?? DEFAULT_LOCALE;
  return new Intl.NumberFormat(locale, {
    style: opts.style ?? "decimal",
    maximumFractionDigits: opts.maximumFractionDigits ?? 2,
    ...(opts.unit ? { unit: opts.unit } : {}),
  }).format(n);
}

type DateStyle = "full" | "long" | "medium" | "short";

/**
 * Format a date. Accepts either an options object or a dateStyle string.
 *   formatDate(d) → medium
 *   formatDate(d, "long") → long
 *   formatDate(d, { dateStyle: "long", locale: "es" })
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  optsOrStyle: (FormatterOpts & {
    dateStyle?: DateStyle;
    timeStyle?: DateStyle;
  }) | DateStyle | null | undefined = {},
): string {
  if (date == null) return EMPTY;
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return EMPTY;
  const opts: FormatterOpts & { dateStyle?: DateStyle; timeStyle?: DateStyle } =
    typeof optsOrStyle === "string"
      ? { dateStyle: optsOrStyle }
      : optsOrStyle ?? {};
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

/**
 * "3 hours ago", "in 2 days", etc. With `compact: true`, emits terse
 * English-only forms ("3h ago", "in 2d", "just now") for dense table cells.
 */
export function formatRelative(
  date: Date | string | number | null | undefined,
  opts: FormatterOpts & { compact?: boolean } = {},
): string {
  if (date == null) return EMPTY;
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return EMPTY;
  const diffSeconds = (d.getTime() - Date.now()) / 1000;

  if (opts.compact) {
    const abs = Math.abs(diffSeconds);
    const past = diffSeconds < 0;
    if (abs < 60) return "just now";
    const [value, suffix] =
      abs < 3600 ? [Math.round(abs / 60), "m"]
      : abs < 86400 ? [Math.round(abs / 3600), "h"]
      : abs < 2592000 ? [Math.round(abs / 86400), "d"]
      : abs < 31536000 ? [Math.round(abs / 2592000), "mo"]
      : [Math.round(abs / 31536000), "y"];
    return past ? `${value}${suffix} ago` : `in ${value}${suffix}`;
  }

  const locale = opts.locale ?? DEFAULT_LOCALE;
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
  return EMPTY;
}

export function formatList(
  items: string[],
  opts: FormatterOpts & { type?: "conjunction" | "disjunction"; style?: "long" | "short" | "narrow" } = {},
): string {
  const locale = opts.locale ?? DEFAULT_LOCALE;
  return new Intl.ListFormat(locale, { type: opts.type ?? "conjunction", style: opts.style ?? "long" }).format(items);
}
