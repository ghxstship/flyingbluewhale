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
  title: "flyingbluewhale — Production OS for live events, fabrication, and creative ops",
  description:
    "Run production on one platform. flyingbluewhale unifies an internal operations console (ATLVS), external stakeholder portals (GVTEWAY), and a field-ready mobile PWA (COMPVSS) — proposals, advancing, ticketing, finance, procurement, AI, and more. Built on Next.js, Supabase, and Claude. Free tier available.",
  path: "/",
  keywords: [
    "production management software",
    "event operations platform",
    "live event software",
    "experiential production platform",
    "event advancing tool",
    "crew management software",
    "event ticketing platform",
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
            name: "flyingbluewhale",
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
          Run production.<br />Not spreadsheets.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
          The operating system for live events, fabrication, and creative ops. Internal console, external
          stakeholder portals, and a field-ready mobile PWA — one platform, one database, one source of truth.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/signup" size="lg">Start free</Button>
          <Button href="/contact" size="lg" variant="secondary">Book a demo</Button>
          <Link href="/docs" className="btn btn-ghost btn-lg">View the docs →</Link>
        </div>
      </section>

      <LogoCloud />

      {/* Three-app showcase */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-16">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">
            Three integrated apps · one schema
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            ATLVS · GVTEWAY · COMPVSS
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--text-secondary)]">
            Not three tools duct-taped together. Three shells over one Postgres database, with row-level security
            enforcing who sees what.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              slug: "atlvs",
              eyebrow: "ATLVS",
              title: "Internal operations console",
              body: "Projects, finance, procurement, production, people, AI — one sidebar, role-gated by tier. Your team runs the show here.",
              bullets: ["Proposals, invoices, POs, crew, schedule", "AI assistant + drafting + managed agents", "Full audit log + RLS per org"],
              href: "/solutions/atlvs",
            },
            {
              slug: "gvteway",
              eyebrow: "GVTEWAY",
              title: "External stakeholder portals",
              body: "Slug-scoped workspaces for every party outside your org — artists, vendors, clients, sponsors, guests, crew.",
              bullets: ["Artist advancing + deliverables", "Client proposals + e-sign + invoices", "Role-scoped guides (KBYG)"],
              href: "/solutions/gvteway",
            },
            {
              slug: "compvss",
              eyebrow: "COMPVSS",
              title: "Field-ready mobile PWA",
              body: "Offline-first. Ticket scan, geo-verified crew clock-in, inventory scan, incident reports — all on the phone.",
              bullets: ["QR ticket scanning with race-safe check-in", "Geo-verified time tracking", "Today's call sheet + KBYG guide"],
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
            Everything your production team runs, replaced.
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            From proposal to wrap — pitch, advance, produce, reconcile, recap.
          </p>
        </div>
        <div className="mt-10">
          <FeatureGrid
            cols={4}
            features={[
              { icon: FileSignature, title: "Interactive proposals", body: "23 block types, e-sign, share links, versioning.", href: "/features/proposals" },
              { icon: Sparkles, title: "Event guides (KBYG)", body: "Per-role Know-Before-You-Go published to portal + mobile.", href: "/features/guides" },
              { icon: QrCode, title: "Ticketing + scan", body: "Race-safe atomic scan with offline fallback.", href: "/features/ticketing" },
              { icon: Users, title: "Advancing", body: "Riders, input lists, stage plots, catering, travel.", href: "/features/advancing" },
              { icon: DollarSign, title: "Finance", body: "Invoices, expenses, budgets, Stripe Connect payouts.", href: "/features/finance" },
              { icon: ClipboardCheck, title: "Procurement", body: "Requisitions, POs, vendor COIs, W-9 tracking.", href: "/features/procurement" },
              { icon: Zap, title: "AI assistant", body: "Streaming Claude chat grounded in your workspace.", href: "/features/ai" },
              { icon: ShieldCheck, title: "Enterprise-grade", body: "RLS, audit log, SSO, SCIM, DPA, SLA on Enterprise.", href: "/features/compliance" },
            ]}
          />
        </div>
      </section>

      {/* Built for section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">Built for the entire production stack</h2>
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
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">Why flyingbluewhale</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">One source of truth beats ten SaaS tools.</h2>
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                Most production teams are duct-taping Asana, Monday, a spreadsheet for advancing, DocuSign for
                proposals, QuickBooks for invoices, and a group chat for everything else. Every seam leaks money —
                proposals that miss line items, POs without COIs, tickets without scans, invoices no one chases.
              </p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                flyingbluewhale removes the seams. One database, three shells, enforced row-level security per
                organization, and the right data visible to the right stakeholder at the right time.
              </p>
              <div className="mt-6 flex gap-2">
                <Button href="/compare/vs-spreadsheets" variant="secondary" size="sm">vs spreadsheets</Button>
                <Button href="/compare/vs-asana" variant="secondary" size="sm">vs Asana</Button>
                <Button href="/compare/vs-monday" variant="secondary" size="sm">vs Monday</Button>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                "Per-org Postgres row-level security on every table",
                "Stripe Connect payouts to every vendor",
                "Signed file uploads with 60-second expiring URLs",
                "Offline ticket scanning with race-safe atomic updates",
                "Streaming Anthropic Claude assistant with workspace grounding",
                "Audit log on every mutation — before + after JSONB",
                "Three-shell topology: console, portal, mobile",
                "Boarding-Pass style per-role event guides",
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
    q: "What is flyingbluewhale?",
    a: "flyingbluewhale is a unified production management platform for live events, fabrication, and creative operations teams. It combines an internal operations console (ATLVS), external stakeholder portals (GVTEWAY), and a field-ready mobile PWA (COMPVSS) into a single Postgres-backed system secured by row-level security.",
  },
  {
    q: "Who is flyingbluewhale for?",
    a: "Production companies, promoters, festivals, fabrication shops, touring operations, and experiential agencies. If your team runs live events or creative builds and works with external stakeholders (artists, vendors, clients, sponsors, guests), flyingbluewhale replaces 5–10 SaaS tools.",
  },
  {
    q: "How is flyingbluewhale different from Asana, Monday, or Airtable?",
    a: "Those are generic project management tools. flyingbluewhale is domain-specific: native ticket scanning, artist advancing with deliverables, Stripe Connect vendor payouts, signed proposals with per-phase gates, role-scoped event guides (KBYG), and a mobile PWA for field ops. You don't stitch together templates — production workflows are built in.",
  },
  {
    q: "What are ATLVS, GVTEWAY, and COMPVSS?",
    a: "ATLVS is the internal operations console where your team works (projects, finance, procurement, production, people, AI). GVTEWAY is the external portal surface — one slug per project, one view per persona (artist, vendor, client, sponsor, guest, crew). COMPVSS is the mobile PWA for field operations — ticket scan, clock-in, inventory, incident reports.",
  },
  {
    q: "Is there a free tier?",
    a: "Yes. The Portal tier is free forever — up to 3 users, basic projects and ticketing, community support. Starter is $49/mo, Professional is $199/mo, Enterprise is custom. See pricing for the full matrix.",
  },
  {
    q: "Do you integrate with Stripe?",
    a: "Yes. Stripe Checkout powers invoice payments and Stripe Connect Express handles vendor payouts. Webhook receiver verifies HMAC-SHA256 signatures; we never rely on unsigned callbacks.",
  },
  {
    q: "Does flyingbluewhale work offline?",
    a: "The COMPVSS mobile PWA caches the application shell and check-in flow via a service worker, so crew can work through spotty venue connections. Scans queue locally and sync when the network returns.",
  },
  {
    q: "How is security handled?",
    a: "Row-level security (RLS) is enforced on every Postgres table via canonical helpers (is_org_member, has_org_role). Every mutation is audit-logged with before/after JSONB. Signed file uploads use 60-second expiring URLs. Stripe webhooks are HMAC-signature verified. CSP, HSTS, CSRF mitigation, and per-API CORS are configured at the edge.",
  },
  {
    q: "Does flyingbluewhale have an AI assistant?",
    a: "Yes. The ATLVS console ships with a streaming Anthropic Claude assistant (Sonnet 4.6 default, Opus 4.7 available) that grounds responses in your workspace. Conversations persist to Postgres for audit. Drafting templates cover proposals, riders, call sheets, and safety briefings.",
  },
  {
    q: "What's a KBYG guide?",
    a: "KBYG = Know Before You Go — a per-role event handbook published to external portals and mobile. Artists see riders, catering, venue specs, and schedule. Crew sees the call sheet, PPE, radio channels, and SOPs. Guests see logistics, tickets, and the public schedule. All authored once in ATLVS, rendered role-scoped.",
  },
  {
    q: "Can I export my data?",
    a: "Yes, at any time. JSONL export of every org-scoped table is available from Settings → Compliance on Enterprise; CSV exports are available on all tiers. You own your data.",
  },
  {
    q: "How do I get started?",
    a: "Sign up for free at /signup — takes 30 seconds. Or book a demo at /contact to see the platform with a live engineer.",
  },
];
