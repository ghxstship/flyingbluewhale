/**
 * TS mirror of `public.slugify_role()` (migration 20260715142413) — the
 * catalog key normalizer. Case, separators and punctuation only, NEVER fuzzy:
 * "Stage Manager" and "Stage Manager - cosmicMEADOW" stay two roles, because
 * deciding they are one job is an operator's call and merging two roles
 * merges their permissions (ADR-0015).
 *
 * Kept byte-for-byte equivalent to the SQL: lowercase, every run of
 * non-[a-z0-9] becomes "-", runs collapse, ends trim. Non-ASCII letters are
 * treated as separators exactly like the SQL (no unaccent there either), so
 * "Café" slugs to "caf" on both sides of the wire.
 */
export function slugifyRole(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}
