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
  title: "The Atlas for Experiential Producers",
  description:
    "The console. The door. The floor. ATLVS · GVTEWAY · COMPVSS — one rig for the producers shipping the nights, residencies, and seasons people fly in for.",
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
  ogImageTitle: "Run the Room.",
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
          By invitation · now on the list
        </div>
        <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
          Run the Room.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
          The Atlas for experiential producers. One console for the office. One door for every guest, artist, and vendor. One pass for the floor. Written for the residencies that sell out, the nights the press doesn&apos;t cover, the seasons people fly in for.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/signup" size="lg">Get on the List</Button>
          <Button href="/contact" size="lg" variant="secondary">Private Walkthrough</Button>
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
            A live door-pass — what your guest sees on their phone tonight. Signed in-place.
          </p>
        </div>
      </section>

      <LogoCloud />

      {/* Three-app showcase */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-16">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">
            The rig · three rooms · one Atlas
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            ATLVS · GVTEWAY · COMPVSS
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--text-secondary)]">
            The office, the door, the floor. Three rooms reading the same manifest. Built by producers, for the ones who book the rooms people talk about.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              slug: "atlvs",
              eyebrow: "ATLVS · The Office",
              title: "The room runs from the desk.",
              body: "Nine rooms, one sidebar. Proposals to payouts, POs to ceremonies. The production studio, quiet and precise.",
              bullets: [
                "Proposals, invoices, POs, crew, schedule — one studio",
                "AI drafts riders, RFPs, and recaps from your own manifest",
                "Every change logged — who, when, before, after",
              ],
              href: "/solutions/atlvs",
            },
            {
              slug: "gvteway",
              eyebrow: "GVTEWAY · The Door",
              title: "Every guest, their own way in.",
              body: "Artists, vendors, clients, sponsors, guests, crew, delegations, media, VIPs, volunteers, athletes. Twelve doors. One manifest. Each lane private by design.",
              bullets: [
                "Live artist advancing with deliverables",
                "Proposals signed in place — twenty-three block types",
                "Per-persona Know-Before-You-Go door passes",
              ],
              href: "/solutions/gvteway",
            },
            {
              slug: "compvss",
              eyebrow: "COMPVSS · The Floor",
              title: "The night, in your pocket.",
              body: "Gate scan, shift clock-in, medic triage, crisis alerts, driver manifest, guard tour. Offline-first. The tower can tap out — you don&apos;t.",
              bullets: [
                "Sub-100ms QR + barcode scans, signal or none",
                "Shift check-in with meal credits and breaks",
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
          { value: "<100ms", label: "gate scan, offline or on" },
        ]}
      />

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">The Rig</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl text-balance">
            Everything the Room Needs.
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Written by producers, for the producers who ship the nights.
          </p>
        </div>
        <div className="mt-10">
          <FeatureGrid
            cols={4}
            features={[
              { icon: FileSignature, title: "Proposals · signed live", body: "Twenty-three block types. Sign-in-place. One URL stands in for the PDF thread.", href: "/features/proposals" },
              { icon: Sparkles, title: "KBYG door passes", body: "One guide, twelve reads. Every persona sees its own lane.", href: "/features/guides" },
              { icon: QrCode, title: "Gate + ticket scan", body: "Sub-100ms scan, offline or on. Precise at 15k/night.", href: "/features/ticketing" },
              { icon: Users, title: "Advancing", body: "Riders, input lists, stage plots, catering, travel — typed, not texted.", href: "/features/advancing" },
              { icon: DollarSign, title: "Finance + payouts", body: "Invoices, expenses, budgets, live vendor payouts. ACH, card, wire.", href: "/features/finance" },
              { icon: ClipboardCheck, title: "Procurement", body: "Reqs, POs, vendor COIs, W-9s — one file cabinet, quiet as the back bar.", href: "/features/procurement" },
              { icon: Zap, title: "AI runner", body: "Drafts riders, recaps, and RFPs from your manifest — never the public internet.", href: "/features/ai" },
              { icon: ShieldCheck, title: "Tour-grade security", body: "Signed DPA. Immutable audit log. 99.9% uptime. Members&apos;-Suite standard.", href: "/features/compliance" },
            ]}
          />
        </div>
      </section>

      {/* Built for section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">The Rooms We Ship.</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {[
            { slug: "live-events", title: "Residencies + nights", sub: "Sold-out weeks, recurring programming" },
            { slug: "fabrication", title: "Scenic + fabrication", sub: "Build shops, custom installs" },
            { slug: "touring", title: "Touring", sub: "Multi-city runs, per-city advancing" },
            { slug: "corporate", title: "Private programs", sub: "Launches, summits, closed-room" },
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
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">The Studio</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Written by Producers. For the Ones Who Ship the Nights.</h2>
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                The Atlas is a decade of ship-it-Saturday instinct made quiet and precise. Every module came out of a load-in that didn&apos;t go to plan. Every tab in the sidebar is a thing we were tired of building twice.
              </p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                One manifest. Three rooms. Your org&apos;s data private by architecture — walled at the database, not in the marketing. Built for the producers who book the rooms and don&apos;t post about it.
              </p>
              <div className="mt-6">
                <Button href="/about" variant="secondary" size="sm">Read the Credo</Button>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                "Your manifest walled off at the database — private by architecture",
                "Live vendor payouts — ACH, card, international wire. Settle clean.",
                "File shares that self-destruct. No public buckets. No 2 a.m. leaks.",
                "Offline gate scan — the cell tower&apos;s problem, not yours",
                "AI grounded in your lineup, crew, and budget — never the public internet",
                "Every change logged — who, when, before, after. Forever.",
                "Three rooms, one Atlas: console, door, floor",
                "KBYG door passes — one manifest, every persona its own view",
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
        title="From the Studio · FAQ"
        faqs={HOME_FAQ}
      />

      <CTASection />
    </>
  );
}

const HOME_FAQ = [
  {
    q: "What is the Atlas?",
    a: "The operating system for experiential producers. Three rooms — ATLVS (the office), GVTEWAY (the door), COMPVSS (the floor) — sharing one manifest. Written by the producers who ship the nights, for the ones who do the same.",
  },
  {
    q: "Who is it written for?",
    a: "The producer running multi-night residencies, festival programs, brand activations, touring productions, experiential campaigns. The one who has staffed a 15,000-guest Saturday and a 40-guest private dinner in the same month. If that sounds like your week, this was written for you.",
  },
  {
    q: "Which rooms do you run well?",
    a: "Residencies, sold-out weeks, touring runs, scenic + fab shops, private launches, corporate summits, experiential campaigns, immersive installations, broadcast compounds. If it has a call sheet and a guest list, it belongs here.",
  },
  {
    q: "What are ATLVS, GVTEWAY, and COMPVSS?",
    a: "Three rooms. ATLVS — the production studio runs here (projects, finance, procurement, people, AI). GVTEWAY — twelve personas, each with their own door (artist, vendor, client, sponsor, guest, crew, delegation, media, VIP, hospitality, volunteer, athlete). COMPVSS — the floor PWA: gate scan, shift check-in, incident, medic, driver, guard, warehouse.",
  },
  {
    q: "How does the door work?",
    a: "GA is open to everyone — free, forever. Three seats, basic projects and ticketing. All-Access steps you up. Headliner opens the studio. Festival is the Members' Suite. Full ticket chart at /pricing.",
  },
  {
    q: "How do the payouts move?",
    a: "Clients settle by card or ACH. Vendors get paid live — ACH, card, international wire. We never touch the money; payouts route through your connected Stripe account. Settle clean, settle fast.",
  },
  {
    q: "Venue Wi-Fi retires at sunset. Does the floor?",
    a: "No. COMPVSS is offline-first. The gate scanner, the shift clock-in, the incident form — all keep shipping when the cell tower taps out. Everything queues. Everything syncs when signal returns. No scan goes missing.",
  },
  {
    q: "How tight is the privacy?",
    a: "Tight. Your manifest is walled off at the database layer — private by architecture. Every change writes to an immutable audit log. File shares auto-expire. Signed DPA and SOC-2 attestation land on Festival tier. Full security posture at /trust.",
  },
  {
    q: "Is the AI useful or performative?",
    a: "Useful. It reads your projects, budgets, crew, and schedule — never the public internet — and drafts riders, RFPs, call sheets, recaps, and safety briefings on demand. Every thread logs to your workspace. Nothing leaks out.",
  },
  {
    q: "What's a KBYG door pass?",
    a: "Know-Before-You-Go. One guide, twelve personas, twelve different reads. Artists see riders + catering + times. Crew sees call sheet + PPE + radio. Guests see logistics + public times. Written once in ATLVS, rendered per lane in GVTEWAY and COMPVSS.",
  },
  {
    q: "Can I take my manifest with me?",
    a: "Anytime. CSV exports on every tier. Full data exports on Festival. You own the manifest — full stop.",
  },
  {
    q: "How do I get on the list?",
    a: "Hit \"Get on the List\" — thirty seconds. Or request a private walkthrough with someone who's booked the rooms you're trying to run.",
  },
];
