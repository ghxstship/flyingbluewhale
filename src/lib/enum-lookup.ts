import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Option } from "@/lib/enum-options";

/**
 * Server-only reader for the `ref_*` lookup tables. Options come back ordered by
 * `sort_order`. By default inactive rows are dropped (new-record forms), except
 * a code the record already holds (`ensure`) so editing an old record round-trips
 * and its (now-inactive) value stays selected. Pass `includeInactive` for filter
 * controls, where historical values must stay findable. See enum-options.ts.
 */

export type RefCategoryTable =
  | "ref_vendor_category"
  | "ref_expense_category"
  | "ref_budget_category"
  | "ref_certification_category"
  | "ref_onboarding_step_category";

type RefRow = { code: string; display_label: string; sort_order: number; is_active: boolean };

async function fetchLookupRows(table: RefCategoryTable): Promise<RefRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from(table)
    .select("code, display_label, sort_order, is_active")
    .order("sort_order", { ascending: true });
  return (data ?? []) as RefRow[];
}

export async function fetchLookupOptions(
  table: RefCategoryTable,
  opts: { includeInactive?: boolean; ensure?: string | null } = {},
): Promise<Option[]> {
  const rows = await fetchLookupRows(table);
  return rows
    .filter((r) => opts.includeInactive || r.is_active || r.code === opts.ensure)
    .map((r) => ({ value: r.code, label: r.is_active ? r.display_label : `${r.display_label} (inactive)` }));
}

/** `code → display_label` map (includes inactive) for rendering list columns
 *  and detail fields off the stored `*_code`. */
export async function fetchLookupLabelMap(table: RefCategoryTable): Promise<Record<string, string>> {
  const rows = await fetchLookupRows(table);
  return Object.fromEntries(rows.map((r) => [r.code, r.display_label]));
}
