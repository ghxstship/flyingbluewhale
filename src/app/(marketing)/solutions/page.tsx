// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({
  title: "Solutions — Three Apps, Eight Industries",
  description:
    "Explore the three integrated apps from Second Star Technologies — ATLVS (internal console), GVTEWAY (external portals), and COMPVSS (mobile PWA) — plus the industries we serve: Live Events, Concerts, Festivals & Tours, Immersive Experiences, Brand Activations, Corporate Events, Theatrical Performances, and Broadcast, TV & Film.",
  path: "/solutions",
  keywords: [
    "live events software",
    "concerts production platform",
    "festivals and tours software",
    "immersive experience operations",
    "brand activation platform",
    "corporate events software",
    "theatrical production software",
    "broadcast tv film production",
    "ATLVS GVTEWAY COMPVSS",
  ],
});

export default function SolutionsIndex() {
  const crumbs = [{ label: "Home", href: "/" }, { label: "Solutions", href: "/solutions" }];
  return (
    <>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Solutions</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight">Three Apps. One Database. Zero Seams.</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
          ATLVS, GVTEWAY, and COMPVSS aren't three SaaS tools glued together. They're three purpose-built shells
          (internal, external, mobile) over one Postgres database — with row-level security enforcing every boundary.
        </p>
      </section>

      {/* Apps */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="text-3xl font-semibold tracking-tight">The Three Apps</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {APPS.map((a) => (
            <Link key={a.slug} href={a.href} data-platform={a.slug} className="surface-raised hover-lift relative overflow-hidden p-7">
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--org-primary)" }} />
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--org-primary)" }}>
                  {a.name}
                </div>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">{a.tier}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{a.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{a.body}</p>
              <ul className="mt-4 space-y-1.5 text-xs text-[var(--text-secondary)]">
                {a.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-[6px] inline-block h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--org-primary)" }} />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-5 inline-flex items-center gap-1 text-xs font-medium">
                Deep dive <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight">By Industry</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Each industry gets a tuned setup: Core starter blocks, default role matrix, and reference case studies.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {INDUSTRIES.map((i) => (
            <Link key={i.slug} href={`/solutions/${i.slug}`} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{i.name}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{i.blurb}</div>
            </Link>
          ))}
        </div>
      </section>

      <FAQSection
        title="Solutions · FAQ"
        faqs={[
          {
            q: "How are the three apps different?",
            a: "ATLVS is the internal console where your team works. GVTEWAY is the external portal surface (artists, vendors, clients, sponsors, guests, crew). COMPVSS is the mobile PWA for field operations (ticket scan, clock, inventory). Same backend, different audiences.",
          },
          {
            q: "Do I have to use all three apps?",
            a: "No. Every tier includes all three, but teams adopt gradually: most start with ATLVS + one portal persona (usually artist or client), add COMPVSS at show time, then expand.",
          },
          {
            q: "Is the platform multi-tenant?",
            a: "Yes. Each organization lives in its own row-level-security scope — members, projects, tickets, proposals, and every other domain table are org-scoped by Postgres RLS. You cannot accidentally see another org's data.",
          },
          {
            q: "Do you support white-labeled portals?",
            a: "Custom branding (logo, colors, email templates) and custom domains for portals are available on Enterprise. See /console/settings/branding once you're set up.",
          },
        ]}
      />

      <CTASection />
    </>
  );
}

const APPS = [
  {
    slug: "atlvs",
    name: "ATLVS",
    tier: "INTERNAL",
    title: "The operations console",
    body: "Projects, finance, procurement, production, people, AI — one sidebar, role-gated by tier. Your team runs the show here.",
    bullets: [
      "60+ real modules across 9 domains",
      "AI assistant + drafting + managed agents",
      "Full audit log + RLS per org",
      "Role matrix: 10 platform × 4 project × 4 tiers",
    ],
    href: "/solutions/atlvs",
  },
  {
    slug: "gvteway",
    name: "GVTEWAY",
    tier: "EXTERNAL",
    title: "Stakeholder portals",
    body: "Slug-scoped workspaces for every party outside your org. Artists, vendors, clients, sponsors, guests, crew — each gets a tailored view.",
    bullets: [
      "6 persona portals per project slug",
      "Interactive proposals with e-sign",
      "Advancing with deliverable tracking",
      "Per-role KBYG event guides",
    ],
    href: "/solutions/gvteway",
  },
  {
    slug: "compvss",
    name: "COMPVSS",
    tier: "MOBILE",
    title: "The field kit",
    body: "Offline-first. Ticket scan, geo-verified clock-in, inventory scan, incident reports — all on the phone, all fast.",
    bullets: [
      "QR ticket scan, race-safe atomic update",
      "Geo-verified crew time tracking",
      "Service-worker offline shell",
      "Today's call sheet + KBYG guide",
    ],
    href: "/solutions/compvss",
  },
] as const;

const INDUSTRIES = [
  { slug: "live-events", name: "Live Events", blurb: "Venue residencies, club nights, one-offs" },
  { slug: "concerts", name: "Concerts", blurb: "Single-night shows, amphitheatres, arenas" },
  { slug: "festivals-tours", name: "Festivals & Tours", blurb: "Multi-day, multi-stage, multi-city" },
  { slug: "immersive-experiences", name: "Immersive Experiences", blurb: "Installations, walk-throughs, pop-ups" },
  { slug: "brand-activations", name: "Brand Activations", blurb: "Pop-ups, product launches, experiential marketing" },
  { slug: "corporate-events", name: "Corporate Events", blurb: "Conferences, AGMs, summits, internal events" },
  { slug: "theatrical-performances", name: "Theatrical Performances", blurb: "Residencies, touring productions, galas" },
  { slug: "broadcast-tv-film", name: "Broadcast, TV & Film", blurb: "Studio, remote, location-based production" },
];
