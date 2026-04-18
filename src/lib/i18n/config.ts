/**
 * Locale + timezone config — SSOT for every formatter.
 *
 * Strategy: non-routed locale today (single deploy at /), but every piece of
 * formatting routes through helpers here so flipping to /[locale] routing later
 * is a config change, not a rewrite.
 */

export const SUPPORTED_LOCALES = ["en", "es", "fr", "de", "pt", "ja", "ar"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_TIMEZONE = "UTC";

export const RTL_LOCALES: ReadonlySet<Locale> = new Set(["ar"]);

export function isSupportedLocale(x: string | null | undefined): x is Locale {
  return !!x && (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

/**
 * Pick a locale from the Accept-Language header, user preference cookie, or fall back.
 * `acceptLanguage` is the raw header string; `cookie` is a locale code from the cookie.
 */
export function resolveLocale(args: {
  cookie?: string | null;
  acceptLanguage?: string | null;
  userPreference?: string | null;
}): Locale {
  if (isSupportedLocale(args.userPreference)) return args.userPreference;
  if (isSupportedLocale(args.cookie)) return args.cookie;
  const fromHeader = parseAcceptLanguage(args.acceptLanguage ?? "");
  for (const tag of fromHeader) {
    const base = tag.toLowerCase().split("-")[0];
    if (isSupportedLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

function parseAcceptLanguage(header: string): string[] {
  return header
    .split(",")
    .map((part) => {
      const [tag, q = "q=1"] = part.trim().split(";");
      const quality = parseFloat(q.replace("q=", "")) || 1;
      return { tag, quality };
    })
    .sort((a, b) => b.quality - a.quality)
    .map((x) => x.tag);
}

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.has(locale);
}
