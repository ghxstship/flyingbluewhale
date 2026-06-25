import { z } from "zod";

// BCP-47 shape: 2–3 char primary tag, optional 4-char script, optional region
// (2-char alpha or 3-digit). Mirrors the DB check constraint added in
// 20260504000005_locale_preferences.sql so a save can't pass the form yet
// fail at the row write.
export const BCP47 = /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2}|-[0-9]{3})?$/;

/**
 * Server-persisted slice of `user_preferences` edited by the /me/preferences
 * form. Extracted from the `"use server"` action so it can be unit-tested
 * directly (a `"use server"` module may only export async functions).
 *
 * `theme` is intentionally absent. It is the **skin slug**
 * (src/app/theme/themes.config.ts#ThemeSlug + the "system" sentinel) — and the
 * canonical platform ships exactly one skin (`atlvs-product`), so there is no
 * skin to choose. The user-facing appearance control is COLOR MODE
 * (light/dark/system) — the orthogonal `data-mode` axis, client-managed via
 * ThemeProvider (cookie/localStorage) and surfaced by <ThemeToggle>, NOT this
 * column.
 *
 * The two vocabularies used to disagree: the form rendered a light/dark/system
 * radio under name="theme" while the action validated `theme` as the skin slug
 * (`atlvs-product`/`system`). A user whose stored skin was `atlvs-product` got
 * no radio checked, so `theme` was omitted from the FormData, the skin-slug
 * enum rejected the absent value, and the ENTIRE save
 * (density/locale/timezone/consent) failed zod silently — their locale and
 * timezone edits never persisted. Dropping `theme` from the form and the
 * schema removes the disagreement at the root; the action leaves the stored
 * skin untouched.
 */
export const PreferencesSchema = z.object({
  density: z.enum(["compact", "cozy", "spacious"]),
  locale: z.string().regex(BCP47, "Use a BCP-47 tag like 'en' or 'fr-CA'"),
  timezone: z.string().min(1).max(64),
  analytics: z.string().optional(), // "on" if checkbox checked
  marketing: z.string().optional(),
});

export type PreferencesInput = z.infer<typeof PreferencesSchema>;
