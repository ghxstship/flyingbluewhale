import "server-only";
import type { createClient } from "@/lib/supabase/server";

type DB = Awaited<ReturnType<typeof createClient>>;

export type OrgPaymentDefaults = {
  /** Org template default deposit %, or null when unset (→ system default). */
  depositPct: number | null;
  /** Org template default balance-terms code, or null when unset. */
  balanceTerms: string | null;
};

/**
 * Read an org's payment-terms template defaults (the "template" layer between a
 * per-instance value and the system default — see src/lib/payment-terms.ts).
 * NULLs mean "no template set"; pass them straight to resolveDepositPct /
 * resolveBalanceTerms, which fall back to the system default. Never throws — a
 * missing row yields all-null.
 */
export async function getOrgPaymentDefaults(db: DB, orgId: string): Promise<OrgPaymentDefaults> {
  const { data } = await db
    .from("orgs")
    .select("default_deposit_pct, default_balance_terms")
    .eq("id", orgId)
    .maybeSingle();
  return {
    depositPct: data?.default_deposit_pct ?? null,
    balanceTerms: data?.default_balance_terms ?? null,
  };
}
