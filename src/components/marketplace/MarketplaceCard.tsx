import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export type MarketplaceCardProps = {
  href: string;
  title: string;
  subtitle?: string;
  meta?: Array<string | null | undefined>;
  tags?: string[];
  rating?: { avg: number | null; count: number } | null;
  badge?: string | null;
  verified?: boolean;
};

/**
 * Compact card used across all 6 marketplace directories — RFQs, gigs,
 * calls, talent, crew, vendors. Stays free of marketplace-kind branching
 * so the directory pages only differ in the data they fetch + the meta
 * fields they pass.
 */
export function MarketplaceCard({ href, title, subtitle, meta, tags, rating, badge, verified }: MarketplaceCardProps) {
  return (
    <Link href={href} className="surface hover-lift flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          {subtitle && <p className="text-sm text-[var(--p-text-2)]">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {verified && <Badge variant="success">verified</Badge>}
          {badge && <Badge variant="info">{badge}</Badge>}
        </div>
      </div>

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((t) => (
            <Badge key={t} variant="muted">
              {t}
            </Badge>
          ))}
          {tags.length > 4 && <span className="text-xs text-[var(--p-text-2)]">+{tags.length - 4}</span>}
        </div>
      )}

      {meta && meta.some(Boolean) && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--p-text-2)]">
          {meta.filter(Boolean).map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}

      {rating && rating.count > 0 && (
        <p className="text-xs text-[var(--p-text-2)]">
          ★ {rating.avg ?? "—"} <span className="text-[var(--p-text-2)]">({rating.count})</span>
        </p>
      )}
    </Link>
  );
}

export function MarketplaceGrid({ children, empty }: { children: React.ReactNode; empty?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {children ?? null}
      {/* Empty fallback rendered if children is empty */}
      {!children && empty}
    </div>
  );
}
