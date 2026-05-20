import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { FAQSection } from "@/components/marketing/FAQ";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, CANONICAL_CTAS, softwareApplicationSchema, SITE } from "@/lib/seo";
import { AI_USES } from "@/lib/marketing/ai-uses";

export const metadata: Metadata = buildMetadata({
  title: "AI For Production — Drafts From Your Workspace, Never The Public Internet",
  description:
    "An assistant that drafts riders, incident reports, call sheets, proposals, recaps, and safety briefs from your live workspace data. Anthropic Claude under the hood; per-org scope; never trained on your data.",
  path: "/ai",
  keywords: [
    "AI for event production",
    "production AI assistant",
    "AI for advancing",
    "AI for incident reports",
    "AI for tour management",
    "AI for live events",
    "Claude for production",
  ],
  ogImageEyebrow: "AI",
  ogImageTitle: "Drafts From Your Workspace.",
});

const HUB_FAQS = [
  {
    q: "Does the AI see other organizations' data?",
    a: "No. Every tool the assistant can call is scoped to your organization. RLS at the database — your tenant is walled off in Postgres, not in the app layer. The AI cannot reach into anyone else's data, by design.",
  },
  {
    q: "Do you train on our data?",
    a: "No. We don't train models. We're a production platform that uses Anthropic Claude under the hood — your conversations stay in your tenant, your records stay yours.",
  },
  {
    q: "Which model does it use?",
    a: "Claude Sonnet 4.6 by default for day-to-day work, Claude Opus 4.7 available per conversation when you need deeper reasoning. Switch in the conversation menu; cost is metered per-org with configurable monthly caps.",
  },
  {
    q: "What if the AI gets something wrong?",
    a: "Every output is a draft. The PM, EHS lead, or tour manager publishes. Auto-publish workflows are configurable but opt-in. The assistant also flags when it's inferring vs. when it's working from explicit data.",
  },
  {
    q: "Is there a free tier?",
    a: "Yes. The Free tier includes light AI assistance. Crew and Production tiers include the streaming assistant with conversation history. Festival tier adds custom system prompts and dedicated model selection.",
  },
];

export default function AiHub() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "AI", href: "/ai" },
  ];

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          softwareApplicationSchema({
            name: "ATLVS AI Assistant",
            description: "Production-AI assistant grounded in your workspace, powered by Anthropic Claude.",
            url: `${SITE.baseUrl}/ai`,
            price: "0",
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-accent">AI</div>
        <h1 className="hed-3xl mt-4">
          Drafts From Your Workspace.
          <br />
          Never The Public Internet.
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          An assistant that reads your projects, talent, vendors, schedule, and budgets — then drafts the things
          production teams write every day. Riders, incident reports, call sheets, proposals, recaps, safety briefs.
          Anthropic Claude under the hood, scoped to your tenant, never trained on your data.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">What It Drafts.</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
          Six production workflows where the assistant takes a draft 80% of the way and you ship the last 20%.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {AI_USES.map((u) => (
            <Link key={u.slug} href={`/ai/${u.slug}`} className="surface hover-lift p-5">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                style={{
                  background: "color-mix(in oklab, var(--org-primary) 12%, transparent)",
                  color: "var(--org-primary)",
                }}
              >
                <Sparkles size={16} aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-base font-semibold">{u.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{u.short}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                See how it works <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <div className="eyebrow eyebrow-accent">The Rules</div>
              <h2 className="hed-lg mt-3">What The AI Does — And Won't Do.</h2>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                Production teams asked us where the lines are. Here's the canon.
              </p>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                "Reads only your org's data. RLS at the database — not the app.",
                "Drafts; does not auto-publish. PM, EHS, or TM holds the publish key.",
                "Flags inferences vs. grounded facts. You see what's invented.",
                "Conversations log in your tenant, queryable, exportable, not shared.",
                "Anthropic Claude — never trained on your records.",
                "Per-org cost cap. Runaway usage is impossible.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span className="status-dot status-dot-success mt-2" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <FAQSection title="AI · FAQ" faqs={HUB_FAQS} />

      <CTASection title="ATLVS Is Open." subtitle="Free for small teams. AI included on Crew and up." />
    </div>
  );
}
