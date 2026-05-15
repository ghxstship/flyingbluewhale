import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, CANONICAL_CTAS } from "@/lib/seo";
import { DEMO_PERSONAS } from "@/lib/marketing/demo-personas";

export const metadata: Metadata = buildMetadata({
  title: "Book A Walkthrough — Wired To A Real Show",
  description:
    "Talk to the studio. Walk the platform on a real production. No sales-call calisthenics — operators talking to operators.",
  path: "/demo",
  keywords: [
    "ATLVS demo",
    "event production software demo",
    "book a production software walkthrough",
    "festival software demo",
    "tour management software demo",
  ],
  ogImageEyebrow: "Demo",
  ogImageTitle: "Walk The Platform.",
});

const FAQS = [
  {
    q: "What happens on a walkthrough?",
    a: "Forty minutes. We open the platform wired to a real production — the canonical one is MMW26 Hialeah. You ask what your show needs, we show you the wiring that runs it. No slide deck.",
  },
  {
    q: "Is this a sales call?",
    a: "No. It's a walkthrough. Sales conversations happen if you want them to — most teams open the free tier and start in the platform first.",
  },
  {
    q: "Can I just try it without a call?",
    a: "Yes. Sign up free — 30 seconds, no card. The walkthrough is for teams that want to see specific workflows wired to their use case.",
  },
];

export default function DemoIndex() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Demo", href: "/demo" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">Demo</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">Walk The Platform.</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          Forty minutes, wired to a real production. Pick the walkthrough that matches your work — or sign up free first
          and bring questions later.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight">Walkthroughs By Operation.</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
          Each variant tunes the walkthrough to your work. Same platform, different starting point.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {DEMO_PERSONAS.map((p) => (
            <Link key={p.slug} href={`/demo/${p.slug}`} className="surface hover-lift p-6">
              <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
                {p.buyer}
              </div>
              <h3 className="mt-2 text-xl font-semibold">{p.hero}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{p.subhero}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                Book this walkthrough <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <FAQSection title="FAQ" faqs={FAQS} />

      <CTASection
        title="ATLVS Is Open."
        subtitle="Free, forever, for small teams. Per-org pricing the rest of the way up."
      />
    </div>
  );
}
