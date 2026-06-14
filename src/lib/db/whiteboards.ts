import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { Whiteboard, WhiteboardListItem } from "@/lib/whiteboards";

/**
 * Server read helpers for the `whiteboards` table (F5).
 *
 * The table is not yet in `database.types.ts`, so it can't go through
 * `listOrgScoped` / `getOrgScoped` (those are keyed on the typed `Database`
 * table union). We use the LooseSupabase cast until the types are
 * regenerated post-apply. Reads are RLS-gated by the caller's cookie
 * session — Postgres decides visibility — but we still pass `org_id` +
 * `deleted_at IS NULL` for defense-in-depth and correct soft-delete.
 */

/** List active + archived boards for the org, newest-touched first. */
export async function listWhiteboards(orgId: string): Promise<WhiteboardListItem[]> {
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("whiteboards")
    .select("id, name, whiteboard_state, created_at, updated_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as WhiteboardListItem[];
}

/** Fetch one board (incl. snapshot) for the canvas. Returns null if absent. */
export async function getWhiteboard(orgId: string, id: string): Promise<Whiteboard | null> {
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("whiteboards")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Whiteboard | null) ?? null;
}
