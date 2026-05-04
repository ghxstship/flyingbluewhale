import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type PublicTables = Database["public"]["Tables"];
type TableName = keyof PublicTables;

// Generic-table dispatch helper. The public Supabase typing dispatches `from`
// per-table-name overloads, so a generic `T extends TableName` collapses to
// `never` in the resulting builder. We model a narrow surface of the methods
// we actually call here, parameterised on the row type — no `any`, no
// per-call type assertions in the body.
type Filterable<R> = {
  eq: (column: string, value: unknown) => Filterable<R>;
  select: (cols?: string) => Filterable<R>;
  maybeSingle: () => Promise<{ data: R | null; error: { message: string } | null }>;
};
type GenericFromBuilder<R, U> = {
  update: (patch: U) => Filterable<R>;
  select: (cols?: string) => Filterable<R>;
};
type GenericClient = {
  from: <T extends TableName>(t: T) => GenericFromBuilder<PublicTables[T]["Row"], PublicTables[T]["Update"]>;
};

/**
 * Sea Trial FINDING-022 — optimistic concurrency control.
 *
 * Pre-fix every update server action did
 *   .from(table).update(patch).eq("id", id).eq("org_id", orgId)
 * which is last-write-wins. Two windows editing the same record at the
 * same time would silently clobber each other; the audit log captured
 * both writes but neither user knew their change had been overwritten.
 *
 * The new pattern:
 *   1. The edit page renders a hidden `_updated_at` field carrying the
 *      row's current `updated_at` token.
 *   2. The update action calls `updateOrgScopedWithCheck`, which adds
 *      `.eq("updated_at", expectedUpdatedAt)` to the patch and returns
 *      either the new row or a `staleRow` sentinel.
 *   3. The action surfaces a friendly "this was changed by someone
 *      else" error so the producer can review before retrying.
 *
 * The token uses `updated_at` rather than a version integer because every
 * SOFT_DELETABLE-tracked table already auto-bumps `updated_at` on update
 * via the SSOT `set_updated_at` trigger, so no schema changes were needed
 * to enable concurrency control across the existing entity surface.
 */

export type ConcurrencyResult<R> = { ok: true; row: R } | { ok: false; reason: "stale" | "not_found" };

export async function updateOrgScopedWithCheck<T extends TableName>(
  table: T,
  orgId: string,
  id: string,
  expectedUpdatedAt: string | null | undefined,
  patch: PublicTables[T]["Update"],
): Promise<ConcurrencyResult<PublicTables[T]["Row"]>> {
  if (!expectedUpdatedAt) {
    // Treat a missing token as "stale" rather than silently bypassing —
    // forces edit pages to render the hidden field.
    return { ok: false, reason: "stale" };
  }
  const supabase = (await createClient()) as unknown as GenericClient;
  const { data, error } = await supabase
    .from(table)
    .update(patch)
    .eq("org_id", orgId)
    .eq("id", id)
    .eq("updated_at", expectedUpdatedAt)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    // The row didn't match — either the id is wrong, the org doesn't own
    // it, or the updated_at token diverged. We can't tell which from one
    // query, so probe lightly to give the right message.
    const probe = await supabase.from(table).select("id").eq("org_id", orgId).eq("id", id).maybeSingle();
    return probe.data ? { ok: false, reason: "stale" } : { ok: false, reason: "not_found" };
  }
  return { ok: true, row: data };
}

/** Standardized message surfaced to the form's error alert. */
export const STALE_ROW_MESSAGE =
  "Someone else changed this record while you were editing. Reload the page to see their changes, then re-apply yours.";
