/**
 * Canonical engagement payment terms — the single authoring site for the
 * "60% deposit / 40% balance on load-in" default (feedback_payment_terms_default).
 *
 * Every form default, Zod schema default, and document binding that needs the
 * default split MUST import from here instead of re-hardcoding `60` / `"load_in"`.
 * The Postgres columns `talent_offers.deposit_pct` / `talent_profiles.deposit_pct`
 * (DEFAULT 60) and `*.balance_terms` (DEFAULT 'load_in') are the storage-layer
 * MIRROR of these constants — keep them in lockstep if this default ever changes.
 */

/** Deposit percentage charged on signature (the rest is the balance). */
export const DEPOSIT_PCT_DEFAULT = 60;

/** Balance percentage due on the balance milestone. Derived — never re-author. */
export const BALANCE_PCT_DEFAULT = 100 - DEPOSIT_PCT_DEFAULT;

/** When the balance comes due. `load_in` = on load-in day. */
export const BALANCE_TERMS_DEFAULT = "load_in";
