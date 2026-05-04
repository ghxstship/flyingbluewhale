/**
 * Reusable Zod money validator — strings entered into form fields, parsed
 * to dollars-as-number, then rejected if non-numeric, negative, or
 * insanely large.
 *
 * Sea Trial R3 FINDING-019: prior pattern used `z.string().min(1)` and
 * `dollarsToCents` together. `dollarsToCents` silently coerces invalid
 * input to 0 and accepts negatives, so a typo of "-1000000" or "abc"
 * would slip through and either zero out the record or post a giant
 * negative amount to the books. This validator pushes the rejection up
 * to the schema layer where the user sees the error inline.
 *
 * Usage:
 *   amount: moneyDollarsString({ allowZero: false }),     // expenses, invoices
 *   amount: moneyDollarsString({ allowEmpty: true }),     // optional fields
 */
import { z } from "zod";

const MAX_DOLLARS = 100_000_000; // $100M ceiling — anything above is a typo

export type MoneyOpts = {
  /** Allow blank string (e.g. optional money fields). Default false. */
  allowEmpty?: boolean;
  /** Allow zero. Default true; set false where 0 is meaningless (an expense of $0). */
  allowZero?: boolean;
};

export function moneyDollarsString(opts: MoneyOpts = {}) {
  const { allowEmpty = false, allowZero = true } = opts;
  return z.string().superRefine((val, ctx) => {
    if (val === "" || val == null) {
      if (!allowEmpty) {
        ctx.addIssue({ code: "custom", message: "Amount is required" });
      }
      return;
    }
    const cleaned = val.replace(/[\s,_$]/g, "");
    const n = Number(cleaned);
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: "custom", message: "Amount must be a number" });
      return;
    }
    if (n < 0) {
      ctx.addIssue({ code: "custom", message: "Amount cannot be negative" });
      return;
    }
    if (!allowZero && n === 0) {
      ctx.addIssue({ code: "custom", message: "Amount must be greater than zero" });
      return;
    }
    if (n > MAX_DOLLARS) {
      ctx.addIssue({ code: "custom", message: `Amount exceeds maximum (${MAX_DOLLARS})` });
      return;
    }
  });
}
