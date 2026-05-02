import "server-only";

import { createClient } from "@/lib/supabase/server";
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
 * Tables that carry a `deleted_at` column for soft-delete. Kept in sync with
 * `supabase/migrations/20260417_000010_ssot_triggers.sql` §5 — the loop that
 * adds `deleted_at` to a fixed set of tables. Anything not in this set is
 * treated as hard-delete only and the soft-delete filter is skipped.
 */
export const SOFT_DELETABLE_TABLES: ReadonlySet<string> = new Set([
  "projects",
  "clients",
  "vendors",
  "invoices",
  "purchase_orders",
  "equipment",
  "proposals",
  "event_guides",
  "deliverables",
  "notifications",
  "email_templates",
  "webhook_endpoints",
  "stage_plots",
  "incidents",
]);

async function anyFrom(t: string) {
  const supabase = await createClient();
  return (supabase as unknown as { from: (t: string) => any }).from(t);
}

export async function listOrgScoped<T extends TableName>(
  table: T,
  orgId: string,
  opts: ListOpts = {},
): Promise<PublicTables[T]["Row"][]> {
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
  if (opts.limit) q = q.limit(opts.limit);
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

  // `count: "exact"` gives us the total population under current filters,
  // not just the page. `range` is inclusive on both ends.
  let q = (await anyFrom(table as string)).select("*", { count: "exact" }).eq("org_id", orgId);
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
