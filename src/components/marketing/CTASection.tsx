import Link from "next/link";
import { CANONICAL_CTAS } from "@/lib/seo";

export function CTASection({
  title = "The Console Is Open.",
  subtitle = "Free, forever, for small teams. Per-org pricing the rest of the way up.",
  primaryLabel = CANONICAL_CTAS.primary.label,
  primaryHref = CANONICAL_CTAS.primary.href,
  secondaryLabel = CANONICAL_CTAS.secondary.label,
  secondaryHref = CANONICAL_CTAS.secondary.href,
}: {
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="mx-auto mt-12 max-w-6xl px-6 py-16">
      <div className="surface relative overflow-hidden p-10 text-center">
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: "linear-gradient(90deg, var(--org-primary), var(--org-accent))" }}
        />
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--text-secondary)]">{subtitle}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={primaryHref} className="btn btn-primary">
            {primaryLabel}
          </Link>
          <Link href={secondaryHref} className="btn btn-secondary">
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
