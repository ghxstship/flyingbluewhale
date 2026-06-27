/**
 * Server-pagination helper — the canonical, reusable contract for
 * `searchParams`-driven list pages.
 *
 * The perf audit found ~90 `(platform)` list pages loading `limit: 500`
 * (some 1000, a few unbounded) and rendering every row inline — large
 * HTML payloads + heavy client hydration that degrade past a few hundred
 * rows. This module is the ONE place a page parses the `?page=` (1-based)
 * URL param into the `(from, to)` range that `listOrgScopedPage` /
 * `.range()` consume, and computes the page count for the `<PagerNav>`.
 *
 * Pattern (compose with existing filters/sort/search):
 *
 *   const sp = await searchParams;
 *   const { page, offset, pageSize } = parsePage(sp, 25);
 *   const result = await listOrgScopedPage("contracts", session.orgId, {
 *     orderBy: "created_at", ascending: false,
 *     pageSize, cursor: String(offset),
 *   });
 *   // …render rows…
 *   <PagerNav page={page} total={result.totalCount} pageSize={pageSize}
 *             searchParams={sp} basePath="/studio/legal/contracts" />
 *
 * `cursor` on `listOrgScopedPage` is an opaque offset string, so passing
 * `String(offset)` is the supported way to drive numbered pages off it.
 */

/** Default rows per page for converted list surfaces. */
export const DEFAULT_PAGE_SIZE = 25;

export type ParsedPage = {
  /** 1-based current page (>= 1). */
  page: number;
  /** Zero-based row offset for `.range(offset, …)` / cursor. */
  offset: number;
  /** Effective page size (clamped to [1, max]). */
  pageSize: number;
};

/**
 * Parse the `?page=` (1-based) param from a resolved `searchParams` object
 * into a clamped `{ page, offset, pageSize }`. Tolerant of garbage input
 * (non-numeric, negative, float) — always resolves to a valid page >= 1.
 */
export function parsePage(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  pageSize: number = DEFAULT_PAGE_SIZE,
  maxPageSize = 200,
): ParsedPage {
  const size = Math.min(Math.max(1, Math.floor(pageSize)), maxPageSize);
  const raw = searchParams?.["page"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  const page = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  return { page, offset: (page - 1) * size, pageSize: size };
}

/** Total number of pages for a population of `total` rows. Always >= 1. */
export function pageCount(total: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * Build an href for a target page that preserves every OTHER searchParam
 * (filters, sort, search) so pagination composes with them. Drops `page`
 * itself for page 1 to keep URLs clean.
 */
export function pageHref(
  basePath: string,
  page: number,
  searchParams: Record<string, string | string[] | undefined> | undefined,
): string {
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(searchParams ?? {})) {
    if (key === "page") continue;
    if (raw == null) continue;
    if (Array.isArray(raw)) {
      for (const v of raw) params.append(key, v);
    } else {
      params.set(key, raw);
    }
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
