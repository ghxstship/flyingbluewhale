import type { Metadata } from "next";
import Link from "next/link";
import { Check, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PROJECT_TIERS, RETAINER_TIERS, ADD_ONS, paths } from "@/lib/ghxstship";
import { GhxstshipJsonLd, breadcrumbSchema, faqSchema } from "@/components/ghxstship/JsonLd";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Pricing — Per Project & Retainer | GHXSTSHIP",
  description:
    "Per-project tiers from $25K through federation-grade. Monthly retainers from $3K (Coordinator pair) through $13K (full senior team with 24/7 support). Stackable add-ons for engineering, federation liaison, AR/VR, sustainability, and more.",
  keywords: [
    "production company pricing",
    "event production retainer",
    "festival production cost",
    "experiential production rates",
    "event agency retainer pricing",
  ],
  alternates: { canonical: "https://ghxstship.pro/ghxstship/pricing" },
};

const FAQS = [
  {
    q: "What's actually included in the price on the card?",
    a: "The fee on the card is GHXSTSHIP's professional services fee — what we charge to scope, plan, manage, and deliver the engagement. Production costs (gear rental, labor, travel, fabrication, F&B, freight) pass through at cost plus an agreed administration rate, typically 12 to 18 percent.",
  },
  {
    q: "Can I move from a per-project engagement onto a retainer later?",
    a: "Yes. Many clients start with a single per-project engagement and convert to a retainer once a second or third event lands on the calendar. We credit any unused project balance against the first month of the retainer.",
  },
  {
    q: "How does payment work on per-project tiers?",
    a: "Sixty percent of the GHXSTSHIP fee on signature, forty percent at load-in. Production pass-throughs are invoiced as they accrue, with full receipts. Retainers bill monthly in advance.",
  },
  {
    q: "What's the difference between Studio and Bureau?",
    a: "Studio gives you a senior producer leading the engagement and an on-site representative every show day. Bureau adds a 24/7 off-site lead — the person who picks up the phone at 3am when weather pivots, a vendor disappears, or a federation issues a clean-zone update mid-build.",
  },
  {
    q: "Are add-ons priced separately from the tier?",
    a: "Yes. Add-ons are line-itemed at SOW or change-order. Most engagements end up pulling two to three. Stamped engineering and federation liaison are the most-requested across all tiers.",
  },
];

export default function PricingPage() {
  return (
    <>
      <GhxstshipJsonLd
        data={[
          breadcrumbSchema([
            { label: "GHXSTSHIP", href: "/ghxstship" },
            { label: "Pricing", href: "/ghxstship/pricing" },
          ]),
          faqSchema(FAQS),
        ]}
      />

      <div className="space-y-24 pb-24">
        {/* HERO */}
        <section className="mx-auto max-w-6xl px-6 pt-16">
          <div className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--org-primary)" }}>
            Pricing
          </div>
          <h1 className="mt-4 text-5xl uppercase sm:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
            Two ways
            <br />
            to work with us.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">Per Project</strong> for a single brief. Five tiers scaled to
            scope, from a one-night activation to a multi-year mega-event.{" "}
            <strong className="text-[var(--text-primary)]">Retainer</strong> for ongoing programs. Four bundles built
            around team composition, from a coordinator pair to a senior team with 24/7 support. Add-ons stack on either
            path. Production costs pass through at cost.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="#per-project" className="btn btn-secondary btn-sm">
              Per-Project
            </Link>
            <Link href="#retainer" className="btn btn-secondary btn-sm">
              Retainer
            </Link>
            <Link href="#add-ons" className="btn btn-secondary btn-sm">
              Add-Ons
            </Link>
          </div>
        </section>

        {/* PER-PROJECT */}
        <section id="per-project" className="mx-auto max-w-6xl scroll-mt-24 px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--org-primary)" }}>
                Per Project
              </div>
              <h2 className="mt-3 text-4xl uppercase sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                Five tiers.
                <br />
                One brief.
              </h2>
            </div>
            <p className="max-w-xl text-sm text-[var(--text-secondary)]">
              Tiers scale to scope. The Pop is a single zone. The Federation is a multi-year mega-event with full senior
              team. Pick by the work in front of you, not the aspiration.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {PROJECT_TIERS.map((tier) => (
              <div
                key={tier.slug}
                className={`flex h-full flex-col p-6 ${tier.highlight ? "surface-raised" : "surface hover-lift"}`}
              >
                {tier.highlight && (
                  <div className="mb-3 inline-flex w-fit items-center gap-1 bg-[var(--org-primary)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.2em] text-[var(--org-on-primary)] uppercase">
                    Most engagements
                  </div>
                )}
                <div className="text-2xl uppercase" style={{ fontFamily: "var(--font-display)" }}>
                  {tier.name}
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{tier.positioning}</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                    {tier.startingFee}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">starting fee</span>
                </div>
                <div className="mt-4 space-y-2 border-t border-[var(--border-color)] pt-4 text-xs">
                  <Detail label="Scope band" value={tier.scopeBand} />
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  {tier.includes.map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--org-primary)" }} />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-[var(--border-color)] pt-4 text-xs">
                  <div className="font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">Best for</div>
                  <ul className="mt-2 space-y-1 text-[var(--text-secondary)]">
                    {tier.bestFor.map((b) => (
                      <li key={b}>· {b}</li>
                    ))}
                  </ul>
                </div>
                <p className="mt-6 border-l-[3px] border-[var(--org-accent)] pl-3 text-sm text-[var(--text-secondary)] italic">
                  {tier.bestLine}
                </p>
                <div className="mt-auto pt-6">
                  <Button href={tier.cta.href} variant={tier.highlight ? "primary" : "secondary"} className="w-full">
                    {tier.cta.label}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RETAINER */}
        <section id="retainer" className="mx-auto max-w-6xl scroll-mt-24 px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--org-primary)" }}>
                Retainer
              </div>
              <h2 className="mt-3 text-4xl uppercase sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                Bundled by
                <br />
                team composition.
              </h2>
            </div>
            <p className="max-w-xl text-sm text-[var(--text-secondary)]">
              Each tier adds a senior role and a layer of always-on support. Ramp up between tiers as your program
              grows. Drop down between tiers in your slow season. Billed monthly in advance, cancellable on 60-day
              notice.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {RETAINER_TIERS.map((tier) => (
              <div
                key={tier.slug}
                className={`flex h-full flex-col p-6 ${tier.highlight ? "surface-raised" : "surface hover-lift"}`}
              >
                {tier.highlight && (
                  <div className="mb-3 inline-flex w-fit items-center gap-1 bg-[var(--org-primary)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.2em] text-[var(--org-on-primary)] uppercase">
                    Most retained
                  </div>
                )}
                <div className="text-2xl uppercase" style={{ fontFamily: "var(--font-display)" }}>
                  {tier.name}
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{tier.positioning}</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                    {tier.monthlyFee}
                  </span>
                </div>
                <div className="mt-4 border-t border-[var(--border-color)] pt-4">
                  <div className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                    <Users className="h-3 w-3" /> Your team
                  </div>
                  <ul className="mt-2 space-y-1 text-xs">
                    {tier.team.map((role) => (
                      <li key={role} className="flex items-start gap-2">
                        <span
                          className="mt-1.5 inline-block h-1 w-1 shrink-0"
                          style={{ background: "var(--org-primary)" }}
                        />
                        <span className="font-semibold">{role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 border-t border-[var(--border-color)] pt-4 text-xs">
                  <Detail label="Cadence" value={tier.cadence} />
                </div>
                <ul className="mt-5 space-y-2 text-sm">
                  {tier.includes.map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--org-primary)" }} />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-l-[3px] border-[var(--org-accent)] pl-3 text-sm text-[var(--text-secondary)] italic">
                  {tier.bestLine}
                </p>
                <div className="mt-auto pt-6">
                  <Button
                    href={tier.cta.href}
                    variant={tier.highlight ? "primary" : "secondary"}
                    size="sm"
                    className="w-full"
                  >
                    {tier.cta.label}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ADD-ONS */}
        <section id="add-ons" className="mx-auto max-w-6xl scroll-mt-24 px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--org-primary)" }}>
                Add-Ons
              </div>
              <h2 className="mt-3 text-4xl uppercase sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                Stack on either path.
              </h2>
            </div>
            <p className="max-w-xl text-sm text-[var(--text-secondary)]">
              Sold a la carte at scope-of-work or change-order. Stamped engineering and federation liaison are the
              most-requested across all tiers.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ADD_ONS.map((a) => (
              <div key={a.slug} className="surface hover-lift flex h-full flex-col p-6">
                <div className="text-lg uppercase" style={{ fontFamily: "var(--font-display)" }}>
                  {a.name}
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{a.description}</p>
                <div className="mt-4 font-mono text-xs tracking-[0.18em]" style={{ color: "var(--org-primary)" }}>
                  {a.priceLine}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT'S BILLED */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="surface-raised relative overflow-hidden p-10">
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: "linear-gradient(90deg, var(--org-primary), var(--org-accent))" }}
            />
            <h2 className="text-3xl uppercase sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              How billing works.
            </h2>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              <div>
                <div
                  className="text-xs font-semibold tracking-[0.18em] uppercase"
                  style={{ color: "var(--org-primary)" }}
                >
                  01 Professional Fee
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  The fee on the card is what GHXSTSHIP charges to scope, plan, and operate the engagement. Locked at
                  scope-of-work, with a clear change-order framework if scope grows.
                </p>
              </div>
              <div>
                <div
                  className="text-xs font-semibold tracking-[0.18em] uppercase"
                  style={{ color: "var(--org-primary)" }}
                >
                  02 Production Pass-Through
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Gear, labor, travel, fabrication, food and beverage, freight — all production costs pass through at
                  cost plus an agreed admin rate, typically 12 to 18 percent. Full receipts on every line.
                </p>
              </div>
              <div>
                <div
                  className="text-xs font-semibold tracking-[0.18em] uppercase"
                  style={{ color: "var(--org-primary)" }}
                >
                  03 Schedule
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Per-project: 60% of the professional fee on signature, 40% at load-in. Retainers: monthly in advance.
                  Production pass-throughs invoiced as they accrue.
                </p>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button href={paths.contact()} size="lg">
                Start a Project
              </Button>
              <Button href={paths.servicesRoot()} size="lg" variant="secondary">
                Services Catalog
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--org-primary)" }}>
            Pricing FAQ
          </div>
          <h2 className="mt-3 text-4xl uppercase sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
            Common questions.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {FAQS.map((faq) => (
              <details key={faq.q} className="surface group p-6 [&[open]>summary>span:last-child]:rotate-45">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                  <span className="text-base font-semibold">{faq.q}</span>
                  <span className="mt-1 inline-block text-2xl leading-none transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">{label}</div>
      <div className="mt-0.5 text-[var(--text-secondary)]">{value}</div>
    </div>
  );
}
