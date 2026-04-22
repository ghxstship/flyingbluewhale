import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Users, Sparkles, FileSignature, QrCode, DollarSign, ClipboardCheck, Globe } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { LogoCloud } from "@/components/marketing/LogoCloud";
import { StatStrip } from "@/components/marketing/StatStrip";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, organizationSchema, softwareApplicationSchema, SITE } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Production OS for live events, touring, and experiential",
  description:
    "Run production on one platform — not ten. ATLVS for the office, GVTEWAY for your stakeholders, COMPVSS for the field. Every tool a production team needs, connected. Free to start.",
  path: "/",
  keywords: [
    "production management software",
    "event operations platform",
    "live event software",
    "experiential production platform",
    "event advancing tool",
    "crew management software",
    "event ticketing platform",
    "Second Star Technologies",
    "ATLVS",
    "GVTEWAY",
    "COMPVSS",
  ],
  ogImageTitle: "Run production. Not spreadsheets.",
});

export default function Home() {
  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          softwareApplicationSchema({
            name: "Second Star Technologies",
            description: SITE.description,
            url: SITE.baseUrl,
            price: "0",
          }),
        ]}
      />

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pt-24 pb-12 text-balance">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">
          Production OS · v1
        </div>
        <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
          Run Production.<br />Not Spreadsheets.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
          The operating system for live events, touring, experiential, fabrication, and broadcast
          production. One platform for your office, your stakeholders, and the field. No more
          checking four tabs to answer one question.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/signup" size="lg">Start Free for Life</Button>
          <Button href="/contact" size="lg" variant="secondary">Book a Demo</Button>
          <Link href="/docs" className="btn btn-ghost btn-lg">View the Docs →</Link>
        </div>

        {/* M3-03 — Live portal preview. Anon visitors see real product chrome
            (the mmw26-hialeah guest guide) at reduced scale, no signup wall.
            `sandbox=""` blocks scripts, forms, + popups from inside the iframe —
            it's read-only product-eye-candy. `loading="lazy"` defers the paint
            until the iframe enters the viewport, which is below the fold on
            most desktop renders. */}
        <div className="mt-14">
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface-inset)] elevation-2">
            <div className="flex items-center gap-1.5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--text-muted)_60%,transparent)]" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--text-muted)_60%,transparent)]" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--text-muted)_60%,transparent)]" aria-hidden="true" />
              <span className="ml-3 font-mono text-xs text-[var(--text-muted)]">
                secondstar.tech/p/mmw26-hialeah/guide
              </span>
            </div>
            <iframe
              src="/p/mmw26-hialeah/guide"
              title="Live product preview — MMW26 Hialeah guest guide"
              sandbox=""
              loading="lazy"
              className="h-[640px] w-full bg-[var(--background)]"
            />
          </div>
          <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
            Live preview — exactly what a guest sees on their phone. No signup required.
          </p>
        </div>
      </section>

      <LogoCloud />

      {/* Three-app showcase */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-16">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">
            Three apps · one platform
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            ATLVS · GVTEWAY · COMPVSS
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--text-secondary)]">
            Three connected apps — not a bundle of separately-bought tools with sync issues.
            Your office, your stakeholders, and your crew are always reading from the same page.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              slug: "atlvs",
              eyebrow: "ATLVS",
              title: "Run the office",
              body: "Projects, finance, procurement, production, people, AI. Your team's command center — everything in one sidebar.",
              bullets: [
                "Proposals, invoices, POs, crew, schedule — in one place",
                "AI that drafts riders, RFPs, and recaps from your actual data",
                "Every action logged — who, when, what changed",
              ],
              href: "/solutions/atlvs",
            },
            {
              slug: "gvteway",
              eyebrow: "GVTEWAY",
              title: "Loop in everyone outside",
              body: "A tailored workspace for every stakeholder — artists, vendors, clients, sponsors, guests, crew. They see only their lane.",
              bullets: [
                "Artist advancing with deliverables tracking",
                "Client proposals, e-signature, invoicing",
                "Know Before You Go guides — per role",
              ],
              href: "/solutions/gvteway",
            },
            {
              slug: "compvss",
              eyebrow: "COMPVSS",
              title: "Own the field",
              body: "Ticket scan, geo-verified clock-in, inventory, incident reports — all from a phone. Keeps working when venue signal drops.",
              bullets: [
                "QR scans (even when the signal goes)",
                "Geo-verified clock in and clock out",
                "Today's call sheet + role-scoped guide",
              ],
              href: "/solutions/compvss",
            },
          ].map((app) => (
            <Link
              key={app.slug}
              href={app.href}
              data-platform={app.slug}
              className="surface-raised hover-lift relative overflow-hidden p-6"
            >
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--org-primary)" }} />
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--org-primary)" }}>
                {app.eyebrow}
              </div>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{app.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{app.body}</p>
              <ul className="mt-4 space-y-1.5 text-xs text-[var(--text-secondary)]">
                {app.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-[6px] inline-block h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--org-primary)" }} />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-5 inline-flex items-center gap-1 text-xs font-medium">
                Learn more <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <StatStrip
        stats={[
          { value: "15k+", label: "guests / event" },
          { value: "98%", label: "advancing on time" },
          { value: "14→2", label: "days to invoice" },
          { value: "< 100ms", label: "ticket scan" },
        ]}
      />

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">Capabilities</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl text-balance">
            Every Tool You&apos;re Already Paying For. Now One Subscription.
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            From first pitch to final recap. Cancel five subscriptions this month.
          </p>
        </div>
        <div className="mt-10">
          <FeatureGrid
            cols={4}
            features={[
              { icon: FileSignature, title: "Interactive proposals", body: "Build, send, sign, track — no DocuSign, no PDF-in-an-email-chain.", href: "/features/proposals" },
              { icon: Sparkles, title: "Event guides (KBYG)", body: "One Know Before You Go. Every role sees the version written for them.", href: "/features/guides" },
              { icon: QrCode, title: "Ticketing + scan", body: "QR check-in that works on day one — and when venue signal drops.", href: "/features/ticketing" },
              { icon: Users, title: "Advancing", body: "Riders, input lists, stage plots, catering, travel — typed, not threaded.", href: "/features/advancing" },
              { icon: DollarSign, title: "Finance", body: "Invoices, expenses, budgets, and direct vendor payouts.", href: "/features/finance" },
              { icon: ClipboardCheck, title: "Procurement", body: "Requisitions, POs, vendor COIs, W-9s — all in one place.", href: "/features/procurement" },
              { icon: Zap, title: "AI assistant", body: "Answers from your projects, crew, and budgets — not the public internet.", href: "/features/ai" },
              { icon: ShieldCheck, title: "Enterprise-grade", body: "SSO, SCIM, signed DPA, immutable audit log, 99.9% uptime SLA.", href: "/features/compliance" },
            ]}
          />
        </div>
      </section>

      {/* Built for section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">Built for the Whole Production Industry.</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {[
            { slug: "live-events", title: "Live events", sub: "Festivals, activations, residencies" },
            { slug: "fabrication", title: "Fabrication", sub: "Scenic, signage, custom build" },
            { slug: "touring", title: "Touring", sub: "Per-city advancing + crew" },
            { slug: "corporate", title: "Corporate", sub: "Launches, AGMs, summits" },
          ].map((x) => (
            <Link key={x.slug} href={`/solutions/${x.slug}`} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{x.title}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{x.sub}</div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                Explore <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="surface-raised overflow-hidden">
          <div className="grid gap-10 p-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">Why Second Star Technologies</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">One Platform Beats Ten Tabs.</h2>
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                Most production teams are running Asana for tasks, a spreadsheet for advancing, DocuSign
                for proposals, QuickBooks for invoices, and a group chat for the panic. Every gap leaks
                time and money — riders missing line items, POs without COIs, tickets that never got
                scanned, invoices nobody chased.
              </p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                ATLVS, GVTEWAY, and COMPVSS close the gaps. One platform — your office, your
                stakeholders, your crew — with the right data surfaced to the right person at the
                right moment. And yes, every org&apos;s data stays walled off from every other org.
              </p>
              <div className="mt-6 flex gap-2">
                <Button href="/compare/vs-spreadsheets" variant="secondary" size="sm">vs spreadsheets</Button>
                <Button href="/compare/vs-asana" variant="secondary" size="sm">vs Asana</Button>
                <Button href="/compare/vs-monday" variant="secondary" size="sm">vs Monday</Button>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                "Your data walled off from every other organization — enforced at the database, not just the app",
                "Direct vendor payouts — ACH, card, or international wire",
                "File sharing that auto-expires. No public buckets, no accidental leaks",
                "Offline ticket scanning that keeps working when venue signal dies",
                "AI that reads your projects, crew, and budgets — not the public internet",
                "Immutable audit trail — who, when, what changed, what it was before",
                "Three purpose-built apps — office, stakeholders, field",
                "Know Before You Go guides — one source, role-scoped views",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <span className="status-dot status-dot-success mt-2" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <FAQSection
        title="Production OS · FAQ"
        faqs={HOME_FAQ}
      />

      <CTASection />
    </>
  );
}

const HOME_FAQ = [
  {
    q: "What is Second Star Technologies?",
    a: "Second Star Technologies builds three connected apps for production teams. ATLVS runs your office (projects, finance, procurement, crew). GVTEWAY gives every outside stakeholder — artists, vendors, clients, sponsors, guests — their own role-scoped view. COMPVSS is for the field: ticket scan, clock-in, incident reports. All three share one backbone, so nothing falls through the cracks.",
  },
  {
    q: "Who is it for?",
    a: "Production companies, festival promoters, fabrication shops, touring operations, experiential agencies, and creative ops teams. If you run shows and have to coordinate with artists, vendors, clients, sponsors, or guests — Second Star replaces five to ten of your current tools.",
  },
  {
    q: "How is Second Star different from Asana, Monday, or Airtable?",
    a: "Asana, Monday, and Airtable are great for generic work management. We aren't. We're built specifically for production: native ticket scanning, artist advancing with deliverables, direct vendor payouts, signed proposals with phase gates, role-scoped Know Before You Go guides, and a mobile app for the field. You don't have to build your workflow from scratch — the workflow is the product.",
  },
  {
    q: "What are ATLVS, GVTEWAY, and COMPVSS?",
    a: "Three apps, one platform. ATLVS is where your team works — projects, finance, procurement, production, people. GVTEWAY is where your outside stakeholders work — each one (artist, vendor, client, sponsor, guest, crew) gets a tailored view with only their data. COMPVSS is for the field — ticket scan, crew clock-in, inventory, incident reports — from any phone.",
  },
  {
    q: "Is there a free tier?",
    a: "Yes. The Access tier is free forever — up to 3 users, basic projects and ticketing, community support. Core is $49/mo, Professional is $199/mo, Enterprise is custom. See pricing for the full breakdown.",
  },
  {
    q: "How do payments work?",
    a: "Clients pay invoices by card or ACH. Vendors get paid out directly — ACH, card, or international wire. We never touch your money; payouts route through a connected Stripe account you control.",
  },
  {
    q: "Does it work offline?",
    a: "Yes — where it matters. COMPVSS keeps working when venue signal drops. Your crew can scan tickets and clock in without bars. Everything queues up and syncs when connectivity returns. No scan ever gets lost.",
  },
  {
    q: "How is security handled?",
    a: "Seriously. Your org's data is walled off from every other org, enforced at the deepest layer — not just in the app. Every change writes to an immutable audit trail. Files share via auto-expiring signed URLs, not public buckets. SSO, SCIM user provisioning, and SOC 2 are available on Enterprise. Full security documentation at /trust.",
  },
  {
    q: "Do you have an AI assistant?",
    a: "Yes — and it actually knows your org. The AI reads your projects, budgets, crew, and schedule (not the public internet) and drafts riders, RFPs, call sheets, recaps, and safety briefings on demand. Every conversation is logged and scoped to your workspace.",
  },
  {
    q: "What's a KBYG guide?",
    a: "KBYG = Know Before You Go — a per-role event handbook. Artists see riders, catering, venue specs, and the schedule. Crew sees the call sheet, PPE, radio channels, and SOPs. Guests see logistics, tickets, and the public schedule. Written once in ATLVS, rendered differently for each audience.",
  },
  {
    q: "Can I export my data?",
    a: "Anytime. CSV exports are available on every tier. Full data exports are available on Enterprise. You own your data — full stop.",
  },
  {
    q: "How do I get started?",
    a: "Sign up free — takes 30 seconds. Or book a demo and we'll walk you through it with a real human.",
  },
];
