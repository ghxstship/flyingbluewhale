import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { env, hasSupabase } from "../env";
import type { Database } from "./database.types";

/**
 * Compute the cookie `domain` attribute for the current request so a session
 * minted on `atlvs.pro` is sent to `app.atlvs.pro` /
 * `gvteway.atlvs.pro` / `compvss.atlvs.pro`. Returns `undefined` for
 * localhost / lvh.me / vercel.app — those rely on host-only cookies (cookies
 * are still shared across `*.lvh.me` because the browser scopes them by
 * eTLD+1 when no domain is set).
 */
async function cookieDomainForRequest(): Promise<string | undefined> {
  try {
    const h = await headers();
    const host = (h.get("host") ?? "").split(":")[0]!.toLowerCase();
    if (host.endsWith("atlvs.pro")) return ".atlvs.pro";
    // Dev parity — `lvh.me` resolves to 127.0.0.1 and is the canonical local
    // dev host (per CLAUDE.md). Without a `.lvh.me` domain the session
    // cookie is host-only and doesn't follow from the apex (`lvh.me:3000`,
    // where /login lives) to the subdomains (`atlvs.lvh.me:3000` etc.,
    // where /auth/resolve redirects). Mirroring the prod cross-subdomain
    // behaviour locally lets e2e + manual testing exercise the real flow.
    if (host === "lvh.me" || host.endsWith(".lvh.me")) return ".lvh.me";
  } catch {
    // outside a request context (e.g. build-time prerender) — no domain.
  }
  return undefined;
}

export async function createClient() {
  if (!hasSupabase) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  const cookieStore = await cookies();
  const domain = await cookieDomainForRequest();
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, { ...options, ...(domain ? { domain } : {}) }),
          );
        } catch {
          // setAll from a Server Component is a no-op; middleware refreshes sessions.
        }
      },
    },
  });
}

export function createServiceClient() {
  if (!hasSupabase || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Service client requires SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    cookies: { getAll: () => [], setAll: () => {} },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * True iff the service-role client can be constructed in the current
 * environment. Use this to guard endpoints that need elevated privileges
 * (storage uploads, admin user mutations, telemetry writes) so a missing
 * env-var surfaces as 503 service_unavailable rather than 500 internal.
 */
export function isServiceClientAvailable(): boolean {
  return hasSupabase && Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
}
