import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { Database } from "@/lib/supabase/types";

type PublicTables = Database["public"]["Tables"];
type TableName = keyof PublicTables;

export type ListOpts = {
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  filters?: Array<{ column: string; op: "eq" | "in" | "gte" | "lte"; value: unknown }>;
  /** Include soft-deleted rows. Default false; set true for admin "Trash" views. */
  includeArchived?: boolean;
};

/**
 * Tables that carry a `deleted_at` column for soft-delete. Hand-maintained
 * to match the DB schema. The audit (docs/HARDENING_AUDIT.md §B
 * Multitenancy HIGH) found 69 tables in the DB with `deleted_at` but only
 * 14 in this allowlist — the missing 55 silently bypassed the soft-delete
 * filter in listOrgScoped/getOrgScoped, so soft-deleted rows surfaced in
 * list views.
 *
 * Sourced from:
 *   select table_name from information_schema.columns
 *    where column_name = 'deleted_at' and table_schema = 'public'
 *
 * RLS provides defense-in-depth: per-table SELECT policies should also
 * filter `deleted_at IS NULL`, but only 14 currently do — the remaining
 * 55 rely on this application-level filter as their only soft-delete
 * gate. Tightening RLS policies to add the filter is queued as a
 * separate ADR-scoped task.
 */
export const SOFT_DELETABLE_TABLES: ReadonlySet<string> = new Set([
  "accounting_connections",
  "agencies",
  "annotations",
  "announcements",
  "ap_invoice_extractions",
  "assignments",
  "bim_models",
  "chat_rooms",
  "client_dashboards",
  "clients",
  "contract_envelopes",
  "contracts",
  "cost_databases",
  "cost_forecasts",
  "courses",
  "deliverable_templates",
  "deliverables",
  "drawing_markups",
  "email_templates",
  "equipment",
  "estimates",
  "event_guides",
  "file_relations",
  "files",
  "incidents",
  "invoices",
  "job_postings",
  "lien_waivers",
  "master_catalog_items",
  "meetings",
  "memberships",
  "messages",
  "new_hire_flows",
  "notifications",
  "open_calls",
  "org_entities",
  "parties",
  "partner_integrations",
  "payroll_runs",
  "personal_documents",
  "pinboard_items",
  "pinboards",
  "places",
  "polls",
  "projects",
  "proposal_templates",
  "proposals",
  "purchase_orders",
  "reality_captures",
  "recognition_posts",
  "schedule_baselines",
  "sheet_sets",
  "site_plans",
  "siteplan_adjacency",
  "siteplan_band",
  "siteplan_placement",
  "siteplan_station",
  "siteplan_utility",
  "siteplan_zone_region",
  "spec_sections",
  "stage_plots",
  "submittal_review_chains",
  "subscriptions",
  "surveys",
  "takeoffs",
  "talent_profiles",
  "time_clock_zones",
  "time_off_policies",
  "tours",
  "transmittals",
  "ucm_comments",
  "users",
  "vendor_products",
  "vendors",
  "warranties",
  "webhook_endpoints",
]);

async function anyFrom(t: string) {
  const supabase = await createClient();
  // Dynamic table name → typed client's `from()` collapses to `never`.
  // LooseSupabase is the centralized escape hatch for this exact pattern.
  return (supabase as unknown as LooseSupabase).from(t);
}

export async function listOrgScoped<T extends TableName>(
  table: T,
  orgId: string,
  opts: ListOpts = {},
): Promise<PublicTables[T]["Row"][]> {
  // Empty orgId — guest / unscoped session. Return empty rather than letting
  // PostgREST submit `org_id=eq.` and crash with 22P02 invalid uuid syntax.
  if (!orgId) return [];
  let q = (await anyFrom(table as string)).select("*").eq("org_id", orgId);
  if (SOFT_DELETABLE_TABLES.has(table as string) && !opts.includeArchived) {
    q = q.is("deleted_at", null);
  }
  for (const f of opts.filters ?? []) {
    if (f.op === "eq") q = q.eq(f.column, f.value);
    else if (f.op === "in") q = q.in(f.column, f.value as unknown[]);
    else if (f.op === "gte") q = q.gte(f.column, f.value);
    else if (f.op === "lte") q = q.lte(f.column, f.value);
  }
  if (opts.orderBy) q = q.order(opts.orderBy, { ascending: opts.ascending ?? false });
  // P2 hardening — default limit of 100 if caller doesn't pass one.
  // The audit found 155 .select("*") sites that shipped unbounded
  // result sets; this is the centralized guard. Caller can pass
  // `limit: 10_000` to opt into bulk export, but the silent-load-the-
  // whole-table case is gone. Callers that genuinely want everything
  // can pass `limit: 0` (interpreted as "no cap").
  const effectiveLimit = opts.limit === 0 ? null : (opts.limit ?? 100);
  if (effectiveLimit !== null) q = q.limit(effectiveLimit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PublicTables[T]["Row"][];
}

export async function getOrgScoped<T extends TableName>(
  table: T,
  orgId: string,
  id: string,
  opts: { includeArchived?: boolean } = {},
): Promise<PublicTables[T]["Row"] | null> {
  if (!orgId || !id) return null;
  let q = (await anyFrom(table as string)).select("*").eq("org_id", orgId).eq("id", id);
  if (SOFT_DELETABLE_TABLES.has(table as string) && !opts.includeArchived) {
    q = q.is("deleted_at", null);
  }
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return (data ?? null) as PublicTables[T]["Row"] | null;
}

export async function countOrgScoped<T extends TableName>(
  table: T,
  orgId: string,
  opts: { includeArchived?: boolean } = {},
): Promise<number> {
  if (!orgId) return 0;
  let q = (await anyFrom(table as string)).select("*", { count: "exact", head: true }).eq("org_id", orgId);
  if (SOFT_DELETABLE_TABLES.has(table as string) && !opts.includeArchived) {
    q = q.is("deleted_at", null);
  }
  const { count } = await q;
  return count ?? 0;
}

/**
 * H2-04 / IK-015 — paginated list primitive.
 *
 * Cursor + limit + totalCount. `cursor` is the opaque offset that the
 * previous call returned as `nextCursor`; callers should treat it as a
 * black box. Default page size 50, max 200.
 *
 * Page route handlers MUST also set `X-Total-Count: <totalCount>` so
 * clients can read the total without parsing the body.
 */
export type PageOpts = Omit<ListOpts, "limit"> & {
  cursor?: string | null;
  pageSize?: number;
};

export type Page<T> = {
  rows: T[];
  nextCursor: string | null;
  totalCount: number;
  pageSize: number;
};

const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;

export function decodeCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  const n = Number(cursor);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function encodeCursor(offset: number): string {
  return String(offset);
}

export async function listOrgScopedPage<T extends TableName>(
  table: T,
  orgId: string,
  opts: PageOpts = {},
): Promise<Page<PublicTables[T]["Row"]>> {
  const pageSize = Math.min(Math.max(1, opts.pageSize ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const offset = decodeCursor(opts.cursor);
  if (!orgId) {
    return { rows: [], nextCursor: null, totalCount: 0, pageSize };
  }

  // `count: "exact"` gives us the total population under current filters,
  // not just the page. `range` is inclusive on both ends.
  let q = (await anyFrom(table as string)).select("*", { count: "exact" }).eq("org_id", orgId);
  // Soft-delete filter — same contract as listOrgScoped. This helper
  // shipped without it, so soft-deleted projects leaked through
  // /api/v1/projects while the unpaginated list correctly hid them.
  if (SOFT_DELETABLE_TABLES.has(table as string) && !opts.includeArchived) {
    q = q.is("deleted_at", null);
  }
  for (const f of opts.filters ?? []) {
    if (f.op === "eq") q = q.eq(f.column, f.value);
    else if (f.op === "in") q = q.in(f.column, f.value as unknown[]);
    else if (f.op === "gte") q = q.gte(f.column, f.value);
    else if (f.op === "lte") q = q.lte(f.column, f.value);
  }
  if (opts.orderBy) q = q.order(opts.orderBy, { ascending: opts.ascending ?? false });
  q = q.range(offset, offset + pageSize - 1);

  const { data, count, error } = await q;
  if (error) throw error;

  const rows = (data ?? []) as PublicTables[T]["Row"][];
  const totalCount = count ?? rows.length;
  const nextOffset = offset + rows.length;
  const nextCursor = nextOffset < totalCount && rows.length === pageSize ? encodeCursor(nextOffset) : null;

  return { rows, nextCursor, totalCount, pageSize };
}
