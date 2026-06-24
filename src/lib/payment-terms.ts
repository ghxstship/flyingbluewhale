/**
 * Canonical engagement payment terms — the single authoring site for the
 * default deposit / balance split (feedback_payment_terms_default).
 *
 * Resolution precedence (plumb-line DUP-1/DUP-6, ratified 2026-06-24):
 *   per-instance value  →  org template default  →  system default (here).
 * Every form default, Zod schema default, document binding, and invoice seeder
 * that needs "the deposit %" or "the balance terms" MUST go through
 * `resolveDepositPct()` / `resolveBalanceTerms()` instead of re-hardcoding a
 * literal. The org template default is stored on `orgs.default_deposit_pct` /
 * `orgs.default_balance_terms` and read via `src/lib/payment-terms-server.ts`
 * (`getOrgPaymentDefaults`). The per-instance value lives on the record
 * (e.g. `proposals.deposit_percent`).
 *
 * This module is pure + client-safe (no DB, no `server-only`) so client
 * components — e.g. the proposal block renderer — can import the labels and the
 * resolver. The DB-backed org-template fetch is the server companion file.
 */

/** System default deposit percentage charged on signature (50/50 split). */
export const DEPOSIT_PCT_DEFAULT = 50;

/** System default balance percentage. Derived — never re-author. */
export const BALANCE_PCT_DEFAULT = 100 - DEPOSIT_PCT_DEFAULT;

/** When the balance comes due. `load_in` = on load-in day. */
export const BALANCE_TERMS_DEFAULT = "load_in";

/** Human label for the deposit milestone (deposit due on signature). */
export const DEPOSIT_TERMS_LABEL_DEFAULT = "Due on contract signature";

/** Human label for the default balance milestone (BALANCE_TERMS_DEFAULT). */
export const BALANCE_TERMS_LABEL_DEFAULT = "Due on load-in";

/** Clamp a user/template-supplied deposit percentage to a whole [0, 100]. */
export function clampDepositPct(pct: number | null | undefined): number | null {
  if (pct == null || Number.isNaN(Number(pct))) return null;
  return Math.min(100, Math.max(0, Math.round(Number(pct))));
}

/**
 * Resolve the effective deposit percentage, honoring the precedence
 * per-instance → org template → system default. Always returns a valid
 * whole percentage in [0, 100].
 */
export function resolveDepositPct(instancePct?: number | null, orgTemplatePct?: number | null): number {
  return clampDepositPct(instancePct) ?? clampDepositPct(orgTemplatePct) ?? DEPOSIT_PCT_DEFAULT;
}

/** The balance percentage paired with a resolved deposit percentage. */
export function resolveBalancePct(instancePct?: number | null, orgTemplatePct?: number | null): number {
  return 100 - resolveDepositPct(instancePct, orgTemplatePct);
}

/**
 * Resolve the effective balance-terms code, honoring the precedence
 * per-instance → org template → system default.
 */
export function resolveBalanceTerms(instanceTerms?: string | null, orgTemplateTerms?: string | null): string {
  return instanceTerms?.trim() || orgTemplateTerms?.trim() || BALANCE_TERMS_DEFAULT;
}
