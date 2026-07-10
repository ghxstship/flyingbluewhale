import "server-only";
import { unstable_cache } from "next/cache";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { MetricValues } from "../registry";
import type { ResolverCtx, ResolverMap } from "./types";
import { NOT_COMPUTED } from "./types";
import { atlvsResolvers } from "./atlvs";
import { compvssResolvers } from "./compvss";
import { gvtewayResolvers } from "./gvteway";
import { legendResolvers } from "./legend";

/**
 * Metric value runner. Resolves a set of metric ids to real org-scoped values
 * (kit v6.3 Reports engine). Each app contributes a ResolverMap; ids with no
 * resolver — or whose source data is absent — come back `{ value: null }` and
 * render as "—". Per-metric failures are isolated (never fail the whole report).
 */
const ALL_RESOLVERS: ResolverMap = {
  ...atlvsResolvers,
  ...compvssResolvers,
  ...gvtewayResolvers,
  ...legendResolvers,
};

/** Every metric id with a registered resolver entry (incl. honest null stubs). */
export function registeredMetricIds(): string[] {
  return Object.keys(ALL_RESOLVERS);
}

/**
 * Metric ids the platform actually computes — excludes the NOT_COMPUTED
 * sentinel stubs so the `/metrics` `computed` flag never overstates coverage
 * (plumb-line RPT-1).
 */
export function supportedMetricIds(): string[] {
  return Object.keys(ALL_RESOLVERS).filter((id) => ALL_RESOLVERS[id] !== NOT_COMPUTED);
}

/**
 * Compute the requested metrics live against `db`. The uncached worker behind
 * `resolveMetrics`. Each resolver is org-scoped and isolated (a throw → null).
 */
async function computeMetrics(db: ResolverCtx["db"], orgId: string, ids: string[]): Promise<MetricValues> {
  const ctx: ResolverCtx = { db, orgId };
  const out: MetricValues = {};
  await Promise.all(
    ids.map(async (id) => {
      const fn = ALL_RESOLVERS[id];
      if (!fn) {
        out[id] = { value: null };
        return;
      }
      try {
        out[id] = { value: await fn(ctx) };
      } catch (err) {
        // Isolate per-metric failures (never fail the whole report) but log
        // them — a silent null is indistinguishable from honestly-absent data,
        // which would hide a genuinely broken resolver from observability.
        console.error(`[reports] metric "${id}" resolver threw:`, err);
        out[id] = { value: null };
      }
    }),
  );
  return out;
}

/**
 * Resolve a set of metric ids to org-scoped values (kit v6.3 Reports engine).
 *
 * Read-mostly aggregate: a report view can fan out to ~8 live metric queries,
 * and the values move slowly. We memoize the computed values with
 * `unstable_cache` for 60s, keyed by org + the exact metric set and tagged
 * per-org so a future mutation can targeted-revalidate (`reports:metrics:<org>`).
 *
 * Why this is correctness-safe:
 *  - Every resolver filters by `org_id` explicitly, so the data is org-aggregate,
 *    NEVER per-user — an org-scoped cache key cannot leak one user's data to
 *    another. (No metric reads `auth.uid()`-scoped rows.)
 *  - Inside `unstable_cache` we must NOT read cookies/headers, so we use the
 *    cookie-free service client (the org filter is the boundary). The page
 *    already authorized the caller's org via `requireSession()` before getting
 *    here. When the service key is absent (local dev), we fall back to the
 *    authed client uncached so RLS still gates and nothing breaks.
 *  - Output is plain `{ [id]: { value: number|null } }` — fully serializable.
 */
export async function resolveMetrics(orgId: string, ids: string[]): Promise<MetricValues> {
  // Stable cache key regardless of the ids' order.
  const sortedIds = [...ids].sort();

  if (!isServiceClientAvailable()) {
    // No service key (e.g. local dev / preview without SUPABASE_SERVICE_ROLE_KEY):
    // compute uncached through the request-scoped authed client so RLS applies.
    const db = await createClient();
    return computeMetrics(db, orgId, sortedIds);
  }

  const cached = unstable_cache(
    async () => {
      // Same createServerClient<Database> shape as the request client — no cast needed (HP-16).
      const db = createServiceClient();
      return computeMetrics(db, orgId, sortedIds);
    },
    ["reports", "metrics", orgId, sortedIds.join(",")],
    { revalidate: 60, tags: [`reports:metrics:${orgId}`] },
  );
  return cached();
}
