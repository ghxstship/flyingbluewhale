/**
 * Reusable Zod refinement: end ≥ start.
 *
 * Sea Trial R2 FINDING-018 surfaced backwards-time inputs accepted across
 * events, rentals, ceremonies, meetings, and projects. Each form had its
 * own start/end pair with no cross-field check. Centralizing the rule
 * here keeps the message consistent and prevents drift.
 *
 * Usage on a `z.object({ ... })` schema:
 *
 *   const Schema = z.object({
 *     starts_at: z.string().min(1),
 *     ends_at:   z.string().min(1),
 *   }).refine(...dateRangeRefine("starts_at", "ends_at"));
 *
 * For schemas where the dates are optional/blank-tolerated, the refine
 * is a no-op when either side is missing.
 */
export function dateRangeRefine<S extends string, E extends string>(
  startKey: S,
  endKey: E,
  message = "End must be on or after start",
): [(data: { [k: string]: unknown }) => boolean, { message: string; path: [E] }] {
  return [
    (data) => {
      const startRaw = data[startKey];
      const endRaw = data[endKey];
      // No-op when either field is missing/blank — caller's other rules
      // decide whether that's acceptable.
      if (typeof startRaw !== "string" || typeof endRaw !== "string") return true;
      if (!startRaw || !endRaw) return true;
      const start = Date.parse(startRaw);
      const end = Date.parse(endRaw);
      if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
      return end >= start;
    },
    { message, path: [endKey] },
  ];
}
