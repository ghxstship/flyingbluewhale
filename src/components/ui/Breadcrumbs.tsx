import Link from "next/link";
import { ChevronRight, MoreHorizontal } from "lucide-react";

/**
 * Unified breadcrumb primitive — used by every shell (platform console,
 * portal, mobile, marketing). Replaces both the ModuleHeader inline
 * slash implementation AND the marketing-only `<Breadcrumbs>`.
 *
 * Contract (see docs/ia/02-navigation-redesign.md §3.7):
 *   - Renders a visible chevron-separated trail.
 *   - Emits schema.org `BreadcrumbList` JSON-LD so Google sitelinks
 *     pick up nested pages under /console, /p/{slug}, and marketing.
 *   - Truncation: > 4 links collapse the middle entries into a
 *     three-dot label so the current page always stays visible.
 *   - `aria-current="page"` on the last entry; the last entry is
 *     rendered as a non-link span per WAI-ARIA breadcrumb pattern.
 *
 * Type choice: `Crumb` accepts `href?: string` so the last entry
 * (the page the user is on) can be declared without an href — you
 * don't link to yourself. If the last entry has an href it is still
 * rendered as a non-link — matches Stripe + Linear convention.
 */

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({
  items,
  baseUrl,
  className = "",
  emitJsonLd = true,
}: {
  items: Crumb[];
  /** Absolute base for JSON-LD URLs; falls back to NEXT_PUBLIC_APP_URL. */
  baseUrl?: string;
  className?: string;
  emitJsonLd?: boolean;
}) {
  if (items.length === 0) return null;

  const resolvedBase = baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

  // Visual truncation: if > 4 crumbs, collapse middle entries into
  // a non-interactive ellipsis (keeps first + last 2 visible).
  const visible = collapseMiddle(items);

  const ld = emitJsonLd
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((c, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: c.label,
          ...(c.href ? { item: resolvedBase ? `${resolvedBase}${c.href}` : c.href } : {}),
        })),
      }
    : null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        {visible.map((c, idx) => {
          const isLast = idx === visible.length - 1;
          if (c.label === "…") {
            return (
              <li key={`ellipsis-${idx}`} className="flex items-center gap-1.5">
                <ChevronRight size={12} aria-hidden="true" className="opacity-50" />
                <span
                  aria-label="Collapsed breadcrumb segments"
                  className="inline-flex h-4 w-4 items-center justify-center rounded hover:bg-[var(--bg-secondary)]"
                >
                  <MoreHorizontal size={12} aria-hidden="true" />
                </span>
              </li>
            );
          }
          return (
            <li key={`${c.label}-${idx}`} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight size={12} aria-hidden="true" className="opacity-50" />}
              {c.href && !isLast ? (
                <Link
                  href={c.href}
                  className="hover:text-[var(--foreground)] focus-visible:underline focus-visible:outline-none"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "text-[var(--foreground)] font-medium" : ""}
                >
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {ld ? (
        <script
          type="application/ld+json"
          // JSON-LD must be emitted as raw text so Google's crawler
          // consumes it — React would otherwise escape quotes.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ) : null}
    </nav>
  );
}

/**
 * Keep the first crumb + last 2 crumbs visible; replace the middle
 * with an ellipsis placeholder. Leaves ≤ 4 items untouched.
 */
function collapseMiddle(items: Crumb[]): Crumb[] {
  if (items.length <= 4) return items;
  return [items[0], { label: "…" }, items[items.length - 2], items[items.length - 1]];
}
