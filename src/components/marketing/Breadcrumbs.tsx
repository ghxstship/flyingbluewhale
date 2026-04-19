import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Marketing breadcrumbs — M2-03.
 *
 * Renders a visual trail + a schema.org `BreadcrumbList` JSON-LD block in
 * the same component so callers can't forget the structured-data half.
 * Google Search treats BreadcrumbList as authoritative for sitelinks, so
 * the JSON-LD IS the SEO deliverable; the visual trail is secondary.
 *
 * Usage:
 *   <Breadcrumbs items={[
 *     { label: "Solutions", href: "/solutions" },
 *     { label: "Events", href: "/solutions/events" },
 *     { label: "Festival ops" },  // current page, no href
 *   ]} />
 *
 * `baseUrl` is optional — when absent, schema uses relative urls which
 * Google accepts. When the site has a canonical absolute URL configured
 * (via `NEXT_PUBLIC_APP_URL`), the metadata layer should pass it.
 */
export type Crumb = { label: string; href?: string };

export function Breadcrumbs({
  items,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "",
  className = "",
}: {
  items: Crumb[];
  baseUrl?: string;
  className?: string;
}) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: c.label,
      ...(c.href ? { item: baseUrl ? `${baseUrl}${c.href}` : c.href } : {}),
    })),
  };
  return (
    <nav aria-label="Breadcrumb" className={`mx-auto max-w-6xl px-6 pt-6 ${className}`}>
      <ol className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        {items.map((c, idx) => {
          const isLast = idx === items.length - 1;
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
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-[var(--foreground)]" : ""}>
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <script
        type="application/ld+json"
        // JSON-LD is the whole point — rendered as a <script> tag so Google's
        // crawler reads it, not React. `dangerouslySetInnerHTML` is the only
        // way to emit raw JSON without React quote-escaping it.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </nav>
  );
}
