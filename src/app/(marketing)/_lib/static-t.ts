import "server-only";

import { loadMessages } from "@/lib/i18n/server";
import { makeT, type Messages } from "@/lib/i18n/t";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

/**
 * E-15 (partial): a request-independent English translator for evergreen SEO
 * pages (compare / alternatives). `getRequestT()` resolves the locale through
 * cookies + an authed Supabase read on EVERY request — which both forces
 * dynamic rendering at the page level and adds an auth round trip + two DB
 * queries to anonymous traffic that overwhelmingly reads these pages in
 * English.
 *
 * Full static/ISR is still blocked above the page: the root layout reads
 * `headers()` (CSP nonce) and theme cookies, so the route stays
 * dynamically rendered — but swapping these pages onto the static translator
 * removes their per-request Supabase work today and makes them ISR-ready the
 * day the root layout goes nonce-less.
 */
export async function getStaticEnT() {
  const messages = (await loadMessages(DEFAULT_LOCALE)) as Messages;
  return { t: makeT(messages, []), locale: DEFAULT_LOCALE };
}
