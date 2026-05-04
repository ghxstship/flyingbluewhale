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

type DeepRecord = { [k: string]: string | DeepRecord };

function deepMerge(base: DeepRecord, overlay: DeepRecord): DeepRecord {
  const out: DeepRecord = { ...base };
  for (const k of Object.keys(overlay)) {
    const b = base[k];
    const o = overlay[k];
    if (o && typeof o === "object" && b && typeof b === "object") {
      out[k] = deepMerge(b as DeepRecord, o as DeepRecord);
    } else {
      out[k] = o;
    }
  }
  return out;
}

/**
 * Load message catalog for a locale, falling back to English for any missing
 * key. Locale catalogs are overlays — they only need to declare overrides;
 * untranslated keys silently inherit the English string instead of surfacing
 * the dot-path. Partial coverage is therefore safe to ship.
 */
export async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  const baseMod = (await import(`@/messages/${DEFAULT_LOCALE}.json`)) as { default: DeepRecord };
  const base = baseMod.default;
  if (locale === DEFAULT_LOCALE) return base;
  try {
    const overlayMod = (await import(`@/messages/${locale}.json`)) as { default: DeepRecord };
    return deepMerge(base, overlayMod.default);
  } catch {
    return base;
  }
}
