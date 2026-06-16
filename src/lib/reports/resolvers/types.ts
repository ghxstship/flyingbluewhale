import type { createClient } from "@/lib/supabase/server";

/** Typed Supabase server client (folded the v6.2 doc tables in at the last regen). */
export type DB = Awaited<ReturnType<typeof createClient>>;

/** Everything a metric computation needs: the org-scoped typed client + org id. */
export type ResolverCtx = { db: DB; orgId: string };

/**
 * Compute one metric's current value from real org-scoped data. Return `null`
 * when the source data doesn't exist in this org (the engine renders "—") —
 * never fabricate a number. Throwing is also treated as null by the runner.
 */
export type MetricResolver = (ctx: ResolverCtx) => Promise<number | null>;

export type ResolverMap = Record<string, MetricResolver>;

/** Count rows for an org-scoped table with optional extra equality filters. */
export async function countWhere(
  ctx: ResolverCtx,
  table: string,
  filters: Record<string, string | number | boolean | null> = {},
): Promise<number | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = (ctx.db as any).from(table).select("*", { count: "exact", head: true }).eq("org_id", ctx.orgId);
  for (const [k, v] of Object.entries(filters)) q = v === null ? q.is(k, null) : q.eq(k, v);
  const { count, error } = await q;
  if (error) return null;
  return count ?? 0;
}
