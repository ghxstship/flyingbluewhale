// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { StatStrip } from "@/components/marketing/StatStrip";
import { buildMetadata } from "@/lib/seo";
import { INDUSTRIES } from "@/lib/marketing/industries";

type Props = { params: Promise<{ industry: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry } = await params;
  const info = INDUSTRIES[industry];
  if (!info)
    return buildMetadata({ title: "Solution", description: "Industry solution", path: `/solutions/${industry}` });
  return buildMetadata({
    title: `${info.name} — ${info.tagline} on ATLVS Technologies`,
    description: info.description,
    path: `/solutions/${industry}`,
    keywords: [info.name.toLowerCase(), info.tagline.toLowerCase()],
    ogImageEyebrow: "Solutions",
    ogImageTitle: info.hero.title,
  });
}

export async function generateStaticParams() {
  return Object.keys(INDUSTRIES).map((industry) => ({ industry }));
}

export default async function IndustryPage({ params }: Props) {
  const { industry } = await params;
  const info = INDUSTRIES[industry];
  if (!info) notFound();

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Solutions", href: "/solutions" },
    { label: info.name, href: `/solutions/${industry}` },
  ];

  return (
    <>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{info.hero.eyebrow}</div>
        <h1 className="hed-2xl mt-4">{info.hero.title}</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">{info.hero.body}</p>
        <div className="mt-8 flex gap-3">
          <Button href="/signup">Start Free</Button>
          <Button href="/contact" variant="secondary">
            Book a Demo
          </Button>
        </div>
      </section>

      <StatStrip stats={info.stats} />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">Outcomes</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {info.outcomes.map((o) => (
            <li key={o} className="surface flex items-start gap-3 p-4">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--org-primary)]" />
              <span className="text-sm">{o}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">Modules Used</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {info.modules.map((m) => (
            <div key={m.name} className="surface p-5">
              <div className="text-sm font-semibold">{m.name}</div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      <FAQSection title={`${info.name} · FAQ`} faqs={info.faqs} />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">Related Industries</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {info.related.map((r) => {
            const rel = INDUSTRIES[r];
            if (!rel) return null;
            return (
              <Link key={r} href={`/solutions/${r}`} className="surface hover-lift p-4">
                <div className="text-sm font-semibold">{rel.name}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{rel.tagline}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <CTASection />
    </>
  );
}
