"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination — standalone, controlled pager. Renders prev/next + numbered
 * pages with ellipsis truncation around the current page, plus an optional
 * page-size selector. Pure presentation: the caller owns `page` state and
 * reacts to `onPageChange` / `onPageSizeChange`. Token-only colors; the
 * current page carries `aria-current="page"` and the focus ring reads
 * `--p-focus`.
 */
export type PaginationProps = {
  /** 1-based current page. */
  page: number;
  /** Total number of pages (>= 1). */
  pageCount: number;
  onPageChange: (page: number) => void;
  /** How many sibling pages to show on each side of the current page. */
  siblingCount?: number;
  /** When set, renders a page-size <select>. */
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
  "aria-label"?: string;
};

const ELLIPSIS = "ellipsis" as const;
type PageToken = number | typeof ELLIPSIS;

function buildRange(page: number, pageCount: number, siblingCount: number): PageToken[] {
  // First, last, current ± siblingCount, with ellipses to fill gaps.
  const totalNumbers = siblingCount * 2 + 5; // first + last + current + 2 ellipsis slots
  if (pageCount <= totalNumbers) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, pageCount);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < pageCount - 1;

  const tokens: PageToken[] = [];
  tokens.push(1);
  if (showLeftEllipsis) tokens.push(ELLIPSIS);
  else for (let p = 2; p < leftSibling; p++) tokens.push(p);

  for (let p = leftSibling; p <= rightSibling; p++) {
    if (p !== 1 && p !== pageCount) tokens.push(p);
  }

  if (showRightEllipsis) tokens.push(ELLIPSIS);
  else for (let p = rightSibling + 1; p < pageCount; p++) tokens.push(p);

  tokens.push(pageCount);
  return tokens;
}

const ITEM_BASE =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-2 text-sm text-[var(--p-text-1)] transition-colors hover:bg-[var(--p-surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--p-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--p-bg)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  className = "",
  "aria-label": ariaLabel = "Pagination",
}: PaginationProps) {
  const safeCount = Math.max(1, pageCount);
  const clamped = Math.min(Math.max(1, page), safeCount);
  const tokens = React.useMemo(() => buildRange(clamped, safeCount, siblingCount), [clamped, safeCount, siblingCount]);

  const go = (p: number) => {
    const next = Math.min(Math.max(1, p), safeCount);
    if (next !== clamped) onPageChange(next);
  };

  return (
    <nav aria-label={ariaLabel} className={`flex flex-wrap items-center gap-3 ${className}`}>
      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            className={`${ITEM_BASE} gap-1`}
            onClick={() => go(clamped - 1)}
            disabled={clamped <= 1}
            aria-label="Go to previous page"
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
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
              <button
                type="button"
                onClick={() => go(tok)}
                aria-current={tok === clamped ? "page" : undefined}
                aria-label={`Go to page ${tok}`}
                className={
                  tok === clamped
                    ? "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-[var(--p-accent)] bg-[var(--p-accent)] px-2 text-sm font-semibold text-[var(--p-accent-contrast,white)] focus-visible:ring-2 focus-visible:ring-[var(--p-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--p-bg)] focus-visible:outline-none"
                    : ITEM_BASE
                }
              >
                {tok}
              </button>
            </li>
          ),
        )}

        <li>
          <button
            type="button"
            className={`${ITEM_BASE} gap-1`}
            onClick={() => go(clamped + 1)}
            disabled={clamped >= safeCount}
            aria-label="Go to next page"
          >
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </li>
      </ul>

      {pageSize != null && onPageSizeChange && (
        <label className="ms-auto inline-flex items-center gap-2 text-xs text-[var(--p-text-2)]">
          <span className="font-medium">Per page</span>
          <select
            className="ps-input ps-input--sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}
    </nav>
  );
}
