import { z } from "zod";

/**
 * COI (Certificate of Insurance) structured extract — Opportunity #10.
 * Accepts the minimum producers ask for at vendor intake; everything
 * else is optional.
 */

export const CoiSchema = z.object({
  insured: z.object({
    name: z.string(),
    address: z.string().optional(),
  }),
  carrier: z.string(),
  policy_number: z.string(),
  effective_date: z.string(),  // ISO yyyy-mm-dd
  expiry_date: z.string(),     // ISO yyyy-mm-dd
  coverages: z
    .array(
      z.object({
        kind: z.string(),        // "general_liability", "auto", "umbrella", "workers_comp"
        limit: z.string(),       // human-readable, e.g. "$1,000,000 per occurrence"
      }),
    )
    .default([]),
  additional_insured: z.array(z.string()).default([]),
});

export type CoiData = z.infer<typeof CoiSchema>;
