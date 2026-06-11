/**
 * Zod validator for the integer-cents string that `<MoneyInput>`
 * (src/components/ui/MoneyInput.tsx) submits via its hidden field.
 *
 * Companion to `moneyDollarsString` (src/lib/zod/money.ts), which
 * validates legacy dollar-string inputs that actions then run through
 * `dollarsToCents`. Finance forms now use MoneyInput, which converts
 * dollars → cents client-side, so the server must validate (and never
 * re-multiply) the cents value — mixing the two pipelines is the 100×
 * trap this module exists to prevent.
 */
import { z } from "zod";

const MAX_CENTS = 100_000_000 * 100; // $100M ceiling — mirrors moneyDollarsString

export type MoneyCentsOpts = {
  /** Allow blank string (optional money fields). Default false. */
  allowEmpty?: boolean;
  /** Allow zero. Default true; set false where $0 is meaningless. */
  allowZero?: boolean;
};

export function moneyCentsString(opts: MoneyCentsOpts = {}) {
  const { allowEmpty = false, allowZero = true } = opts;
  return z.string().superRefine((val, ctx) => {
    if (val === "" || val == null) {
      if (!allowEmpty) {
        ctx.addIssue({ code: "custom", message: "Amount is required" });
      }
      return;
    }
    if (!/^\d+$/.test(val)) {
      ctx.addIssue({ code: "custom", message: "Amount must be a positive number" });
      return;
    }
    const n = Number(val);
    if (!allowZero && n === 0) {
      ctx.addIssue({ code: "custom", message: "Amount must be greater than zero" });
      return;
    }
    if (n > MAX_CENTS) {
      ctx.addIssue({ code: "custom", message: `Amount exceeds maximum (${MAX_CENTS / 100})` });
      return;
    }
  });
}

/** Parse a validated cents string to integer cents — blank → null. */
export function centsOrNull(val: string | undefined | null): number | null {
  return val ? Number(val) : null;
}
