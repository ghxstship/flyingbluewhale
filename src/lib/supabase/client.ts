import { createBrowserClient } from "@supabase/ssr";
import { env } from "../env";
import type { Database } from "./database.types";

/**
 * Browser Supabase client. On `*.flytehaus.live` we set the cookie domain to
 * `.flytehaus.live` so a session set on the apex (login) is visible to the
 * atlvs/gvteway/compvss subdomains.
 */
export function createClient() {
  const cookieOptions =
    typeof window !== "undefined" && window.location.hostname.endsWith("flytehaus.live")
      ? { domain: ".flytehaus.live" }
      : undefined;

  return createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    ...(cookieOptions ? { cookieOptions } : {}),
  });
}
