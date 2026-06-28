import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolveEntitledApps, reachableApps } from "@/lib/entitlements";

/**
 * `GET /v1/me/entitlements` — the SSOT feed for the global App Rail.
 *
 * Returns the apps the session user can reach with their access level:
 *   { apps: [{ id, access }] }   access ∈ "full" | "ro"
 *
 * This is the contract's `entitlementsSource` (see `src/lib/entitlements.ts`
 * and the vendored `entitlements.json`). The rail NEVER hardcodes the list —
 * it reads it from here (with the typed catalog as the design-time fallback).
 * Only live + reachable apps are returned; coming-soon extensions are omitted.
 */
export async function GET() {
  return withAuth(async (session) => {
    const supabase = await createClient();

    // Portal footing: any project_members row (RLS-scoped) unlocks GVTEWAY.
    let hasPortal = false;
    try {
      const { count } = await supabase
        .from("project_members")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", session.userId);
      hasPortal = (count ?? 0) > 0;
    } catch {
      // Missing column / blip — fall through to role heuristics in the resolver.
    }

    const resolved = resolveEntitledApps({
      role: session.role,
      persona: session.persona,
      isDeveloper: session.isDeveloper,
      hasPortal,
    });

    if (!resolved.length) return apiError("internal", "entitlement resolution failed");

    return apiOk({
      apps: reachableApps(resolved).map((a) => ({ id: a.id, access: a.access })),
    });
  });
}
