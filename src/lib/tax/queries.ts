import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * Tax reference reads. The reference tables (jurisdictions / categories /
 * rates / withholding rules) are GLOBAL — no `org_id` — so `listOrgScoped`
 * doesn't fit. RLS still allows any authenticated read; we go through the
 * loose client for plain global selects.
 */

export type TaxJurisdiction = {
  id: string;
  code: string;
  display_name: string;
  parent_id: string | null;
  country: string | null;
  region: string | null;
  created_at: string;
};

export type TaxCategory = {
  code: string;
  display_name: string;
  description: string | null;
};

export type TaxRate = {
  id: string;
  jurisdiction_id: string;
  category_code: string;
  rate: number;
  effective_from: string | null;
  effective_to: string | null;
  source: string | null;
};

export type WithholdingRule = {
  id: string;
  jurisdiction_id: string;
  applies_to: string;
  rate: number;
  threshold_minor: number | null;
  threshold_currency: string | null;
  effective_from: string | null;
  effective_to: string | null;
};

async function loose(): Promise<LooseSupabase> {
  const supabase = await createClient();
  return supabase as unknown as LooseSupabase;
}

export async function listTaxJurisdictions(): Promise<TaxJurisdiction[]> {
  const db = await loose();
  const { data, error } = await db
    .from("tax_jurisdictions")
    .select("id, code, display_name, parent_id, country, region, created_at")
    .order("country", { ascending: true })
    .order("code", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TaxJurisdiction[];
}

export async function listTaxRates(): Promise<TaxRate[]> {
  const db = await loose();
  const { data, error } = await db
    .from("tax_rates")
    .select("id, jurisdiction_id, category_code, rate, effective_from, effective_to, source")
    .order("effective_from", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TaxRate[];
}

export async function listWithholdingRules(): Promise<WithholdingRule[]> {
  const db = await loose();
  const { data, error } = await db
    .from("withholding_rules")
    .select(
      "id, jurisdiction_id, applies_to, rate, threshold_minor, threshold_currency, effective_from, effective_to",
    )
    .order("applies_to", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WithholdingRule[];
}

/** id → display_name lookup so rate/withholding tables can resolve jurisdiction names. */
export async function jurisdictionNameMap(): Promise<Map<string, string>> {
  const rows = await listTaxJurisdictions();
  return new Map(rows.map((r) => [r.id, r.display_name]));
}

/** code → display_name lookup for tax categories. */
export async function categoryNameMap(): Promise<Map<string, string>> {
  const db = await loose();
  const { data, error } = await db.from("tax_categories").select("code, display_name");
  if (error) throw error;
  const rows = (data ?? []) as Pick<TaxCategory, "code" | "display_name">[];
  return new Map(rows.map((r) => [r.code, r.display_name]));
}

/**
 * Render a numeric `rate` as a percent. The column stores a fraction
 * (e.g. 0.0825 → "8.25%") in the seeded data; if a row ever stores a
 * percent value (> 1, e.g. 8.25 → "8.25%") we pass it through unscaled.
 */
export function formatRatePercent(rate: number | null | undefined): string {
  if (rate == null || !Number.isFinite(rate)) return "—";
  return rate <= 1 ? `${(rate * 100).toFixed(2)}%` : `${rate.toFixed(2)}%`;
}

/** bigint minor units → display dollars string. */
export function formatMinorAsMoney(
  minor: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (minor == null || !Number.isFinite(minor)) return "—";
  return (minor / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency ?? "USD",
  });
}
