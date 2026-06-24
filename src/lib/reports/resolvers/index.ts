import "server-only";
import { createClient } from "@/lib/supabase/server";
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

export async function resolveMetrics(orgId: string, ids: string[]): Promise<MetricValues> {
  const db = await createClient();
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
