"use server";

import { revalidatePath } from "next/cache";
import { getSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SOFT_DELETABLE_TABLES } from "@/lib/db/resource";
import type { LooseSupabase } from "@/lib/supabase/loose";

export type RestoreState = { error?: string } | null;

/**
 * REC-14 — undo for soft-deletes. Clears `deleted_at` on a single row of a
 * soft-deletable table, scoped to the caller's org. Backs the "Undo" toast
 * action that <DeleteForm> fires after a successful soft-delete.
 *
 * Guards:
 *  - `table` must be in SOFT_DELETABLE_TABLES (no arbitrary table writes).
 *  - Caller must have an org session and be manager-plus — the same band
 *    that is allowed to delete in the first place.
 *  - The update is double-scoped by (id, org_id); RLS provides the
 *    defense-in-depth layer underneath.
 *
 * `revalidate` is an optional console path to revalidate after the restore
 * (usually the list page the user landed on) so the row reappears without
 * a hard refresh.
 */
export async function restoreOrgScoped(table: string, id: string, revalidate?: string): Promise<RestoreState> {
  const session = await getSession();
  if (!session || !session.orgId) return { error: "Sign in to restore records" };
  if (!isManagerPlus(session)) return { error: "Only manager+ can restore records" };
  if (!SOFT_DELETABLE_TABLES.has(table)) return { error: "This record type cannot be restored" };
  if (!id) return { error: "Missing record id" };

  const supabase = await createClient();
  // Dynamic table name → typed client's `from()` collapses to `never`;
  // LooseSupabase is the centralized escape hatch for this exact pattern.
  const { error } = await (supabase as unknown as LooseSupabase)
    .from(table)
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .not("deleted_at", "is", null);
  if (error) return { error: `Could not restore: ${error.message}` };

  if (revalidate && revalidate.startsWith("/console")) revalidatePath(revalidate);
  return null;
}
