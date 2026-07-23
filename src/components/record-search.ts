"use server";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * Org-scoped record search for async FK pickers (audit A-06).
 *
 * `/new` forms used to preload FK candidates through `listOrgScoped`, whose
 * silent 100-row cap made every row past the cap unselectable. This action
 * is the server half of `<RecordCombobox>`: it type-ahead-searches the
 * target table by display column, org-scoped, capped at a page of matches —
 * never a preloaded dump.
 *
 * Only tables in the allow-list below are searchable; the table name is
 * client-supplied, so the allow-list (not the caller) decides what queries
 * run. Soft-deletable tables exclude trashed rows.
 */

const SEARCHABLE = {
  clients: { column: "name", softDelete: true },
  parties: { column: "display_name", softDelete: true },
  projects: { column: "name", softDelete: true },
  vendors: { column: "name", softDelete: true },
} as const;

export type RecordSearchTable = keyof typeof SEARCHABLE;

export type RecordSearchResult = { value: string; label: string };

const PAGE = 20;

/** Escape PostgREST `ilike` wildcards in user input. */
function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export async function searchOrgRecords(table: RecordSearchTable, query: string): Promise<RecordSearchResult[]> {
  const cfg = SEARCHABLE[table];
  // Runtime guard — `table` crosses the client boundary, so the type alone
  // is not trustworthy.
  if (!cfg || !Object.prototype.hasOwnProperty.call(SEARCHABLE, table)) return [];
  const session = await requireSession();
  if (!session.orgId) return [];
  const supabase = await createClient();
  // Dynamic table name → typed client's `from()` collapses to `never`;
  // LooseSupabase is the centralized escape hatch for this exact pattern.
  let q = (supabase as unknown as LooseSupabase)
    .from(table)
    .select(`id, ${cfg.column}`)
    .eq("org_id", session.orgId);
  if (cfg.softDelete) q = q.is("deleted_at", null);
  const needle = query.trim();
  if (needle) q = q.ilike(cfg.column, `%${escapeLike(needle)}%`);
  const { data, error } = await q.order(cfg.column, { ascending: true }).limit(PAGE);
  if (error) return [];
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    value: String(r.id),
    label: String(r[cfg.column] ?? r.id),
  }));
}
