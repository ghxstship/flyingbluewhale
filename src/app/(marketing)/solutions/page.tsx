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
    "Three connected apps from Second Star Technologies — ATLVS for the office, GVTEWAY for your stakeholders, COMPVSS for the field — tuned for live events, concerts, festivals and tours, immersive experiences, brand activations, corporate events, theatre, and broadcast.",
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
        <h1 className="mt-3 text-5xl font-semibold tracking-tight">Three Apps. One Platform. Zero Seams.</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
          ATLVS, GVTEWAY, and COMPVSS aren't a bundle of separately-bought tools with sync issues. They're three
          purpose-built apps — office, stakeholders, field — all reading from the same backbone. Every org's data
          walled off at the data layer.
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
          Every industry gets a tuned setup: starter templates, a default role matrix, and case studies from peers.
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
            a: "ATLVS is your office console — where your team runs the show. GVTEWAY is the outside world — artists, vendors, clients, sponsors, guests, crew. COMPVSS is the field — ticket scan, clock-in, inventory, incidents. Same backbone, three audiences.",
          },
          {
            q: "Do I have to use all three apps?",
            a: "No. Every tier includes all three, but teams adopt gradually. Most start with ATLVS and one portal persona (usually artist or client), add COMPVSS at show time, then expand.",
          },
          {
            q: "Is my org's data walled off from other orgs?",
            a: "Yes. Every organization's data is walled off at the database layer — not just in the app. A user in one org cannot read or touch anything belonging to another org, by design.",
          },
          {
            q: "Do you support white-labeled portals?",
            a: "Yes, on Enterprise. Custom branding — logo, colors, email templates — plus custom domains for portals. Your clients see your brand; your vendors see your vendors' brand.",
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
    tier: "OFFICE",
    title: "The operations console",
    body: "Projects, finance, procurement, production, people, AI — one sidebar, role-aware access. Your team's command center.",
    bullets: [
      "Sixty-plus modules across nine domains",
      "AI assistant that drafts from your real data",
      "Immutable audit log — who, when, what changed",
      "Role matrix for every tier and every module",
    ],
    href: "/solutions/atlvs",
  },
  {
    slug: "gvteway",
    name: "GVTEWAY",
    tier: "STAKEHOLDERS",
    title: "Stakeholder portals",
    body: "A tailored workspace for every party outside your org. Artists, vendors, clients, sponsors, guests, crew — each sees their lane.",
    bullets: [
      "Six persona portals per project",
      "Interactive proposals, signed in place",
      "Artist advancing with deliverable tracking",
      "Role-scoped Know Before You Go guides",
    ],
    href: "/solutions/gvteway",
  },
  {
    slug: "compvss",
    name: "COMPVSS",
    tier: "FIELD",
    title: "The field kit",
    body: "Ticket scan, geo-verified clock-in, inventory, incident reports — from any phone. Keeps working when venue signal drops.",
    bullets: [
      "QR check-in with zero duplicates",
      "Geo-verified crew time tracking",
      "Offline-first — scans queue, then sync",
      "Today's call sheet plus the role-scoped guide",
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
