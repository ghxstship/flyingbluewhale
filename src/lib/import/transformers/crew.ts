import "server-only";

import { z } from "zod";

/**
 * Crew member importer — Opportunity #7.
 *
 * Canonical CSV shape for importing an org-level crew roster. Columns
 * are case-insensitive (see `parseAndValidateCsv`'s `transformHeader`).
 *
 * `crew_members` is org-scoped (no project_id in the schema today —
 * crew are assigned to projects via a pivot elsewhere). day_rate_cents
 * accepts a raw integer in cents for strict round-trip with the DB.
 *
 * Exposed headers:
 *   name (required), role, phone, email, day_rate_cents, notes
 */

export const CrewRowSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  role: z.string().trim().max(120).optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().trim().max(64).optional().or(z.literal("").transform(() => undefined)),
  email: z.string().trim().email().optional().or(z.literal("").transform(() => undefined)),
  day_rate_cents: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? Number(v) : undefined))
    .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0), {
      message: "day_rate_cents must be a non-negative integer",
    }),
  notes: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
});

export type CrewRow = z.infer<typeof CrewRowSchema>;

export function dedupeKey(row: CrewRow): string {
  // Email is the strongest dedupe signal; fall back to (name, phone).
  return row.email ?? `${row.name}::${row.phone ?? ""}`.toLowerCase();
}
