import "server-only";

import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE, resolveLocale, type Locale } from "./config";

/**
 * Server-side resolver: headers + cookie → active locale.
 * Single source of truth for which locale a Server Component renders in.
 */
export async function getRequestLocale(): Promise<Locale> {
  const hs = await headers();
  const cs = await cookies();
  const cookie = cs.get("locale")?.value;
  const acceptLanguage = hs.get("accept-language");
  return resolveLocale({ cookie, acceptLanguage });
}

export async function getRequestTimezone(): Promise<string> {
  const cs = await cookies();
  const tz = cs.get("timezone")?.value;
  return tz && typeof tz === "string" ? tz : DEFAULT_TIMEZONE;
}

export async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  try {
    // Dynamic import resolves at build time per bundled message file
    const mod = (await import(`@/messages/${locale}.json`)) as { default: Record<string, unknown> };
    return mod.default;
  } catch {
    if (locale !== DEFAULT_LOCALE) {
      const fallback = (await import(`@/messages/${DEFAULT_LOCALE}.json`)) as { default: Record<string, unknown> };
      return fallback.default;
    }
    return {};
  }
}
