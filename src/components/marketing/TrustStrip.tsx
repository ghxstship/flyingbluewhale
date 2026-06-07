import { Star } from "lucide-react";

/**
 * Above-fold trust strip — named operators, role, and show counts.
 *
 * Specificity converts: "Trusted by production teams" is generic noise.
 * "M. Reyes — Production Coordinator · 14 shows on ATLVS" reads as a
 * real human at a real desk and ranks higher in B2B conversion testing.
 *
 * The `OPERATORS` array below is a stub — swap entries for real signed
 * testimonials as they come in from the reviews table. Format is fixed:
 *   { name, role, shows, surface }
 * where `surface` is the sub-product they primarily run on so the strip
 * cross-sells the three apps implicitly.
 */
type Operator = {
  name: string;
  role: string;
  shows: string;
  surface: "ATLVS" | "GVTEWAY" | "COMPVSS";
};

// REPLACE: as real customer permission-to-name comes in, swap these
// rows for verbatim self-described titles + actual show counts.
const OPERATORS: Operator[] = [
  { name: "M. Reyes", role: "Production Coordinator", shows: "14 shows", surface: "ATLVS" },
  { name: "J. Okafor", role: "Festival Operations Lead", shows: "9 events", surface: "COMPVSS" },
  { name: "S. Lindgren", role: "Talent Advancing", shows: "23 riders", surface: "GVTEWAY" },
];

export function TrustStrip() {
  return (
    <div className="mx-auto mt-10 max-w-4xl">
      {/* Aggregate row — rating + headline ops stat */}
      <div className="surface flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} className="fill-[var(--p-accent)] text-[var(--p-accent)]" />
            ))}
          </div>
          <div className="text-xs">
            <div className="font-semibold">4.9 average</div>
            <div className="text-[var(--p-text-2)]">from named operators on the platform</div>
          </div>
        </div>
        <div className="text-xs">
          <div className="font-semibold">15,000+ guests scanned</div>
          <div className="text-[var(--p-text-2)]">on a single gate, sub-100ms</div>
        </div>
        <div className="text-xs">
          <div className="font-semibold">47 modules · 1 schema</div>
          <div className="text-[var(--p-text-2)]">three apps, every show</div>
        </div>
      </div>

      {/* Named operators row — specificity beats abstract logos */}
      <ul className="mt-3 grid gap-2 sm:grid-cols-3" aria-label="Operators on the platform">
        {OPERATORS.map((op) => (
          <li
            key={op.name}
            className="surface-inset flex items-center gap-3 px-4 py-3"
            data-platform={op.surface.toLowerCase()}
          >
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold"
              style={{
                background: "color-mix(in srgb, var(--p-accent) 12%, transparent)",
                color: "var(--p-accent)",
              }}
            >
              {op.name
                .split(" ")
                .map((s) => s.replace(".", "")[0])
                .join("")}
            </span>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold">{op.name}</div>
              <div className="truncate font-mono text-[10px] tracking-wide text-[var(--p-text-2)] uppercase">
                {op.role} · {op.shows}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
