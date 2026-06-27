import Link from "next/link";
import { pageCount as computePageCount, pageHref } from "@/lib/db/pagination";

/**
 * PagerNav — server-rendered numbered pager for `searchParams`-driven list
 * pages. The visual twin of the client {@link Pagination} component, but
 * navigates via `<Link href>` so the host page stays a server component
 * (no client island, no hydration cost) and pagination is shareable /
 * bookmarkable. Every link preserves the other searchParams (filters,
 * sort, search) so it composes with them.
 *
 * Renders nothing when there's only a single page.
 */
export type PagerNavProps = {
  /** 1-based current page. */
  page: number;
  /** Total population size under current filters. */
  total: number;
  pageSize: number;
  /** Path to link to (e.g. "/studio/legal/contracts"). */
  basePath: string;
  /** The resolved searchParams object — preserved across page links. */
  searchParams: Record<string, string | string[] | undefined> | undefined;
  /** Sibling pages shown on each side of the current page. */
  siblingCount?: number;
  className?: string;
  "aria-label"?: string;
};

const ELLIPSIS = "ellipsis" as const;
type PageToken = number | typeof ELLIPSIS;

function buildRange(page: number, count: number, siblingCount: number): PageToken[] {
  const totalNumbers = siblingCount * 2 + 5;
  if (count <= totalNumbers) return Array.from({ length: count }, (_, i) => i + 1);

  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, count);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < count - 1;

  const tokens: PageToken[] = [1];
  if (showLeftEllipsis) tokens.push(ELLIPSIS);
  else for (let p = 2; p < leftSibling; p++) tokens.push(p);
  for (let p = leftSibling; p <= rightSibling; p++) if (p !== 1 && p !== count) tokens.push(p);
  if (showRightEllipsis) tokens.push(ELLIPSIS);
  else for (let p = rightSibling + 1; p < count; p++) tokens.push(p);
  tokens.push(count);
  return tokens;
}

const ITEM_BASE =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-2 text-sm text-[var(--p-text-1)] transition-colors hover:bg-[var(--p-surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--p-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--p-bg)] focus-visible:outline-none";
const ITEM_DISABLED =
  "inline-flex h-8 min-w-8 cursor-default items-center justify-center rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-2 text-sm text-[var(--p-text-2)] opacity-50";
const ITEM_CURRENT =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-[var(--p-accent)] bg-[var(--p-accent)] px-2 text-sm font-semibold text-[var(--p-accent-contrast,white)]";

export function PagerNav({
  page,
  total,
  pageSize,
  basePath,
  searchParams,
  siblingCount = 1,
  className = "",
  "aria-label": ariaLabel = "Pagination",
}: PagerNavProps) {
  const count = computePageCount(total, pageSize);
  if (count <= 1) return null;
  const current = Math.min(Math.max(1, page), count);
  const tokens = buildRange(current, count, siblingCount);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  return (
    <nav aria-label={ariaLabel} className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <span className="font-mono text-xs text-[var(--p-text-2)] tabular-nums">
        {from}–{to} of {total}
      </span>
      <ul className="flex items-center gap-1">
        <li>
          {current > 1 ? (
            <Link href={pageHref(basePath, current - 1, searchParams)} className={`${ITEM_BASE} gap-1`} aria-label="Go to previous page" rel="prev">
              &larr;
            </Link>
          ) : (
            <span className={`${ITEM_DISABLED} gap-1`} aria-hidden="true">&larr;</span>
          )}
        </li>
        {tokens.map((tok, i) =>
          tok === ELLIPSIS ? (
            <li key={`e-${i}`}>
              <span className="inline-flex h-8 min-w-8 items-center justify-center px-1 text-sm text-[var(--p-text-2)]" aria-hidden="true">
                &hellip;
              </span>
            </li>
          ) : (
            <li key={tok}>
              {tok === current ? (
                <span className={ITEM_CURRENT} aria-current="page">
                  {tok}
                </span>
              ) : (
                <Link href={pageHref(basePath, tok, searchParams)} className={ITEM_BASE} aria-label={`Go to page ${tok}`}>
                  {tok}
                </Link>
              )}
            </li>
          ),
        )}
        <li>
          {current < count ? (
            <Link href={pageHref(basePath, current + 1, searchParams)} className={`${ITEM_BASE} gap-1`} aria-label="Go to next page" rel="next">
              &rarr;
            </Link>
          ) : (
            <span className={`${ITEM_DISABLED} gap-1`} aria-hidden="true">&rarr;</span>
          )}
        </li>
      </ul>
    </nav>
  );
}
