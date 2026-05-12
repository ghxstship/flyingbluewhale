// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, faqSchema } from "@/lib/seo";
import { COMPARE, COMPARE_LIST } from "@/lib/compare";

export function generateStaticParams() {
  return COMPARE_LIST.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ competitor: string }> }): Promise<Metadata> {
  const { competitor } = await params;
  const c = COMPARE[competitor];
  if (!c) return buildMetadata({ title: "Compare", description: "", path: `/compare/${competitor}` });
  return buildMetadata({
    title: `Coming from ${c.competitor}`,
    description: c.blurb,
    path: `/compare/${c.slug}`,
    keywords: c.keywords,
    ogImageEyebrow: `Coming from ${c.competitor}`,
    ogImageTitle: "What we are.",
  });
}

export default async function CompareDetail({ params }: { params: Promise<{ competitor: string }> }) {
  const { competitor } = await params;
  const c = COMPARE[competitor];
  if (!c) notFound();

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "From general-purpose tools", href: "/compare" },
    { label: `Coming from ${c.competitor}`, href: `/compare/${c.slug}` },
  ];

  return (
    <div>
      <JsonLd data={[faqSchema(c.faqs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
          Coming from {c.competitor}
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{c.headline}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">{c.hero}</p>
        <div className="surface mt-8 p-5">
          <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            Bottom line
          </div>
          <div className="mt-2 text-sm font-medium">{c.bottomLine}</div>
        </div>
      </section>

      {/* What FLYTEHAUS is — definitive, not comparative */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">What This Is.</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
          Forty-seven modules across three apps that share one database. Console, portal, field. Pitch through wrap.
          Receipts:
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {[
            "RFIs · submittals · daily logs · punch · inspections",
            "Advancing — 16 typed deliverables",
            "Proposals + e-sig (23 block types)",
            "Finance · Stripe Connect vendor payouts",
            "Procurement — RFQs, POs, vendor scorecards",
            "Equipment, rentals, fab orders, dispatch",
            "Crew + credentials + call sheets",
            "Schedule + ROS + 21-day look-ahead",
            "Safety stack — incidents, OSHA, medical, crisis",
            "KBYG event guides — 6 personas, 17 sections",
            "Gate scan — sub-100ms, offline-queued",
            "AI assistant grounded in your workspace",
          ].map((x) => (
            <li key={x} className="surface p-4 text-sm">
              {x}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Link href="/features" className="text-sm font-medium text-[var(--org-primary)]">
            All 47 modules →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Migration Path.</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">For teams moving from {c.competitor}.</p>
        <div className="surface mt-6 p-6">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            {c.migration.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ol>
        </div>
      </section>

      <FAQSection title={`Coming from ${c.competitor} · FAQ`} faqs={c.faqs} />

      <CTASection
        title="The Console Is Open."
        subtitle="Free forever for small teams. Migrate when you're ready."
        primaryLabel="Open the console"
        primaryHref="/signup"
        secondaryLabel="Talk to the studio"
        secondaryHref="/contact"
      />
    </div>
  );
}
