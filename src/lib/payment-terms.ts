/**
 * Canonical engagement payment terms — the single authoring site for the
 * default deposit / balance splits (feedback_payment_terms_default).
 *
 * TWO system defaults, by context:
 *  - BOOKING / engagement (marketplace talent offers + profiles): 60% deposit /
 *    40% balance on load-in. Mirrored by the Postgres column defaults
 *    `talent_offers.deposit_pct` / `talent_profiles.deposit_pct` (DEFAULT 60).
 *  - PROPOSAL (sales proposals → invoices): 50% deposit / 50% balance
 *    (ratified 2026-06-24).
 *
 * Resolution precedence (plumb-line DUP-1/DUP-6):
 *   per-instance value  →  org template default  →  system default.
 * Every form default, Zod schema default, document binding, and invoice seeder
 * MUST go through `resolveDepositPct()` / the exported constants instead of
 * re-hardcoding a literal. The org template default is stored on
 * `orgs.default_deposit_pct` / `orgs.default_balance_terms` and read via
 * `src/lib/payment-terms-server.ts` (`getOrgPaymentDefaults`). The per-instance
 * value lives on the record (e.g. `proposals.deposit_percent`).
 *
 * Pure + client-safe (no DB, no `server-only`) so client components can import
 * the constants and the resolver. The DB-backed org-template fetch is the
 * server companion file.
 */

/** Booking/engagement system default deposit % (marketplace offers/profiles). */
export const DEPOSIT_PCT_DEFAULT = 60;

/** Booking/engagement system default balance %. Derived — never re-author. */
export const BALANCE_PCT_DEFAULT = 100 - DEPOSIT_PCT_DEFAULT;

/** Proposal system default deposit % (sales proposals → invoices). */
export const PROPOSAL_DEPOSIT_PCT_DEFAULT = 50;

/** Proposal system default balance %. Derived — never re-author. */
export const PROPOSAL_BALANCE_PCT_DEFAULT = 100 - PROPOSAL_DEPOSIT_PCT_DEFAULT;

/** When the balance comes due. `load_in` = on load-in day. */
export const BALANCE_TERMS_DEFAULT = "load_in";

/** Human label for the deposit milestone (deposit due on signature). */
export const DEPOSIT_TERMS_LABEL_DEFAULT = "Due on contract signature";

/** Human label for the default balance milestone (BALANCE_TERMS_DEFAULT). */
export const BALANCE_TERMS_LABEL_DEFAULT = "Due on load-in";

/** Valid deposit-percentage range — shared by the clamp below AND the client
 * `<input min max>` attributes (HP-15: one home for the numbers, no
 * re-typed literals on either side). */
export const DEPOSIT_PCT_MIN = 0;
export const DEPOSIT_PCT_MAX = 100;

/** Clamp a user/template-supplied deposit percentage to a whole [0, 100]. */
export function clampDepositPct(pct: number | null | undefined): number | null {
  if (pct == null || Number.isNaN(Number(pct))) return null;
  return Math.min(DEPOSIT_PCT_MAX, Math.max(DEPOSIT_PCT_MIN, Math.round(Number(pct))));
}

/**
 * Resolve the effective deposit percentage, honoring the precedence
 * per-instance → org template → system default. `systemDefault` selects the
 * context default (booking vs proposal); defaults to the booking split.
 * Always returns a valid whole percentage in [0, 100].
 */
export function resolveDepositPct(
  instancePct?: number | null,
  orgTemplatePct?: number | null,
  systemDefault: number = DEPOSIT_PCT_DEFAULT,
): number {
  return clampDepositPct(instancePct) ?? clampDepositPct(orgTemplatePct) ?? systemDefault;
}

/** The balance percentage paired with a resolved deposit percentage. */
export function resolveBalancePct(
  instancePct?: number | null,
  orgTemplatePct?: number | null,
  systemDefault: number = DEPOSIT_PCT_DEFAULT,
): number {
  return 100 - resolveDepositPct(instancePct, orgTemplatePct, systemDefault);
}

/**
 * Resolve the effective balance-terms code, honoring the precedence
 * per-instance → org template → system default.
 */
export function resolveBalanceTerms(instanceTerms?: string | null, orgTemplateTerms?: string | null): string {
  return instanceTerms?.trim() || orgTemplateTerms?.trim() || BALANCE_TERMS_DEFAULT;
}
