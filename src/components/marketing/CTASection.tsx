import Link from "next/link";

export function CTASection({
  title = "Ready to run production on one platform?",
  subtitle = "Start free — no credit card, no time limit.",
  primaryLabel = "Start free",
  primaryHref = "/signup",
  secondaryLabel = "Talk to sales",
  secondaryHref = "/contact",
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
      <div className="surface-raised relative overflow-hidden p-10 text-center">
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: "linear-gradient(90deg, var(--org-primary), var(--org-accent))" }} />
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--text-secondary)]">{subtitle}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={primaryHref} className="btn btn-primary">{primaryLabel}</Link>
          <Link href={secondaryHref} className="btn btn-secondary">{secondaryLabel}</Link>
        </div>
      </div>
    </section>
  );
}
