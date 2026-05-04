import { createBrowserClient } from "@supabase/ssr";
import { env } from "../env";
import type { Database } from "./database.types";

/**
 * Browser Supabase client. On `*.lytehaus.tech` we set the cookie domain to
 * `.lytehaus.tech` so a session set on the apex (login) is visible to the
 * atlvs/gvteway/compvss subdomains.
 */
export function createClient() {
  const cookieOptions =
    typeof window !== "undefined" && window.location.hostname.endsWith("lytehaus.tech")
      ? { domain: ".lytehaus.tech" }
      : undefined;

  return createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    ...(cookieOptions ? { cookieOptions } : {}),
  });
}
