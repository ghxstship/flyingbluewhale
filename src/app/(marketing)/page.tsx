// Home page is fully static. Pin it so Next.js serves pre-rendered HTML
// without a Suspense boundary on client-side nav — no loading flash.
export const dynamic = "force-static";

import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Sparkles,
  FileSignature,
  QrCode,
  DollarSign,
  ClipboardCheck,
} from "lucide-react";
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
  title: "The Itinerary for Cultural Tastemakers",
  description:
    "Every production is a voyage. The Atlas is the itinerary. Three rooms — ATLVS · GVTEWAY · COMPVSS — one manifest, from horizon to homecoming.",
  path: "/",
  keywords: [
    "production management software",
    "event operations platform",
    "live event software",
    "experiential production platform",
    "event advancing tool",
    "crew management software",
    "event ticketing platform",
    "L0ST 1SLAND Technologies",
    "ATLVS",
    "GVTEWAY",
    "COMPVSS",
  ],
  ogImageTitle: "From Horizon to Homecoming.",
});

export default function Home() {
  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          softwareApplicationSchema({
            name: "L0ST 1SLAND Technologies",
            description: SITE.description,
            url: SITE.baseUrl,
            price: "0",
          }),
        ]}
      />

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pt-24 pb-12 text-balance">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
          The manifest · now open for the next crossing
        </div>
        <h1 className="mt-4 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-7xl">
          From Horizon
          <br />
          to Homecoming.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
          Every production is a voyage — a pitch, a run, a wrap. The Atlas is the itinerary that holds all three. Three
          rooms, one manifest. Written for the cultural tastemakers curating the next crossing.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/signup" size="lg">
            Book Passage
          </Button>
          <Button href="/contact" size="lg" variant="secondary">
            Captain&apos;s Briefing
          </Button>
          <Link href="/docs" className="btn btn-ghost btn-lg">
            Read the Itinerary →
          </Link>
        </div>

        {/* M3-03 — Live portal preview. Anon visitors see real product chrome
            (the mmw26-hialeah guest guide) at reduced scale, no signup wall.
            `sandbox=""` blocks scripts, forms, + popups from inside the iframe —
            it's read-only product-eye-candy. `loading="lazy"` defers the paint
            until the iframe enters the viewport, which is below the fold on
            most desktop renders. */}
        <div className="mt-14">
          <div className="elevation-2 relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface-inset)]">
            <div className="flex items-center gap-1.5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2">
              <span
                className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--text-muted)_60%,transparent)]"
                aria-hidden="true"
              />
              <span
                className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--text-muted)_60%,transparent)]"
                aria-hidden="true"
              />
              <span
                className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--text-muted)_60%,transparent)]"
                aria-hidden="true"
              />
              <span className="ml-3 font-mono text-xs text-[var(--text-muted)]">
                lostisland.tech/p/mmw26-hialeah/guide
              </span>
            </div>
            <iframe
              src="/p/mmw26-hialeah/guide"
              title="Live Product Preview — MMW26 Hialeah Guest Guide"
              sandbox=""
              loading="lazy"
              className="h-[640px] w-full bg-[var(--background)]"
            />
          </div>
          <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
            A live boarding pass — what your guest sees on their phone tonight.
          </p>
        </div>
      </section>

      <LogoCloud />

      {/* Three-app showcase */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-16">
        <div className="text-center">
          <div className="text-xs font-semibold tracking-[0.25em] text-[var(--text-muted)] uppercase">
            The itinerary · three rooms · one manifest
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">ATLVS · GVTEWAY · COMPVSS</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--text-secondary)]">
            The bridge, the ports of call, the open deck. Three rooms reading the same manifest. Written by the
            taste-makers&apos; studio for the producers curating the next crossing.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              slug: "atlvs",
              eyebrow: "ATLVS · The Bridge",
              title: "Charts the voyage from the desk.",
              body: "Nine rooms, one sidebar. From pitch to homecoming. Proposals to payouts, POs to ceremonies. The studio&apos;s chart room.",
              bullets: [
                "Proposals, invoices, POs, crew, schedule — one chart room",
                "AI drafts riders, RFPs, and recaps from your manifest",
                "Every change logged — who, when, before, after",
              ],
              href: "/solutions/atlvs",
            },
            {
              slug: "gvteway",
              eyebrow: "GVTEWAY · The Ports of Call",
              title: "Every guest. Their own way aboard.",
              body: "Artists, vendors, clients, sponsors, guests, crew, delegations, media, VIPs, volunteers, athletes. Twelve ports. One manifest. Each lane private by design.",
              bullets: [
                "Live artist advancing with deliverables",
                "Proposals signed in place — twenty-three block types",
                "Per-persona Know-Before-You-Go boarding passes",
              ],
              href: "/solutions/gvteway",
            },
            {
              slug: "compvss",
              eyebrow: "COMPVSS · The Open Deck",
              title: "The night, on the water.",
              body: "Gate scan, shift clock-in, medic triage, crisis alerts, driver manifest, guard tour. Offline-first. Sails on when the signal taps out.",
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
              <div
                className="text-[11px] font-semibold tracking-[0.2em] uppercase"
                style={{ color: "var(--org-primary)" }}
              >
                {app.eyebrow}
              </div>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{app.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{app.body}</p>
              <ul className="mt-4 space-y-1.5 text-xs text-[var(--text-secondary)]">
                {app.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span
                      className="mt-[6px] inline-block h-1 w-1 shrink-0 rounded-full"
                      style={{ background: "var(--org-primary)" }}
                    />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-5 inline-flex items-center gap-1 text-xs font-medium">
                Chart the room <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <StatStrip
        stats={[
          { value: "15k+", label: "guests on the manifest" },
          { value: "98%", label: "riders landed on time" },
          { value: "14→2", label: "days from wrap to invoice" },
          { value: "<100ms", label: "gate scan, signal or none" },
        ]}
      />

      {/* Three-Act Journey */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">The Voyage</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Every Production Has Three Acts.
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            The Atlas holds all three. From the first pitch to the homecoming log book.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              act: "ACT I",
              title: "Depart",
              body: "The pitch becomes a contract. The team gets cast. The advance lands. The manifest opens. Proposals are signed in place, POs route in hours, the rider hits the inbox before the hold expires.",
              stops: [
                "Proposals + e-sig",
                "Contracts + phase gates",
                "Crew cast + credentials",
                "Advancing · 16 deliverables",
                "Manifest + ticketing open",
              ],
            },
            {
              act: "ACT II",
              title: "Sail",
              body: "Load-in hits. The room opens. Twelve ports of call receive their guests. The crew clocks on. The gate scans. The medic triages. The weather shifts — you adjust the itinerary without touching the manifest.",
              stops: [
                "Gate + ticket scan",
                "Shift check-in + meal credits",
                "Live dispatch + A&D",
                "Medic + safeguarding intake",
                "Crisis comms + run-of-show",
              ],
            },
            {
              act: "ACT III",
              title: "Return",
              body: "Load-out starts at sunrise. Vendors get paid out by Monday. The recap writes itself from the log book. The legacy folder holds every cue, every scan, every signature — searchable, exportable, yours.",
              stops: [
                "Vendor payouts · ACH/card/wire",
                "Closeout + disposition",
                "AI-written recap from your data",
                "Immutable audit trail",
                "Knowledge Base for next crossing",
              ],
            },
          ].map((a) => (
            <div key={a.act} className="surface-raised p-6">
              <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--text-muted)] uppercase">{a.act}</div>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">{a.title}</h3>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{a.body}</p>
              <ul className="mt-5 space-y-1.5 text-xs text-[var(--text-secondary)]">
                {a.stops.map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <span
                      className="mt-[6px] inline-block h-1 w-1 shrink-0 rounded-full"
                      style={{ background: "var(--org-primary)" }}
                    />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* XPMS — Experiential Project Management System */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
            The Operating Spine
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            One Address Space. Ten Classes. Six Tiers.
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            XPMS is the schema beneath the apps. Every element of a production is an atom with a deterministic
            identifier, a phase, a class, an experience tier, and a unified XTC code. Class and posting code are the
            same thing.
          </p>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-5">
          {[
            { code: "0000", name: "Executive", accent: "#7c3aed" },
            { code: "1000", name: "Creative", accent: "#ec4899" },
            { code: "2000", name: "Talent", accent: "#f97316" },
            { code: "3000", name: "Marketing", accent: "#eab308" },
            { code: "4000", name: "Build", accent: "#a16207" },
            { code: "5000", name: "Production", accent: "#dc2626" },
            { code: "6000", name: "Operations", accent: "#16a34a" },
            { code: "7000", name: "Experience", accent: "#0891b2" },
            { code: "8000", name: "Hospitality", accent: "#be185d" },
            { code: "9000", name: "Technology", accent: "#0ea5e9" },
          ].map((c) => (
            <div key={c.code} className="surface-raised p-3" style={{ borderTop: `3px solid ${c.accent}` }}>
              <div className="font-mono text-[10px] tracking-widest text-[var(--text-muted)]">{c.code}</div>
              <div className="mt-1 text-sm font-semibold">{c.name}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="surface-raised p-5">
            <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--text-muted)] uppercase">
              XTC Protocol™
            </div>
            <h3 className="mt-2 text-xl font-semibold">One codebook</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Class. Division. Section. Line item. Five digits, 80,190 addresses, append-only forever. The same code
              that classifies the work also posts the cost.
            </p>
          </div>
          <div className="surface-raised p-5">
            <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--text-muted)] uppercase">UAC ↔ TPC</div>
            <h3 className="mt-2 text-xl font-semibold">Dual state, one ledger</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Universal Advance Catalog plans. Total Production Catalog deploys. Variance is a first-class object with a
              reason code — not a reconciliation gap.
            </p>
          </div>
          <div className="surface-raised p-5">
            <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--text-muted)] uppercase">Six Tiers</div>
            <h3 className="mt-2 text-xl font-semibold">Composition, not category</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Social · Digital · Virtual · Physical · Experiential · Theatrical. Every project is a measurable
              composition across the six — not a single label.
            </p>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
            The Itinerary
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Every Port, Every Act.
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Written by the taste-makers&apos; studio, for the producers who curate the crossing.
          </p>
        </div>
        <div className="mt-10">
          <FeatureGrid
            cols={4}
            features={[
              {
                icon: FileSignature,
                title: "Proposals · signed live",
                body: "Twenty-three block types. E-sign in place. The first port every voyage needs.",
                href: "/features/proposals",
              },
              {
                icon: Sparkles,
                title: "Boarding passes (KBYG)",
                body: "One itinerary, twelve reads. Every pass holder sees their own lane.",
                href: "/features/guides",
              },
              {
                icon: QrCode,
                title: "Gate + manifest scan",
                body: "Sub-100ms scan, signal or none. Calm at fifteen thousand a night.",
                href: "/features/ticketing",
              },
              {
                icon: Users,
                title: "Advancing",
                body: "Riders, input lists, stage plots, catering, travel — typed, not texted.",
                href: "/features/advancing",
              },
              {
                icon: DollarSign,
                title: "Finance + payouts",
                body: "Invoices, expenses, budgets, live vendor payouts. ACH, card, wire.",
                href: "/features/finance",
              },
              {
                icon: ClipboardCheck,
                title: "Procurement",
                body: "Reqs, POs, vendor COIs, W-9s — one chart cabinet, quietly archived.",
                href: "/features/procurement",
              },
              {
                icon: Zap,
                title: "AI runner",
                body: "Drafts riders, recaps, and RFPs from your manifest — never the public internet.",
                href: "/features/ai",
              },
              {
                icon: ShieldCheck,
                title: "Charter-grade security",
                body: "Signed DPA. Immutable audit log. 99.9% uptime. Private-charter standard.",
                href: "/features/compliance",
              },
            ]}
          />
        </div>
      </section>

      {/* Built for section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">Crossings We Chart.</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {[
            { slug: "live-events", title: "Residencies + nights", sub: "Sold-out weeks, recurring programming" },
            { slug: "fabrication", title: "Scenic + fabrication", sub: "Build shops, custom installs" },
            { slug: "touring", title: "Touring", sub: "Multi-port runs, per-city advancing" },
            { slug: "corporate", title: "Private programs", sub: "Launches, summits, closed-room" },
          ].map((x) => (
            <Link key={x.slug} href={`/solutions/${x.slug}`} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{x.title}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{x.sub}</div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                Chart it <ArrowRight size={12} />
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
              <div className="text-xs font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
                The Studio
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">The Taste-Makers&apos; Studio.</h2>
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                The Atlas is a decade of crossings made quiet and precise. Every room came out of a load-in that
                didn&apos;t go to plan. Every column on the itinerary is a thing we were tired of charting twice.
              </p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                One manifest. Three rooms. Your org&apos;s data private by architecture — walled at the database, not in
                the marketing. Written for the producers who curate the rooms people fly in for.
              </p>
              <div className="mt-6">
                <Button href="/about" variant="secondary" size="sm">
                  Read the Log Book
                </Button>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                "Your manifest walled off at the database — private by architecture",
                "Live vendor payouts — ACH, card, international wire. Settle on return.",
                "File shares that self-expire. No public buckets. No 2 a.m. leaks.",
                "Offline gate scan — the cell tower&apos;s problem, not the voyage&apos;s",
                "AI grounded in your manifest — never the public internet",
                "Every change logged — who, when, before, after. Forever.",
                "Three rooms, one Atlas: bridge, ports of call, open deck",
                "Boarding passes (KBYG) — one itinerary, every pass holder its own read",
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

      <FAQSection title="From the Log Book · FAQ" faqs={HOME_FAQ} />

      <CTASection />
    </>
  );
}

const HOME_FAQ = [
  {
    q: "What is the Atlas?",
    a: "The itinerary platform for cultural tastemakers. Three rooms — ATLVS (the bridge), GVTEWAY (the ports of call), COMPVSS (the open deck) — sharing one manifest. Every production is a voyage with three acts; the Atlas holds all three.",
  },
  {
    q: "Who is it written for?",
    a: "The cultural tastemaker. The producer running multi-night residencies, festival programs, brand activations, touring productions, experiential campaigns. The one who has booked a 15,000-guest Saturday and a 40-guest private dinner in the same week.",
  },
  {
    q: "Which crossings do you chart well?",
    a: "Residencies, sold-out weeks, touring runs, scenic and fabrication shops, private launches, corporate summits, experiential campaigns, immersive installations, broadcast compounds. If it has an itinerary and a manifest, it belongs here.",
  },
  {
    q: "What are ATLVS, GVTEWAY, and COMPVSS?",
    a: "Three rooms. ATLVS — the bridge (projects, finance, procurement, people, AI). GVTEWAY — twelve ports of call, one per persona (artist, vendor, client, sponsor, guest, crew, delegation, media, VIP, hospitality, volunteer, athlete). COMPVSS — the open deck PWA: gate scan, shift check-in, incident, medic, driver, guard, warehouse.",
  },
  {
    q: "How does passage work?",
    a: "GA is open — free, forever. Three seats, basic crossings. All-Access steps you up. Headliner opens the bridge. Private Charter is the Admiral&apos;s table. Full passage chart at /pricing.",
  },
  {
    q: "How do the payouts move?",
    a: "Clients settle by card or ACH. Vendors get paid on the open water — ACH, card, international wire. We never touch the money; payouts route through your connected Stripe account. Settle clean, settle fast.",
  },
  {
    q: "Venue Wi-Fi retires at sunset. Does the deck?",
    a: "No. COMPVSS sails offline-first. The gate scanner, the shift clock-in, the incident form — all keep shipping when the cell tower taps out. Everything queues. Everything syncs when signal returns.",
  },
  {
    q: "How tight is the privacy?",
    a: "Tight. Your manifest is walled at the database layer — private by architecture. Every change writes to an immutable log. File shares self-expire. Signed DPA and SOC-2 attestation land on Private Charter. Full posture at /trust.",
  },
  {
    q: "Is the AI useful or performative?",
    a: "Useful. It reads your manifest — never the public internet — and drafts riders, RFPs, call sheets, recaps, and safety briefings on demand. Every thread logs to your workspace.",
  },
  {
    q: "What&apos;s a KBYG boarding pass?",
    a: "Know-Before-You-Go. One itinerary, twelve personas, twelve different reads. Artists see riders + catering + times. Crew sees call sheet + PPE + radio. Guests see logistics + public times. Written once in ATLVS, rendered per lane in GVTEWAY and COMPVSS.",
  },
  {
    q: "Can I take the manifest with me?",
    a: "Anytime. CSV exports on every tier. Full data exports on Private Charter. You own the manifest — full stop.",
  },
  {
    q: "How do I book passage?",
    a: 'Hit "Book Passage" — thirty seconds to the open sea. Or request a captain&apos;s briefing with someone who&apos;s charted the rooms you&apos;re running.',
  },
];
