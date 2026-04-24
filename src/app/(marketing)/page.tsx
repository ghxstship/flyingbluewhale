// Home page is fully static. Pin it so Next.js serves pre-rendered HTML
// without a Suspense boundary on client-side nav — no loading flash.
export const dynamic = "force-static";

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
  title: "Production OS for the show. Every show.",
  description:
    "One console runs the office. One portal loops in the guests. One PWA owns the field. ATLVS · GVTEWAY · COMPVSS — the whole lineup in one road case. Doors open free.",
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
  ogImageTitle: "Run the show. Not the spreadsheets.",
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
          Doors open · v1 · now on sale
        </div>
        <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
          Run the Show.<br />Not the Spreadsheets.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
          The operating system for festivals, tours, activations, fabrication, and broadcast. One console for the office. One portal for every guest, artist, vendor, and sponsor. One PWA for the crew on-site. Nobody refreshes a tab to ask what time the doors open.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/signup" size="lg">Doors Open — Free, Forever</Button>
          <Button href="/contact" size="lg" variant="secondary">Backstage Walkthrough</Button>
          <Link href="/docs" className="btn btn-ghost btn-lg">Read the Run-Sheet →</Link>
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
            That's a real door-pass — what a guest sees on their phone. No list. No login.
          </p>
        </div>
      </section>

      <LogoCloud />

      {/* Three-app showcase */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-16">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">
            Tonight's lineup · three acts · one stage
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            ATLVS · GVTEWAY · COMPVSS
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--text-secondary)]">
            Three acts on the same stage — no sync issues, no bundle tax, no integrations nobody owns. The office, the door, and the floor all reading from the same manifest.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              slug: "atlvs",
              eyebrow: "ATLVS · The Office",
              title: "Runs the show from the desk.",
              body: "Nine domains, one sidebar. Proposals to payouts, POs to ceremonies. Your production office — minus six tabs and a group chat named chaos.",
              bullets: [
                "Proposals, invoices, POs, crew, schedule — same room",
                "AI that drafts riders and recaps from your own data",
                "Every change logged — who, when, before, after",
              ],
              href: "/solutions/atlvs",
            },
            {
              slug: "gvteway",
              eyebrow: "GVTEWAY · The Door",
              title: "Every stakeholder. Their own entrance.",
              body: "Artists, vendors, clients, sponsors, guests, crew, delegations, media, VIPs, volunteers, athletes. Twelve doors. One brain. They only see their lane.",
              bullets: [
                "Artist advancing with live deliverables",
                "Client proposals, e-sig, invoices",
                "Per-persona Know-Before-You-Go door passes",
              ],
              href: "/solutions/gvteway",
            },
            {
              slug: "compvss",
              eyebrow: "COMPVSS · The Floor",
              title: "Runs the night from your pocket.",
              body: "Gate scan, shift clock-in, medic triage, crisis alerts, driver manifest, guard tour. Offline-first. Works when the cell tower forgets you exist.",
              bullets: [
                "QR + barcode scans under <100ms — signal or no signal",
                "Shift check-in with meal credits + breaks",
                "Field incident + safeguarding intake, encrypted",
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
                Backstage pass <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <StatStrip
        stats={[
          { value: "15k+", label: "guests on the list" },
          { value: "98%", label: "riders landed on time" },
          { value: "14→2", label: "days from load-out to invoice" },
          { value: "<100ms", label: "gate scan, offline or not" },
        ]}
      />

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">Tonight&apos;s Lineup</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl text-balance">
            The Eight Headliners on the Bill.
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            The five subscriptions you&apos;ve been juggling — on one ticket. Cancel the openers.
          </p>
        </div>
        <div className="mt-10">
          <FeatureGrid
            cols={4}
            features={[
              { icon: FileSignature, title: "Proposals (signed live)", body: "Build, send, sign, book. No DocuSign. No PDF thread older than the show.", href: "/features/proposals" },
              { icon: Sparkles, title: "KBYG door passes", body: "Write the guide once. Every persona reads their own lane.", href: "/features/guides" },
              { icon: QrCode, title: "Gate + ticket scan", body: "QR check-in in under 100ms — when the venue Wi-Fi taps out, it still ships.", href: "/features/ticketing" },
              { icon: Users, title: "Advancing", body: "Riders, input lists, stage plots, catering, travel — typed, not texted.", href: "/features/advancing" },
              { icon: DollarSign, title: "Finance + payouts", body: "Invoices, expenses, budgets, live vendor payouts. ACH, card, or wire.", href: "/features/finance" },
              { icon: ClipboardCheck, title: "Procurement", body: "Reqs, POs, vendor COIs, W-9s — one file cabinet, no loose paper.", href: "/features/procurement" },
              { icon: Zap, title: "AI runner", body: "Drafts riders, recaps, and RFPs from your projects — not the public internet.", href: "/features/ai" },
              { icon: ShieldCheck, title: "Main-stage security", body: "Signed DPA. Immutable audit log. 99.9% uptime. Tour-proof.", href: "/features/compliance" },
            ]}
          />
        </div>
      </section>

      {/* Built for section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">Every Kind of Show. Same Road Case.</h2>
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
                Walk it <ArrowRight size={12} />
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
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">Why Second Star</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">One Road Case. Not Eleven.</h2>
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                Right now the average show is held together by Asana, a rider spreadsheet, DocuSign, QuickBooks, Dropbox, a shared inbox, three WhatsApps, and a deep breath. Every seam leaks. Riders ship short. POs ship without COIs. Tickets scan but nobody reconciles. Invoices sit in &ldquo;sent&rdquo; for six weeks.
              </p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                ATLVS · GVTEWAY · COMPVSS pack the whole run-of-show into one console, one portal, one PWA. Right data, right lane, right moment. Nobody else&apos;s org ever peeks into yours — that&apos;s enforced in the database, not promised in a pitch deck.
              </p>
              <div className="mt-6 flex gap-2">
                <Button href="/compare/vs-spreadsheets" variant="secondary" size="sm">vs spreadsheets</Button>
                <Button href="/compare/vs-asana" variant="secondary" size="sm">vs Asana</Button>
                <Button href="/compare/vs-monday" variant="secondary" size="sm">vs Monday</Button>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                "Your manifest walled off from every other org — in the database, not the marketing",
                "Direct vendor payouts — ACH, card, international wire. Settle on Monday",
                "File shares that self-destruct. No public buckets. No leak at 2 a.m.",
                "Offline gate scan — the cell tower&apos;s problem, not yours",
                "AI that reads your lineup, crew, and budget — not the public internet",
                "Every change logged — who, when, before, after. Forever.",
                "Three apps, one stage: console, portal, PWA",
                "KBYG door passes — one source, every persona its own view",
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
        title="Doors, Drinks, Data · FAQ"
        faqs={HOME_FAQ}
      />

      <CTASection />
    </>
  );
}

const HOME_FAQ = [
  {
    q: "What is this thing, exactly?",
    a: "Three apps on one stage. ATLVS — the production office. GVTEWAY — every stakeholder's own door. COMPVSS — the crew PWA in your back pocket. All three share one backbone, so nobody's asking each other what time the doors actually open.",
  },
  {
    q: "Who is it for?",
    a: "Festival promoters, tour production, scenic fab shops, experiential agencies, residency ops, broadcast compounds, corporate-summit builders. Anyone whose life is run-sheets and load-in calls. If your day involves a rider, a COI, and a panic DM — we replace five to ten of your current tools.",
  },
  {
    q: "How is this different from Asana, Monday, or Airtable?",
    a: "Asana is a to-do list in a suit. Monday is a spreadsheet that learned to smile. Airtable is a database that hosts a cocktail party. None of them scan a ticket, run an artist rider, or pay a vendor. We do. The run-of-show isn't a thing you build in our app — it's the product itself.",
  },
  {
    q: "What are ATLVS, GVTEWAY, and COMPVSS?",
    a: "Three acts on the lineup. ATLVS — your office runs here (projects, finance, procurement, people, AI). GVTEWAY — twelve stakeholder personas each get their own portal (artist, vendor, client, sponsor, guest, crew, delegation, media, VIP, hospitality, volunteer, athlete). COMPVSS — the field PWA: gate scan, shift check-in, incident, medic, driver, guard, warehouse.",
  },
  {
    q: "Is there a free ticket?",
    a: "Yes — GA is free forever. Three seats, basic projects and ticketing, community room. All-Access is $49/mo. Headliner is $199/mo. Festival tier is custom. Full ticket chart on /pricing.",
  },
  {
    q: "How do the payouts work?",
    a: "Clients settle by card or ACH. Vendors get paid out live — ACH, card, international wire. We never touch the money; payouts route through your connected Stripe account. Settle on Monday, not in November.",
  },
  {
    q: "What about venue Wi-Fi that dies at sunset?",
    a: "COMPVSS runs offline-first. The gate scanner, the shift clock-in, the incident form — all keep shipping when the cell tower retires for the night. Everything queues. Everything syncs when signal comes back. No scan goes missing.",
  },
  {
    q: "How tight is the security?",
    a: "Tight. Your manifest is walled off from every other org at the database layer — not just in the UI. Every change writes to an immutable audit log. File shares auto-expire. Signed DPA and SOC-2 attestation pack land on Festival tier. Full rider at /trust.",
  },
  {
    q: "Is the AI a parlor trick?",
    a: "No — it works the manifest, not the internet. It reads your projects, budgets, crew, and schedule and drafts riders, RFPs, call sheets, recaps, and safety briefings on demand. Every thread logs to your workspace. Nothing leaks out.",
  },
  {
    q: "What's a KBYG door pass?",
    a: "KBYG = Know Before You Go. One event guide, twelve personas, twelve different reads. Artists see riders + catering + times. Crew sees the call sheet + PPE + radio. Guests see logistics + public times. Written once in ATLVS, rendered per lane in GVTEWAY + COMPVSS.",
  },
  {
    q: "Can I take my data with me?",
    a: "Anytime. CSV exports on every tier. Full data exports on Festival. You own your manifest — full stop.",
  },
  {
    q: "How do I get on the list?",
    a: "Hit \"Doors Open\" — 30 seconds. Or grab a backstage walkthrough with a human who used to book shows for a living.",
  },
];
