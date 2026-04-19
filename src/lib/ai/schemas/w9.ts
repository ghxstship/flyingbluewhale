import { z } from "zod";

/** IRS W-9 structured extract — Opportunity #10. */

export const W9Schema = z.object({
  legal_name: z.string(),
  business_name: z.string().optional(),
  tax_classification: z.enum([
    "individual_sole_proprietor",
    "c_corporation",
    "s_corporation",
    "partnership",
    "trust_estate",
    "llc",
    "other",
  ]),
  tin: z.string(),                          // SSN or EIN as typed
  tin_type: z.enum(["ssn", "ein"]),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
  }),
  signed_date: z.string().optional(),
  exempt_payee_codes: z.array(z.string()).optional(),
});

export type W9Data = z.infer<typeof W9Schema>;
