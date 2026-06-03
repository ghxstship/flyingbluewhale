// Marketing home — GHXSTSHIP "Deep Space Voyage" visual system applied
// to the ATLVS Technologies surface (the Technology vertical of
// GHXSTSHIP, shipping on atlvs.pro). The IA mirrors the design handoff:
// hero (Beyond The Scene) → boarding strip → trust + marquee → booking
// stepper → destinations → charters → itinerary → the difference →
// the bridge (ATLVS · COMPVSS · GVTEWAY) → the crew → past voyages
// (FIDS departures board) → history → FAQ → captain's log → CTA.

import Link from "next/link";
import type { Metadata } from "next";
import { FAQSection } from "@/components/marketing/FAQ";
import { JsonLd } from "@/components/marketing/JsonLd";
import { buildMetadata, organizationSchema, softwareApplicationSchema, websiteSchema, SITE } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "ATLVS — Production Runs On It",
  description:
    "ATLVS · COMPVSS · GVTEWAY — proprietary production, workforce, and ticketing software from GHXSTSHIP. The bridge, the compass, the gateway — one connected system for experiential production at scale.",
  path: "/",
  languages: {
    "es-ES": `${SITE.baseUrl}/es-ES`,
    "pt-BR": `${SITE.baseUrl}/pt-BR`,
  },
  keywords: [
    "production management software",
    "event operations platform",
    "live event software",
    "festival operations platform",
    "experiential production platform",
    "ATLVS Technologies",
    "GHXSTSHIP",
    "ATLVS",
    "COMPVSS",
    "GVTEWAY",
  ],
  ogImageTitle: "Production Runs On It.",
});

const DESTINATIONS: Array<{ code: string; icon: string; title: string; body: string; href: string }> = [
  {
    code: "DEST · FST",
    icon: "♪",
    title: "Festivals",
    body: "Multi-stage infrastructure and headliner experiences at scale.",
    href: "/solutions/festivals-tours",
  },
  {
    code: "DEST · TUR",
    icon: "♫",
    title: "Concerts & Tours",
    body: "Show production and multi-city routing for live music.",
    href: "/solutions/concerts",
  },
  {
    code: "DEST · ACT",
    icon: "✦",
    title: "Brand Activations",
    body: "Experiential marketing, pop-ups, and environments that convert.",
    href: "/solutions/brand-activations",
  },
  {
    code: "DEST · IMM",
    icon: "◆",
    title: "Immersive Experiences",
    body: "Narrative installations and worlds audiences step inside.",
    href: "/solutions/immersive-experiences",
  },
  {
    code: "DEST · SPT",
    icon: "▲",
    title: "Sporting Events",
    body: "Stadium activations, fan experiences, and game-day production.",
    href: "/solutions/live-events",
  },
  {
    code: "DEST · TVF",
    icon: "▣",
    title: "TV, Film & Broadcast",
    body: "Live broadcast, content capture, and on-air activations.",
    href: "/solutions/broadcast-tv-film",
  },
  {
    code: "DEST · COR",
    icon: "■",
    title: "Corporate & AGM",
    body: "Summits, AGMs, internal kickoffs, premium hospitality.",
    href: "/solutions/corporate-events",
  },
  {
    code: "DEST · THE",
    icon: "◉",
    title: "Theatrical",
    body: "Productions, residencies, rep seasons, touring theatre.",
    href: "/solutions/theatrical-performances",
  },
];

const CHARTERS = [
  {
    id: "Full Voyage",
    title: "Full Voyage",
    tag: "All eight phases",
    body: "All eight phases of the production lifecycle, Pitch to Wrap — one workspace, one schema, total accountability.",
  },
  {
    id: "By App",
    title: "By Vertical",
    tag: "Select instruments",
    body: "Adopt ATLVS, COMPVSS, or GVTEWAY individually. Same database, one app at a time.",
  },
  {
    id: "À La Carte",
    title: "À La Carte",
    tag: "Your modules",
    body: "Select individual modules — RFIs, advancing, inspections, gate scan. A custom charter for your scope.",
  },
];

const ITINERARY: Array<{ n: string; name: string; sub: string; term?: boolean }> = [
  { n: "01", name: "Discovery", sub: "Consult · Scope", term: true },
  { n: "02", name: "R&D", sub: "Feasibility" },
  { n: "03", name: "Design", sub: "Direction" },
  { n: "04", name: "Compliance", sub: "Eng · Safety" },
  { n: "05", name: "Build", sub: "Fabrication" },
  { n: "06", name: "Operations", sub: "Logistics" },
  { n: "07", name: "Activation", sub: "Showtime" },
  { n: "08", name: "Strike", sub: "Settle · Wrap", term: true },
];

const INSTRUMENTS = [
  {
    slug: "atlvs",
    eyebrow: "The Atlas",
    title: "ATLVS",
    tag: "Production & resource mgmt",
    body: "Your maps and charts — projects, RFIs, submittals, daily logs, advancing, finance, procurement, AI. Pitch through wrap, all in one console.",
    href: "/solutions/atlvs",
  },
  {
    slug: "compvss",
    eyebrow: "The Compass",
    title: "COMPVSS",
    tag: "Workforce & crew",
    body: "Points the crew — scheduling, certifications, gate scan, shift clock-in, incidents, medical. Offline-first PWA. Sub-100ms field operations.",
    href: "/solutions/compvss",
  },
  {
    slug: "gvteway",
    eyebrow: "The Gateway",
    title: "GVTEWAY",
    tag: "Ticketing & fans",
    body: "The gate audiences pass through — ticketing, proposals, twelve personas. Artists, vendors, clients, sponsors, guests — each their lane.",
    href: "/solutions/gvteway",
  },
];

const CREW = [
  { rank: "Captain", role: "Executive Producer", body: "Owns the vision and the voyage, end to end." },
  { rank: "First Mate", role: "Production Director", body: "Runs the show floor and the build." },
  { rank: "Navigator", role: "Project Management", body: "Charts the itinerary, holds the timeline." },
  { rank: "Quartermaster", role: "Logistics & Ops", body: "Crew, vendors, freight, and load-in." },
  { rank: "Bosun", role: "Technical Director", body: "Audio, lighting, video, rigging, power." },
];

const VOYAGES = [
  {
    code: "RRR 312",
    title: "Black Coffee at the Race Track",
    sub: "Concert Experience · Miami Music Week · Club Space",
    year: "2026",
    status: "ontime",
    statusLabel: "Boarding",
  },
  {
    code: "RRR 226",
    title: "Polymarket Grocery Store",
    sub: "Brand Activation · Miami",
    year: "2026",
    status: "ontime",
    statusLabel: "Arrived",
  },
  {
    code: "RRR 052",
    title: "Salvage City Supper Club",
    sub: "Immersive Experience · Club Space · Miami",
    year: "2025",
    status: "ontime",
    statusLabel: "Arrived",
  },
  {
    code: "RRR 108",
    title: "PATRÓN Cristalino × Becky G",
    sub: "Product Launch · Los Angeles",
    year: "2024",
    status: "departed",
    statusLabel: "Logged",
  },
  {
    code: "RRR 023",
    title: "Heineken Turn 4 Nightclub",
    sub: "Motorsports · F1 Las Vegas Grand Prix",
    year: "2024",
    status: "departed",
    statusLabel: "Logged",
  },
  {
    code: "RRR 311",
    title: "Red Bull Unforeseen Motel",
    sub: "Brand Activation · III Points · Miami",
    year: "2023",
    status: "departed",
    statusLabel: "Logged",
  },
  {
    code: "RRR 001",
    title: "Formula 1 Las Vegas Grand Prix",
    sub: "Motorsports · Las Vegas",
    year: "2023",
    status: "departed",
    statusLabel: "Logged",
  },
];

const HOME_FAQ = [
  {
    q: "What does the platform do?",
    a: "Three connected instruments built on one database. ATLVS — the Atlas — is the production operations console: RFIs, submittals, daily logs, punch, advancing, finance, procurement, AI. COMPVSS — the Compass — is the offline-first field PWA: gate scan, shift clock-in, incidents, medical. GVTEWAY — the Gateway — is the stakeholder portal: twelve personas, each their lane. Same record across all three.",
  },
  {
    q: "Who's it for?",
    a: "Production teams running real live work. Festivals, residencies, touring, fabrication shops, brand activations, broadcast compounds, private events. The schema is generic; the vernacular is specific. If your org has a load-in, a manifest, vendors, and a wrap — it fits.",
  },
  {
    q: "How does pricing work?",
    a: "Per org, not per seat. Free forever for small teams. Crew opens up the team. Production unlocks every module + multi-project. Festival is multi-org with SSO, custom DPA, and 99.9% SLA. Full grid at /pricing.",
  },
  {
    q: "How do vendor payouts work?",
    a: "Stripe Connect. Vendors onboard a payout account through their portal. You approve the PO. Payouts route directly. Money never crosses our books. ACH, card, international wire. Signed webhooks for every event.",
  },
  {
    q: "Does the field app actually work offline?",
    a: "Yes. COMPVSS is an offline-first PWA. Gate scan, shift clock-in, daily log, incident, medic intake — all queue locally and sync on signal return. Sub-100ms scan even on one-bar LTE. Tested at 15,000-guest gates.",
  },
  {
    q: "Is ATLVS Technologies part of GHXSTSHIP?",
    a: "Yes. ATLVS Technologies is the Technology vertical of GHXSTSHIP — the parent experiential production, operations, and technology company headquartered in Miami. ATLVS, COMPVSS, and GVTEWAY are the three proprietary instruments GHXSTSHIP builds in-house.",
  },
  {
    q: "How tight is the security?",
    a: "RLS at the database — your tenant is walled off in Postgres, not in the app layer. Every change writes to an immutable audit log (actor, IP, user agent, before/after). Signed webhooks (HMAC-SHA256). File shares self-expire. SOC-2 attestation + custom DPA on Festival tier.",
  },
  {
    q: "Is the AI useful or marketing?",
    a: "Useful. It reads your workspace data — never the public internet — and drafts riders, RFPs, call sheets, recaps, safety briefs, and incident reports. Streaming, conversation-persisted in your tenant. Anthropic Claude under the hood.",
  },
  {
    q: "Can I export my data?",
    a: "Always. CSV exports on every tier from every list view. Full data export via Settings → Exports on Production+. You own the database; we host it. Cancel and you get a 90-day read-only window to pull everything.",
  },
];

const LOGS = [
  { date: "2026 · 05 · 28", cat: "Field Notes", title: "How the 8-Phase Line keeps a build on course", href: "/blog" },
  { date: "2026 · 05 · 12", cat: "Release", title: "Advancing v2 — 16 typed deliverables ship", href: "/changelog" },
  { date: "2026 · 04 · 30", cat: "Crew Call", title: "Now boarding — join the Skeleton Crew", href: "/careers" },
];

export default function Home() {
  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          websiteSchema(),
          softwareApplicationSchema({
            name: "ATLVS Technologies",
            description: SITE.description,
            url: SITE.baseUrl,
            price: "0",
          }),
        ]}
      />

      {/* HERO — Beyond The Scene */}
      <section className="relative overflow-hidden px-6 pt-8 pb-20 sm:pt-12">
        {/* halftone fade behind the hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background: "radial-gradient(var(--gx-ink-3, var(--border)) 1.4px, transparent 1.5px) 0 0/26px 26px",
            WebkitMaskImage: "radial-gradient(120% 90% at 70% 0%, #000, transparent)",
            maskImage: "radial-gradient(120% 90% at 70% 0%, #000, transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl">
          {/* Boarding strip — live departures ticker */}
          <p className="gx-boardingstrip" role="status" aria-live="polite">
            <span className="gx-boardingstrip__now">Now Departing</span>
            <span className="gx-boardingstrip__ticker">
              <span>
                Miami · New York · Chicago · Los Angeles · On time · Gate G26 · Boarding all rows · Voyages active
              </span>
            </span>
          </p>

          <div className="grid items-center gap-10 md:grid-cols-[1.4fr_0.9fr]">
            <div>
              <p className="gx-eyebrow no-dot mb-5">Production · Operations · Technology</p>
              <h1 className="gx-display-xl">
                <span style={{ color: "var(--gx-brass, var(--org-primary))" }}>B</span>eyond
                <br />
                <span style={{ color: "var(--gx-brass, var(--org-primary))" }}>T</span>he
                <br />
                <span style={{ color: "var(--gx-brass, var(--org-primary))" }}>S</span>cene
              </h1>
              <p className="mt-6 max-w-xl text-[19px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Three apps, one schema. ATLVS runs the production. COMPVSS runs the field. GVTEWAY runs the portal.
                Pitch to wrap — pre-pro through strike — one connected bridge for experiential production at scale.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/signup" className="gx-btn">
                  Book Your Voyage
                </Link>
                <Link href="#destinations" className="gx-btn gx-btn--ghost">
                  Explore Destinations ↗
                </Link>
              </div>
            </div>
            <div className="hidden place-items-center md:grid">
              <div
                className="relative grid h-[280px] w-[280px] place-items-center rounded-full"
                style={{
                  background: "var(--gx-ink, var(--surface))",
                  border: "6px solid var(--gx-brass, var(--org-primary))",
                  boxShadow: "14px 14px 0 var(--gx-brass-deep, var(--org-secondary))",
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-3 rounded-full"
                  style={{ border: "2px solid var(--gx-ink-3, var(--border))" }}
                />
                <div
                  className="font-display text-7xl leading-none font-black uppercase"
                  style={{ color: "var(--gx-brass, var(--org-primary))" }}
                >
                  RRR
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR + MARQUEE */}
      <div className="gx-trustbar">
        <div className="mx-auto max-w-6xl px-6">
          <p className="gx-trustbar__lbl">Trusted by the brands behind the moments</p>
          <div className="gx-trustbar__logos">
            <span>RED BULL</span>
            <span>HEINEKEN</span>
            <span>FORMULA 1</span>
            <span>INSOMNIAC</span>
            <span>PATRÓN</span>
            <span>POLYMARKET</span>
          </div>
        </div>
      </div>
      <div className="gx-marquee" aria-hidden="true">
        <div className="gx-marquee__track">
          <span>FESTIVALS</span>
          <span>CONCERTS &amp; TOURS</span>
          <span>BRAND ACTIVATIONS</span>
          <span>IMMERSIVE</span>
          <span>SPORTING</span>
          <span>TV · FILM · BROADCAST</span>
          <span>CORPORATE</span>
          <span>HOSPITALITY</span>
          <span>FESTIVALS</span>
          <span>CONCERTS &amp; TOURS</span>
          <span>BRAND ACTIVATIONS</span>
          <span>IMMERSIVE</span>
        </div>
      </div>

      {/* BOOKING STEPPER */}
      <nav className="gx-stepper" aria-label="How booking works">
        <div className="gx-stepper__row">
          <Link href="#destinations" className="gx-bstep">
            <span className="gx-bstep__n">01</span>
            <span>
              <span className="gx-bstep__l">Step One</span>
              <span className="gx-bstep__t">Choose Destination</span>
            </span>
          </Link>
          <Link href="#charters" className="gx-bstep">
            <span className="gx-bstep__n">02</span>
            <span>
              <span className="gx-bstep__l">Step Two</span>
              <span className="gx-bstep__t">Pick Your Charter</span>
            </span>
          </Link>
          <Link href="#itinerary" className="gx-bstep">
            <span className="gx-bstep__n">03</span>
            <span>
              <span className="gx-bstep__l">Step Three</span>
              <span className="gx-bstep__t">Chart Itinerary</span>
            </span>
          </Link>
          <Link href="#bridge" className="gx-bstep">
            <span className="gx-bstep__n">04</span>
            <span>
              <span className="gx-bstep__l">Step Four</span>
              <span className="gx-bstep__t">Meet the Bridge</span>
            </span>
          </Link>
          <Link href="#book" className="gx-bstep is-cta">
            <span className="gx-bstep__n">05</span>
            <span>
              <span className="gx-bstep__l">Step Five</span>
              <span className="gx-bstep__t">Launch</span>
            </span>
          </Link>
        </div>
      </nav>

      {/* DESTINATIONS */}
      <section id="destinations" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="gx-eyebrow">Step 01 · Choose Your Destination</p>
          <h2 className="gx-display-m mt-3">Where To?</h2>
          <p className="mt-4 max-w-3xl text-lg" style={{ color: "var(--text-muted)" }}>
            Start with where you&apos;re headed. Each destination is a kind of production our platform serves — pick
            yours, and the schema speaks your vernacular.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {DESTINATIONS.map((d) => (
              <Link key={d.code} href={d.href} className="gx-card block p-6">
                <span
                  className="font-mono text-[11px] tracking-[0.14em]"
                  style={{ color: "var(--gx-plasma, var(--org-accent))" }}
                >
                  {d.code}
                </span>
                <div
                  className="font-display mt-3 mb-3 text-2xl"
                  style={{ color: "var(--gx-brass, var(--org-primary))" }}
                >
                  {d.icon}
                </div>
                <h3 className="font-display text-xl leading-tight font-black uppercase">{d.title}</h3>
                <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  <strong style={{ color: "var(--text)" }}>{d.title}</strong> — {d.body}
                </p>
              </Link>
            ))}
            <Link
              href="/solutions"
              className="gx-card block p-6"
              style={{
                background: "var(--gx-brass, var(--org-primary))",
                borderColor: "var(--gx-ink, var(--border))",
              }}
            >
              <span
                className="font-mono text-[11px] tracking-[0.14em]"
                style={{ color: "var(--gx-ink, var(--background))" }}
              >
                DEST · ALL
              </span>
              <div className="font-display mt-3 mb-3 text-2xl" style={{ color: "var(--gx-ink, var(--background))" }}>
                ↗
              </div>
              <h3
                className="font-display text-xl leading-tight font-black uppercase"
                style={{ color: "var(--gx-ink, var(--background))" }}
              >
                All Solutions
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--gx-ink, var(--background))" }}>
                Hospitality, corporate &amp; private events too. Tell us where you&apos;re headed.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* CHARTERS */}
      <section
        id="charters"
        className="px-6 py-20"
        style={{
          background: "var(--gx-ink, var(--surface-2))",
          borderTop: "4px solid var(--gx-ink-3, var(--border))",
          borderBottom: "4px solid var(--gx-ink-3, var(--border))",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <p className="gx-eyebrow">Step 02 · Choose Your Charter</p>
          <h2 className="gx-display-m mt-3">Charter Your Way.</h2>
          <p className="mt-4 max-w-3xl text-lg" style={{ color: "var(--text-muted)" }}>
            Adopt the platform as far as you like — charter the full voyage end to end, take a single app, or pick
            exactly the modules you need.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {CHARTERS.map((c) => (
              <article key={c.id} className="gx-card p-7">
                <span
                  className="font-mono text-[11px] tracking-[0.14em] uppercase"
                  style={{ color: "var(--gx-brass, var(--org-primary))" }}
                >
                  ◆ Express
                </span>
                <h3 className="font-display mt-2 text-3xl font-black uppercase">{c.title}</h3>
                <span
                  className="mt-1 inline-block font-mono text-[11px] uppercase"
                  style={{ color: "var(--gx-plasma, var(--org-accent))" }}
                >
                  {c.tag}
                </span>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {c.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ITINERARY */}
      <section id="itinerary" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="gx-eyebrow">Step 03 · Chart Your Itinerary</p>
          <h2 className="gx-display-m mt-3">Your Itinerary.</h2>
          <p className="mt-4 max-w-3xl text-lg" style={{ color: "var(--text-muted)" }}>
            Every production runs through the same eight-phase lifecycle — Discovery to Strike. The schema follows the
            phases, the audit log follows the schema, and every gate blocks the next leg until the previous closes.
          </p>
          <div className="mt-12">
            <div className="gx-smap__line">
              {ITINERARY.map((s) => (
                <div key={s.n} className={`gx-smap__stop ${s.term ? "is-terminus" : ""}`}>
                  <div className="gx-smap__dot">{s.n}</div>
                  <div className="gx-smap__name">{s.name}</div>
                  <div className="gx-smap__sub">{s.sub}</div>
                </div>
              ))}
            </div>
            <p className="gx-coords mt-10">
              The ATLVS Line — every voyage runs all eight stops. One schema, one charted course.
            </p>
          </div>
        </div>
      </section>

      {/* THE DIFFERENCE */}
      <section
        className="px-6 py-20"
        style={{
          background: "var(--gx-ink, var(--surface-2))",
          borderTop: "4px solid var(--gx-ink-3, var(--border))",
          borderBottom: "4px solid var(--gx-ink-3, var(--border))",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <p className="gx-eyebrow">Why ATLVS</p>
          <h2 className="gx-display-m mt-3">The Difference.</h2>
          <p className="mt-4 max-w-3xl text-lg" style={{ color: "var(--text-muted)" }}>
            Most production-operations stacks bolt together a CRM, a project tool, a doc tool, and a ticketing
            integration. We own the entire voyage — and built every instrument that ships with it.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                id: "Edge 01",
                title: "End to End",
                tag: "One schema",
                body: "Pitch through wrap, all eight phases, in one workspace. No integration tax.",
              },
              {
                id: "Edge 02",
                title: "We Build the Tech",
                tag: "Proprietary software",
                body: "ATLVS, COMPVSS, and GVTEWAY are built in-house. No vendor lock-in dressed up as integrations.",
              },
              {
                id: "Edge 03",
                title: "Per Org, Not Per Seat",
                tag: "Add the whole crew",
                body: "The whole production team, every freelancer, every vendor. Pricing scales with you, not your headcount.",
              },
            ].map((e) => (
              <article key={e.id} className="gx-card p-7">
                <span
                  className="font-mono text-[11px] tracking-[0.14em] uppercase"
                  style={{ color: "var(--gx-brass, var(--org-primary))" }}
                >
                  {e.id}
                </span>
                <h3 className="font-display mt-2 text-2xl font-black uppercase">{e.title}</h3>
                <span
                  className="mt-1 inline-block font-mono text-[11px] uppercase"
                  style={{ color: "var(--gx-plasma, var(--org-accent))" }}
                >
                  {e.tag}
                </span>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {e.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* THE BRIDGE — ATLVS · COMPVSS · GVTEWAY */}
      <section id="bridge" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="gx-eyebrow">Aboard Every Ship</p>
          <h2 className="gx-display-m mt-3">The Bridge.</h2>
          <p className="mt-4 max-w-3xl text-lg" style={{ color: "var(--text-muted)" }}>
            The bridge is where every voyage is steered — our three proprietary instruments, built in-house. One
            connected system that powers experiential production at scale.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {INSTRUMENTS.map((p) => (
              <Link key={p.slug} href={p.href} data-platform={p.slug} className="gx-card relative block p-7">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: "var(--org-primary)" }}
                />
                <span
                  className="font-mono text-[11px] tracking-[0.14em] uppercase"
                  style={{ color: "var(--org-primary)" }}
                >
                  {p.eyebrow}
                </span>
                <h3 className="font-display mt-2 text-4xl font-black uppercase">{p.title}</h3>
                <span
                  className="mt-1 inline-block font-mono text-[11px] uppercase"
                  style={{ color: "var(--gx-plasma, var(--org-accent))" }}
                >
                  {p.tag}
                </span>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {p.body}
                </p>
                <div className="mt-5 font-mono text-xs" style={{ color: "var(--gx-brass, var(--org-primary))" }}>
                  Walk the room ↗
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SKELETON CREW (the studio) */}
      <section
        className="px-6 py-20"
        style={{
          background: "var(--gx-ink, var(--surface-2))",
          borderTop: "4px solid var(--gx-ink-3, var(--border))",
          borderBottom: "4px solid var(--gx-ink-3, var(--border))",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <p className="gx-eyebrow">Step 04 · Meet the Skeleton Crew</p>
          <h2 className="gx-display-m mt-3">The Skeleton Crew.</h2>
          <p className="mt-4 max-w-3xl text-lg" style={{ color: "var(--text-muted)" }}>
            ATLVS Technologies is built by people who&apos;ve run the load-in. Every founder, every engineer, every PM
            has shipped a real show. Small by design, legendary by reputation.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {CREW.map((c) => (
              <article key={c.role} className="gx-card flex items-center gap-4 p-6">
                <div
                  className="font-display grid h-14 w-14 flex-none place-items-center rounded-full text-xl font-black"
                  style={{
                    background: "var(--gx-ink, var(--surface))",
                    border: "3px solid var(--gx-brass, var(--org-primary))",
                    color: "var(--gx-brass, var(--org-primary))",
                  }}
                  aria-hidden
                >
                  {c.rank.charAt(0)}
                </div>
                <div>
                  <div
                    className="font-mono text-[10px] tracking-[0.14em] uppercase"
                    style={{ color: "var(--gx-plasma, var(--org-accent))" }}
                  >
                    {c.rank}
                  </div>
                  <h3 className="font-display mt-1 text-lg leading-tight font-black uppercase">{c.role}</h3>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    {c.body}
                  </p>
                </div>
              </article>
            ))}
            <Link
              href="/careers"
              className="gx-card flex items-center gap-4 p-6"
              style={{
                background: "var(--gx-brass, var(--org-primary))",
                borderColor: "var(--gx-ink, var(--border))",
              }}
            >
              <div
                className="font-display grid h-14 w-14 flex-none place-items-center rounded-full text-xl font-black"
                style={{ background: "var(--gx-ink, var(--surface))", color: "var(--gx-bone, var(--text))" }}
                aria-hidden
              >
                ↗
              </div>
              <div>
                <div
                  className="font-mono text-[10px] tracking-[0.14em] uppercase"
                  style={{ color: "var(--gx-brass-deep, var(--org-secondary))" }}
                >
                  Now Boarding
                </div>
                <h3
                  className="font-display mt-1 text-lg leading-tight font-black uppercase"
                  style={{ color: "var(--gx-ink, var(--background))" }}
                >
                  Join the Crew
                </h3>
                <p className="mt-1 text-xs" style={{ color: "var(--gx-ink, var(--background))" }}>
                  Engineers, PMs, designers. Learn the ropes ↗
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* PAST VOYAGES — FIDS departures board */}
      <section id="voyages" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="gx-eyebrow">The Archives · Case Studies</p>
              <h2 className="gx-display-m mt-3">Past Voyages.</h2>
            </div>
            <p className="max-w-md text-sm" style={{ color: "var(--text-muted)" }}>
              Before you book, browse the archives — a selection of voyages teams have charted with the platform. Every
              one a destination reached.
            </p>
          </div>
          <div className="gx-fids mt-10">
            <div className="gx-fids__head">
              <div className="gx-fids__ttl">▣ Arrivals</div>
              <div className="gx-fids__clock">22:47 EST</div>
            </div>
            <div className="gx-fids__row gx-fids__row--head">
              <span>Voyage</span>
              <span>Destination</span>
              <span>Year</span>
              <span>Status</span>
            </div>
            {VOYAGES.map((v) => (
              <div key={v.code} className="gx-fids__row">
                <span className="gx-flap">{v.code}</span>
                <div className="gx-fids__dest">
                  {v.title}
                  <small>{v.sub}</small>
                </div>
                <span className="gx-fids__meta">{v.year}</span>
                <span className={`gx-status gx-status--${v.status}`}>{v.statusLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HISTORY */}
      <section
        className="px-6 py-20"
        style={{
          background: "var(--gx-ink, var(--surface-2))",
          borderTop: "4px solid var(--gx-ink-3, var(--border))",
          borderBottom: "4px solid var(--gx-ink-3, var(--border))",
        }}
        aria-label="Company history"
      >
        <div className="mx-auto max-w-6xl">
          <div
            className="grid gap-6 p-11 text-center md:grid-cols-3"
            style={{
              background: "var(--gx-void, var(--background))",
              border: "4px solid var(--gx-ink, var(--border))",
              borderRadius: "4px",
            }}
          >
            {[
              { big: "14+", label: "Years experience" },
              { big: "250+", label: "Experiences created" },
              { big: "5M+", label: "Memories made" },
            ].map((s) => (
              <div key={s.label}>
                <div
                  className="font-display text-5xl leading-none font-black md:text-7xl"
                  style={{ color: "var(--gx-brass, var(--org-primary))" }}
                >
                  {s.big}
                </div>
                <div
                  className="mt-2 font-mono text-xs tracking-[0.14em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection title="Frequently Asked." faqs={HOME_FAQ} />

      {/* CAPTAIN'S LOG */}
      <section id="logs" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="gx-eyebrow">Captain&apos;s Log · Dispatches</p>
          <h2 className="gx-display-m mt-3">From the Log.</h2>
          <p className="mt-4 max-w-3xl text-lg" style={{ color: "var(--text-muted)" }}>
            Field notes, release dispatches, and crew calls from the platform.
          </p>
          <div className="mt-10" style={{ borderTop: "2px solid var(--gx-ink-3, var(--border))" }}>
            {LOGS.map((l) => (
              <Link
                key={l.title}
                href={l.href}
                className="flex flex-wrap items-center gap-4 py-5 transition-[padding-left] hover:pl-2"
                style={{ borderBottom: "2px solid var(--gx-ink-3, var(--border))" }}
              >
                <span
                  className="w-32 flex-none font-mono text-xs tracking-[0.08em]"
                  style={{ color: "var(--text-subtle, var(--text-muted))" }}
                >
                  {l.date}
                </span>
                <span
                  className="flex-none rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.12em] uppercase"
                  style={{
                    background: "var(--gx-brass, var(--org-primary))",
                    color: "var(--gx-ink, var(--background))",
                  }}
                >
                  {l.cat}
                </span>
                <span className="font-display flex-1 text-xl leading-tight font-extrabold uppercase">{l.title}</span>
                <span
                  className="flex-none font-mono text-base"
                  style={{ color: "var(--gx-brass, var(--org-primary))" }}
                >
                  ↗
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Launch */}
      <section id="book" className="relative overflow-hidden px-6 py-24 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: "var(--gx-halftone-brass)",
            backgroundSize: "var(--gx-dot-size, 10px) var(--gx-dot-size, 10px)",
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="gx-eyebrow no-dot justify-center">Step 05 · Launch</p>
          <h2 className="gx-display-l mt-3">
            Launch Your
            <br />
            Production.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg" style={{ color: "var(--text-muted)" }}>
            Destination chosen, course charted, crew assembled. All that&apos;s left is to come aboard — pitch to wrap,
            one schema, zero compromises.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="gx-btn gx-btn--lg">
              Sign Up Free
            </Link>
            <Link href="/contact" className="gx-btn gx-btn--ghost gx-btn--lg">
              Book a Walkthrough
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
