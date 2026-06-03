// Marketing home — ATLVS ecosystem (ATLVS · COMPVSS · GVTEWAY).
// SaaS skin (Inter, neutral surfaces, soft elevation) inherited from
// (marketing)/layout.tsx data-theme="atlvs-product". Copy leads with the
// platform — production-ops vernacular, no voyage metaphor. The cosmic
// GHXSTSHIP voice lives only on /ghxstship (parent company surface).

import Link from "next/link";
import type { Metadata } from "next";
import { FAQSection } from "@/components/marketing/FAQ";
import { JsonLd } from "@/components/marketing/JsonLd";
import { buildMetadata, organizationSchema, softwareApplicationSchema, websiteSchema, SITE } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "ATLVS — Production Management Software for Live Experiences",
  description:
    "ATLVS Technologies — production management, crew operations, and ticketing software built for live events. Three apps, one schema: ATLVS for producers, COMPVSS for crew, GVTEWAY for guests. Pitch through wrap on a single platform.",
  path: "/",
  languages: {
    "es-ES": `${SITE.baseUrl}/es-ES`,
    "pt-BR": `${SITE.baseUrl}/pt-BR`,
  },
  keywords: [
    "ATLVS",
    "ATLVS Technologies",
    "COMPVSS",
    "GVTEWAY",
    "production management software",
    "event operations platform",
    "crew management software",
    "live event software",
    "festival operations platform",
    "experiential production platform",
    "concert tour management",
    "brand activation software",
    "production scheduling",
    "event ticketing platform",
    "offline-first crew app",
  ],
  ogImageTitle: "Production Runs On It.",
});

const INDUSTRIES: Array<{ title: string; body: string; href: string }> = [
  {
    title: "Festivals",
    body: "Multi-stage infrastructure, headliner advance, and gate operations at scale.",
    href: "/solutions/festivals-tours",
  },
  {
    title: "Concerts & Tours",
    body: "Show production, multi-city routing, advancing, and settlement for live music.",
    href: "/solutions/concerts",
  },
  {
    title: "Brand Activations",
    body: "Experiential marketing, pop-ups, and environments that convert.",
    href: "/solutions/brand-activations",
  },
  {
    title: "Immersive Experiences",
    body: "Narrative installations and worlds audiences step inside — ticketed, timed, tracked.",
    href: "/solutions/immersive-experiences",
  },
  {
    title: "Sporting Events",
    body: "Stadium activations, fan experiences, and game-day production operations.",
    href: "/solutions/live-events",
  },
  {
    title: "TV, Film & Broadcast",
    body: "Live broadcast, content capture, crew compliance, and on-air activations.",
    href: "/solutions/broadcast-tv-film",
  },
  {
    title: "Corporate & AGM",
    body: "Summits, annual meetings, internal kickoffs, premium hospitality.",
    href: "/solutions/corporate-events",
  },
  {
    title: "Theatrical",
    body: "Productions, residencies, repertory seasons, touring theatre.",
    href: "/solutions/theatrical-performances",
  },
];

const TIERS = [
  {
    name: "Full Platform",
    tag: "All eight phases",
    body: "Every phase of the production lifecycle, pitch to wrap — one workspace, one schema, total accountability.",
  },
  {
    name: "Single App",
    tag: "Adopt one product",
    body: "Start with ATLVS, COMPVSS, or GVTEWAY individually. Same database, expand when ready.",
  },
  {
    name: "Modules Only",
    tag: "Pick what you need",
    body: "RFIs, advancing, inspections, gate scan. Buy exactly the modules your scope demands.",
  },
];

const PHASES: Array<{ n: string; name: string; sub: string }> = [
  { n: "01", name: "Discovery", sub: "Consult · Scope" },
  { n: "02", name: "R&D", sub: "Feasibility" },
  { n: "03", name: "Design", sub: "Direction" },
  { n: "04", name: "Compliance", sub: "Engineering · Safety" },
  { n: "05", name: "Build", sub: "Fabrication" },
  { n: "06", name: "Operations", sub: "Logistics" },
  { n: "07", name: "Activation", sub: "Showtime" },
  { n: "08", name: "Strike", sub: "Settle · Wrap" },
];

const PRODUCTS = [
  {
    slug: "atlvs",
    title: "ATLVS",
    audience: "For producers · internal teams",
    tag: "Production & resource management",
    body: "Projects, RFIs, submittals, daily logs, advancing, finance, procurement, AI assistant. The producer's console — pitch through wrap.",
    href: "/solutions/atlvs",
    color: "#FF2E88",
  },
  {
    slug: "compvss",
    title: "COMPVSS",
    audience: "For crew · vendors · talent",
    tag: "Workforce & field operations",
    body: "Scheduling, certifications, gate scan, shift clock-in, incidents, medical. Offline-first PWA. Sub-100ms scans on one-bar LTE.",
    href: "/solutions/compvss",
    color: "#E9A23B",
  },
  {
    slug: "gvteway",
    title: "GVTEWAY",
    audience: "For guests · clients · partners",
    tag: "Ticketing & stakeholder portal",
    body: "Ticketing, proposals, twelve personas. Artists, vendors, clients, sponsors, guests — each their lane.",
    href: "/solutions/gvteway",
    color: "#12B5B5",
  },
];

const EDGES = [
  {
    n: "01",
    title: "End to End",
    tag: "One schema",
    body: "Pitch through wrap, all eight phases, in one workspace. No integration tax, no schema reconciliation.",
  },
  {
    n: "02",
    title: "Proprietary Stack",
    tag: "Built in-house",
    body: "ATLVS, COMPVSS, and GVTEWAY share a single Postgres schema. No vendor lock-in dressed up as integrations.",
  },
  {
    n: "03",
    title: "Per Org, Not Per Seat",
    tag: "Add the whole crew",
    body: "The whole production team, every freelancer, every vendor. Pricing scales with you, not your headcount.",
  },
];

const PROJECTS = [
  {
    code: "RRR 312",
    title: "Black Coffee at the Race Track",
    sub: "Concert Experience · Miami Music Week · Club Space",
    year: "2026",
  },
  { code: "RRR 226", title: "Polymarket Grocery Store", sub: "Brand Activation · Miami", year: "2026" },
  {
    code: "RRR 052",
    title: "Salvage City Supper Club",
    sub: "Immersive Experience · Club Space · Miami",
    year: "2025",
  },
  { code: "RRR 108", title: "PATRÓN Cristalino × Becky G", sub: "Product Launch · Los Angeles", year: "2024" },
  { code: "RRR 023", title: "Heineken Turn 4 Nightclub", sub: "Motorsports · F1 Las Vegas Grand Prix", year: "2024" },
  { code: "RRR 311", title: "Red Bull Unforeseen Motel", sub: "Brand Activation · III Points · Miami", year: "2023" },
  { code: "RRR 001", title: "Formula 1 Las Vegas Grand Prix", sub: "Motorsports · Las Vegas", year: "2023" },
];

const HOME_FAQ = [
  {
    q: "What is ATLVS Technologies?",
    a: "ATLVS Technologies is the platform behind live experiential production. Three connected apps on one database: ATLVS for producers (projects, RFIs, advancing, finance, procurement, AI), COMPVSS for crew (scheduling, certifications, gate scan, incidents), and GVTEWAY for guests and stakeholders (ticketing, proposals, twelve personas). Same record across all three, pitch through wrap.",
  },
  {
    q: "Who is the ATLVS platform for?",
    a: "Production teams running real live work. Festivals, residencies, touring, fabrication shops, brand activations, broadcast compounds, private events. The schema is generic; the vernacular is specific. If your org has a load-in, a manifest, vendors, and a wrap — it fits.",
  },
  {
    q: "How does ATLVS pricing work?",
    a: "Per organization, not per seat. Free forever for solo operators and small teams. Crew opens up the team. Production unlocks every module plus multi-project. Festival is multi-org with SSO, custom DPA, and a 99.9% SLA. Full grid at /pricing.",
  },
  {
    q: "How do vendor payouts work?",
    a: "Stripe Connect. Vendors onboard a payout account through their portal. You approve the PO. Payouts route directly. Money never crosses our books. ACH, card, international wire. Signed webhooks for every event.",
  },
  {
    q: "Does COMPVSS actually work offline?",
    a: "Yes. COMPVSS is an offline-first PWA. Gate scan, shift clock-in, daily log, incident, medic intake — all queue locally and sync on signal return. Sub-100ms scan even on one-bar LTE. Tested at 15,000-guest gates.",
  },
  {
    q: "Who builds ATLVS Technologies?",
    a: "ATLVS Technologies is a GHXSTSHIP Industries company — the technology arm of an experiential production house headquartered in Miami with offices in New York, Chicago, and Los Angeles. ATLVS, COMPVSS, and GVTEWAY are built in-house by people who have shipped real shows.",
  },
  {
    q: "How is the data secured?",
    a: "Row-level security at the database — your tenant is walled off in Postgres, not in the app layer. Every change writes to an immutable audit log (actor, IP, user agent, before/after). Signed webhooks (HMAC-SHA256). File shares self-expire. SOC-2 attestation plus custom DPA on Festival tier.",
  },
  {
    q: "Is the AI assistant useful or marketing?",
    a: "Useful. It reads your workspace data — never the public internet — and drafts riders, RFPs, call sheets, recaps, safety briefs, and incident reports. Streaming, conversation-persisted in your tenant. Anthropic Claude under the hood.",
  },
  {
    q: "Can I export my data?",
    a: "Always. CSV exports on every tier from every list view. Full data export via Settings → Exports on Production and above. You own the data; we host it. Cancel and you get a 90-day read-only window to pull everything.",
  },
];

const POSTS = [
  {
    date: "2026 · 05 · 28",
    cat: "Field Notes",
    title: "How the 8-Phase Lifecycle keeps a build on course",
    href: "/blog",
  },
  { date: "2026 · 05 · 12", cat: "Release", title: "Advancing v2 — 16 typed deliverables ship", href: "/changelog" },
  { date: "2026 · 04 · 30", cat: "Careers", title: "Hiring — engineers, PMs, designers", href: "/careers" },
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

      {/* HERO */}
      <section className="relative px-6 pt-16 pb-20 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 md:grid-cols-[1.5fr_1fr]">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">
                ATLVS Technologies
              </p>
              <h1 className="mt-5 text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl md:text-6xl">
                Production runs on
                <br />
                <span className="text-[var(--p-accent)]">one platform.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--p-text-2)]">
                Three apps, one schema. <strong className="text-[var(--p-text-1)]">ATLVS</strong> runs the production.{" "}
                <strong className="text-[var(--p-text-1)]">COMPVSS</strong> runs the field.{" "}
                <strong className="text-[var(--p-text-1)]">GVTEWAY</strong> runs the portal. Pitch through wrap on a
                single connected platform for live experiential production.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="rounded-md bg-[var(--p-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--p-accent-contrast)] transition hover:brightness-95"
                >
                  Start Free
                </Link>
                <Link
                  href="/demo"
                  className="rounded-md border border-[var(--p-border-2)] px-5 py-2.5 text-sm font-semibold text-[var(--p-text-1)] transition hover:bg-[var(--p-surface-2)]"
                >
                  Book a Walkthrough
                </Link>
              </div>
              <p className="mt-6 text-xs text-[var(--p-text-3)]">
                Free forever for small teams · No credit card required · Per-org pricing
              </p>
            </div>
            <div className="hidden md:block">
              <div className="rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-6 shadow-[var(--p-elev-2)]">
                <div className="mb-3 text-[10px] font-semibold tracking-[0.14em] text-[var(--p-text-3)] uppercase">
                  The ATLVS Ecosystem
                </div>
                {PRODUCTS.map((p) => (
                  <div key={p.slug} className="border-t border-[var(--p-border)] py-3 first:border-t-0 first:pt-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-lg font-semibold tracking-tight" style={{ color: p.color }}>
                        {p.title}
                      </span>
                      <span className="text-[10px] font-medium tracking-[0.08em] text-[var(--p-text-3)] uppercase">
                        {p.audience.replace(/^For /, "")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--p-text-2)]">{p.tag}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-[var(--p-border)] bg-[var(--p-surface-2)] px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-[11px] font-semibold tracking-[0.16em] text-[var(--p-text-3)] uppercase">
            Trusted by production teams behind
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-bold tracking-[0.12em] text-[var(--p-text-1)] uppercase opacity-80">
            <span>Red Bull</span>
            <span>Heineken</span>
            <span>Formula 1</span>
            <span>Insomniac</span>
            <span>Patrón</span>
            <span>Polymarket</span>
          </div>
        </div>
      </section>

      {/* THE THREE APPS */}
      <section id="apps" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">
            The ATLVS Ecosystem
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Three apps, one schema.</h2>
          <p className="mt-4 max-w-3xl text-lg text-[var(--p-text-2)]">
            ATLVS Technologies ships three connected products on a shared Postgres database. Adopt one or run the full
            platform — every record flows across producer console, field PWA, and stakeholder portal.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PRODUCTS.map((p) => (
              <Link
                key={p.slug}
                href={p.href}
                data-platform={p.slug}
                className="group relative block rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-6 shadow-[var(--p-elev-1)] transition hover:shadow-[var(--p-elev-2)]"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 rounded-t-xl"
                  style={{ background: p.color }}
                />
                <p className="text-[10px] font-semibold tracking-[0.14em] uppercase" style={{ color: p.color }}>
                  {p.audience}
                </p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight" style={{ color: p.color }}>
                  {p.title}
                </h3>
                <p className="mt-1 text-xs font-medium text-[var(--p-text-3)] uppercase">{p.tag}</p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--p-text-2)]">{p.body}</p>
                <p className="mt-5 text-xs font-semibold text-[var(--p-text-1)]">Read more →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" className="border-t border-[var(--p-border)] bg-[var(--p-surface-2)] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">Built For</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Production teams running real work.</h2>
          <p className="mt-4 max-w-3xl text-lg text-[var(--p-text-2)]">
            The schema is generic. The vernacular is specific. Pick the kind of production you ship and the platform
            speaks your language out of the box.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {INDUSTRIES.map((d) => (
              <Link
                key={d.title}
                href={d.href}
                className="block rounded-lg border border-[var(--p-border)] bg-[var(--p-surface)] p-5 transition hover:border-[var(--p-accent)] hover:shadow-[var(--p-elev-1)]"
              >
                <h3 className="text-base font-semibold tracking-tight text-[var(--p-text-1)]">{d.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--p-text-2)]">{d.body}</p>
              </Link>
            ))}
          </div>
          <p className="mt-8 text-sm text-[var(--p-text-2)]">
            Hospitality, corporate, and private events too —{" "}
            <Link href="/solutions" className="font-semibold text-[var(--p-accent-text)] hover:underline">
              see every solution →
            </Link>
          </p>
        </div>
      </section>

      {/* 8-PHASE LIFECYCLE */}
      <section id="lifecycle" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">
            The 8-Phase Production Lifecycle
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Discovery to Strike on one timeline.</h2>
          <p className="mt-4 max-w-3xl text-lg text-[var(--p-text-2)]">
            Every production runs through the same eight phases. The schema follows the phases, the audit log follows
            the schema, and every approval gate blocks the next phase until the previous one closes.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {PHASES.map((s) => (
              <div
                key={s.n}
                className="rounded-lg border border-[var(--p-border)] bg-[var(--p-surface)] p-4 shadow-[var(--p-elev-1)]"
              >
                <div className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[var(--p-text-3)]">
                  Phase {s.n}
                </div>
                <div className="mt-1.5 text-base font-semibold text-[var(--p-text-1)]">{s.name}</div>
                <div className="mt-0.5 text-xs text-[var(--p-text-2)]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE DIFFERENCE */}
      <section className="border-y border-[var(--p-border)] bg-[var(--p-surface-2)] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">Why ATLVS</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Not a CRM stitched to a PM tool.</h2>
          <p className="mt-4 max-w-3xl text-lg text-[var(--p-text-2)]">
            Most production-operations stacks bolt together a CRM, a project tool, a doc tool, and a ticketing
            integration. ATLVS Technologies owns the entire stack — every app built in-house, every record connected.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {EDGES.map((e) => (
              <article
                key={e.n}
                className="rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-7 shadow-[var(--p-elev-1)]"
              >
                <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[var(--p-accent-text)] uppercase">
                  {e.n}
                </span>
                <h3 className="mt-2 text-xl font-bold tracking-tight text-[var(--p-text-1)]">{e.title}</h3>
                <span className="mt-1 inline-block text-[11px] font-medium tracking-[0.08em] text-[var(--p-text-3)] uppercase">
                  {e.tag}
                </span>
                <p className="mt-4 text-sm leading-relaxed text-[var(--p-text-2)]">{e.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ADOPT YOUR WAY */}
      <section id="adopt" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">
            Adopt your way
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Start where you are.</h2>
          <p className="mt-4 max-w-3xl text-lg text-[var(--p-text-2)]">
            Run the whole platform end to end, take a single app, or pick exactly the modules your scope needs. Same
            database in every case.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TIERS.map((t) => (
              <article
                key={t.name}
                className="rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-7 shadow-[var(--p-elev-1)]"
              >
                <h3 className="text-xl font-bold tracking-tight text-[var(--p-text-1)]">{t.name}</h3>
                <span className="mt-1 inline-block text-[11px] font-medium tracking-[0.08em] text-[var(--p-text-3)] uppercase">
                  {t.tag}
                </span>
                <p className="mt-4 text-sm leading-relaxed text-[var(--p-text-2)]">{t.body}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 text-sm text-[var(--p-text-2)]">
            <Link href="/pricing" className="font-semibold text-[var(--p-accent-text)] hover:underline">
              See the pricing grid →
            </Link>
          </p>
        </div>
      </section>

      {/* PROJECTS / RECEIPTS */}
      <section id="customers" className="border-t border-[var(--p-border)] bg-[var(--p-surface-2)] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">
                Receipts · Case studies
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Shipped on ATLVS.</h2>
            </div>
            <p className="max-w-md text-sm text-[var(--p-text-2)]">
              A selection of productions our customers have shipped using ATLVS Technologies — across festivals, brand
              activations, and broadcast.
            </p>
          </div>
          <div className="mt-10 overflow-hidden rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] shadow-[var(--p-elev-1)]">
            <div className="grid grid-cols-[110px_1fr_70px] gap-4 border-b border-[var(--p-border)] bg-[var(--p-surface-2)] px-5 py-3 text-[10px] font-semibold tracking-[0.14em] text-[var(--p-text-3)] uppercase">
              <span>Project</span>
              <span>Title</span>
              <span>Year</span>
            </div>
            {PROJECTS.map((v) => (
              <div
                key={v.code}
                className="grid grid-cols-[110px_1fr_70px] items-center gap-4 border-b border-[var(--p-border)] px-5 py-4 last:border-b-0"
              >
                <span className="font-mono text-xs font-semibold text-[var(--p-text-1)]">{v.code}</span>
                <div>
                  <div className="text-sm font-semibold text-[var(--p-text-1)]">{v.title}</div>
                  <div className="text-xs text-[var(--p-text-3)]">{v.sub}</div>
                </div>
                <span className="font-mono text-xs text-[var(--p-text-2)]">{v.year}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECEIPTS — STATS */}
      <section className="px-6 py-20" aria-label="Company history">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-10 text-center shadow-[var(--p-elev-1)] md:grid-cols-3">
            {[
              { big: "14+", label: "Years experience" },
              { big: "250+", label: "Productions shipped" },
              { big: "5M+", label: "Guests served" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-5xl font-bold tracking-tight text-[var(--p-accent)] md:text-6xl">{s.big}</div>
                <div className="mt-2 text-[11px] font-semibold tracking-[0.14em] text-[var(--p-text-3)] uppercase">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection title="Frequently Asked." faqs={HOME_FAQ} />

      {/* LATEST */}
      <section id="latest" className="border-t border-[var(--p-border)] bg-[var(--p-surface-2)] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">From the team</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Field notes &amp; releases.</h2>
          <div className="mt-10 divide-y divide-[var(--p-border)] rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] shadow-[var(--p-elev-1)]">
            {POSTS.map((l) => (
              <Link
                key={l.title}
                href={l.href}
                className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-[var(--p-surface-2)]"
              >
                <span className="w-32 flex-none font-mono text-xs text-[var(--p-text-3)]">{l.date}</span>
                <span className="flex-none rounded-full bg-[var(--p-accent-weak)] px-3 py-1 text-[10px] font-semibold tracking-[0.12em] text-[var(--p-accent-text)] uppercase">
                  {l.cat}
                </span>
                <span className="flex-1 text-base font-semibold text-[var(--p-text-1)]">{l.title}</span>
                <span className="flex-none text-sm text-[var(--p-accent-text)]">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--p-accent-text)] uppercase">Get started</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Start running your production on ATLVS.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--p-text-2)]">
            Free forever for small teams. Per-org pricing. No credit card to start.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-[var(--p-accent)] px-6 py-3 text-sm font-semibold text-[var(--p-accent-contrast)] transition hover:brightness-95"
            >
              Sign Up Free
            </Link>
            <Link
              href="/demo"
              className="rounded-md border border-[var(--p-border-2)] px-6 py-3 text-sm font-semibold text-[var(--p-text-1)] transition hover:bg-[var(--p-surface-2)]"
            >
              Book a Walkthrough
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
