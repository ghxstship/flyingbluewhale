import "server-only";

import Papa from "papaparse";
import type { ZodSchema } from "zod";

/**
 * CSV import framework — Opportunity #7.
 *
 * Exports a pure parser + Zod validator that produces
 *   { valid: T[], invalid: Array<{ rowIdx: number; errors: string[] }> }
 * for a given raw CSV string. Actual DB writes happen in the target
 * route; this module stays framework-agnostic so it can run on the
 * worker (async jobs) or inline (small imports).
 *
 * Header-name mapping is case-insensitive and trims whitespace.
 */

export type ImportResult<T> = {
  valid: T[];
  invalid: Array<{ rowIdx: number; errors: string[]; raw: Record<string, string> }>;
  /** Total rows seen (including invalid). */
  rowCount: number;
};

export function parseAndValidateCsv<T>(raw: string, schema: ZodSchema<T>): ImportResult<T> {
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim().toLowerCase(),
    transform: (v: string) => v.trim(),
  });

  const valid: T[] = [];
  const invalid: ImportResult<T>["invalid"] = [];

  parsed.data.forEach((row, idx) => {
    const check = schema.safeParse(row);
    if (check.success) {
      valid.push(check.data);
    } else {
      invalid.push({
        rowIdx: idx + 2, // +2 accounts for header row + 1-based indexing humans use
        errors: check.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
        raw: row,
      });
    }
  });

  return { valid, invalid, rowCount: parsed.data.length };
}
