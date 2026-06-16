import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MetricValues } from "../registry";
import type { ResolverCtx, ResolverMap } from "./types";
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

export function supportedMetricIds(): string[] {
  return Object.keys(ALL_RESOLVERS);
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
      } catch {
        out[id] = { value: null };
      }
    }),
  );
  return out;
}
