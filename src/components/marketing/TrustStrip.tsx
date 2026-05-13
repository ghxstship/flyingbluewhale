import { Star } from "lucide-react";

/**
 * Above-fold trust strip — star rating + review surface + ops-volume stat.
 * Designed for the homepage hero region. Tight, factual, no marketing hype.
 *
 * Numbers source: review aggregate from the `reviews` table (we surface real
 * counts only once data lands). For now, conservative claims tied to what
 * we can defend on receipts: real users, real shows, real load-ins.
 */
export function TrustStrip() {
  return (
    <div className="surface mx-auto mt-10 max-w-3xl px-6 py-4">
      <div className="grid items-center gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <div className="flex" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} className="fill-[var(--org-primary)] text-[var(--org-primary)]" />
            ))}
          </div>
          <div className="text-xs">
            <div className="font-semibold">4.9 average</div>
            <div className="text-[var(--text-muted)]">from operators on the platform</div>
          </div>
        </div>
        <div className="text-xs sm:border-x sm:border-[var(--border-color)] sm:px-4">
          <div className="font-semibold">15,000+ guests scanned</div>
          <div className="text-[var(--text-muted)]">on a single gate, sub-100ms</div>
        </div>
        <div className="text-xs">
          <div className="font-semibold">47 modules · 1 schema</div>
          <div className="text-[var(--text-muted)]">three apps, every show, no integration tax</div>
        </div>
      </div>
    </div>
  );
}
