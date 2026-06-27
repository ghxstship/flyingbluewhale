import type { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

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

/**
 * Canonical "registered but not yet computed" resolver (plumb-line RPT-1).
 * A metric whose resolver IS this sentinel is honestly registered (so it shows
 * up in the catalog) but does not compute a real value — the `/metrics`
 * `computed` flag excludes it via identity comparison, so we never advertise a
 * pure null-stub as computed. Use this instead of an inline `async () => null`.
 */
export const NOT_COMPUTED: MetricResolver = async () => null;

/** Count rows for an org-scoped table with optional extra equality filters. */
export async function countWhere(
  ctx: ResolverCtx,
  table: string,
  filters: Record<string, string | number | boolean | null> = {},
): Promise<number | null> {
  // Dynamic table name → the typed client's `from()` collapses to `never`.
  // LooseSupabase is the centralized escape hatch for exactly this (RLS stays
  // the authz boundary). `.select()` returns the loose builder, so `q` infers
  // as the chainable builder without an explicit `any`.
  let q = (ctx.db as unknown as LooseSupabase)
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("org_id", ctx.orgId);
  for (const [k, v] of Object.entries(filters)) q = v === null ? q.is(k, null) : q.eq(k, v);
  const { count, error } = await q;
  if (error) return null;
  return count ?? 0;
}
