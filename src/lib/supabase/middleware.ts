import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env, hasSupabase } from "../env";
import type { Database } from "./database.types";

/**
 * Sets the cookie `domain` to `.flytehaus.live` so a session minted on the
 * apex (login) is sent to the atlvs/gvteway/compvss subdomains. Returns
 * `undefined` for localhost/lvh.me/vercel.app — host-only cookies there.
 */
function cookieDomainForHost(host: string): string | undefined {
  const bare = host.split(":")[0].toLowerCase();
  if (bare.endsWith("flytehaus.live")) return ".flytehaus.live";
  return undefined;
}

/**
 * Refresh the Supabase session cookie. When `rewriteUrl` is provided the
 * response is a `NextResponse.rewrite(...)` so the host-rewrite from proxy.ts
 * survives the cookie reset that @supabase/ssr does internally.
 */
export async function updateSession(request: NextRequest, rewriteUrl?: URL) {
  const buildResponse = () =>
    rewriteUrl ? NextResponse.rewrite(rewriteUrl, { request }) : NextResponse.next({ request });

  if (!hasSupabase) return buildResponse();

  const cookieDomain = cookieDomainForHost(request.headers.get("host") ?? "");
  let response = buildResponse();

  const supabase = createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = buildResponse();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, {
            ...options,
            ...(cookieDomain ? { domain: cookieDomain } : {}),
          }),
        );
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}
