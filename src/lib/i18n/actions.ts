"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { isSupportedLocale, type Locale } from "./config";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1y

/**
 * Persist the caller's locale + timezone + currency preference. Both writes
 * are idempotent and non-blocking from the caller's perspective:
 *
 *   1. Cookies update for anonymous + authed users alike. On production
 *      (`*.atlvs.pro`) we set `domain=.atlvs.pro` + `SameSite=Lax` so the
 *      preference propagates across atlvs/gvteway/compvss subdomains on
 *      the next navigation — same strategy as the Supabase session cookie
 *      and the guide-unlock cookie.
 *
 *   2. If the caller is authed, the same prefs are written to
 *      `user_preferences`, becoming the cross-device source of truth on
 *      next render via `readUserPrefs()` in `request.ts`.
 *
 * `revalidatePath('/')` re-renders every Server Component on the active
 * subdomain so `<html lang>`, `dir`, and every locale-aware formatter pick
 * up the new value without a full reload.
 */
export async function setLocalePreferences(input: {
  locale?: string | null;
  timezone?: string | null;
  currency?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const [cookieStore, hs] = await Promise.all([cookies(), headers()]);

  // Scope the cookie to the apex on prod so flipping language on one
  // subdomain (e.g. app.atlvs.pro) propagates to the others (gvteway./
  // compvss.) — matches the Supabase session and guide-unlock cookie
  // strategy. Local dev (lvh.me / localhost / vercel.app previews)
  // omits the attribute so the browser scopes to the exact host.
  const host = (hs.get("host") ?? "").split(":")[0]!.toLowerCase();
  const apexDomain = host.endsWith("atlvs.pro") ? ".atlvs.pro" : undefined;
  const cookieOpts = {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    ...(apexDomain ? { domain: apexDomain } : {}),
  };

  // The full BCP-47 tag goes to the cookie/db; the resolver in `config.ts`
  // narrows to the base 2-letter code via `resolveLocale`.
  const localeTag = input.locale ?? null;
  const baseLocale: Locale | null = localeTag ? (localeTag.split("-")[0] as Locale) : null;
  if (baseLocale && !isSupportedLocale(baseLocale)) {
    return { ok: false, error: "Unsupported locale" };
  }

  if (localeTag) cookieStore.set("locale", localeTag, cookieOpts);
  if (input.timezone) cookieStore.set("timezone", input.timezone, cookieOpts);
  if (input.currency) cookieStore.set("currency", input.currency, cookieOpts);

  if (hasSupabase) {
    try {
      const supabase = await createServerSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Persist to `user_preferences` — the existing SSOT for per-user UI
        // state (theme, density, locale, timezone, consent). Upsert handles
        // first-time switchers whose row may not yet exist.
        const upsert: {
          user_id: string;
          locale?: string | null;
          timezone?: string | null;
          currency?: string | null;
        } = { user_id: user.id };
        if (localeTag !== undefined) upsert.locale = localeTag;
        if (input.timezone !== undefined) upsert.timezone = input.timezone ?? null;
        if (input.currency !== undefined) upsert.currency = input.currency ?? null;
        if (Object.keys(upsert).length > 1) {
          await supabase.from("user_preferences").upsert(upsert, { onConflict: "user_id" });
        }
      }
    } catch {
      // Pre-migration: silent fall-through to cookie-only persistence.
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
