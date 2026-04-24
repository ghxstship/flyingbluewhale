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
  title: "Solutions — Three Acts. Eight Kinds of Night.",
  description:
    "ATLVS — the office. GVTEWAY — every stakeholder&apos;s door. COMPVSS — the crew PWA on the floor. One rig runs live events, concerts, festivals, tours, immersive, activations, corporate, theatrical, broadcast.",
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
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Lineup</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight">Three Acts. One Stage. Zero Seams.</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
          ATLVS, GVTEWAY, and COMPVSS aren&apos;t a bundle of tools bought separately and praying they sync. Three acts on one stage — office, door, floor — reading the same manifest. Your org&apos;s data walled off in the database, not in the pitch deck.
        </p>
      </section>

      {/* Apps */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="text-3xl font-semibold tracking-tight">Tonight&apos;s Lineup</h2>
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
                Backstage pass <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight">Kinds of Night We Run</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Each kind of show gets a tuned setup: starter templates, default role matrix, case files from peers who already ran the night.
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
            q: "How are the three acts different?",
            a: "ATLVS is the office — your team lives here M–F. GVTEWAY is the door — every stakeholder outside your org has their own lane. COMPVSS is the floor — crew PWA on show night. Same backbone, three audiences, zero sync drama.",
          },
          {
            q: "Do I have to book all three?",
            a: "No — but every tier ships all three. Most teams open with ATLVS + one GVTEWAY persona (artist or client), bolt on COMPVSS for load-in, then expand. Adopt at your tempo.",
          },
          {
            q: "Can other orgs see my manifest?",
            a: "No. Every org&apos;s data is walled off at the database layer — not just in the UI. A user in one org cannot read or touch anything in another. Enforced in the data, not the marketing.",
          },
          {
            q: "White-labeled doors?",
            a: "Yes — Festival tier. Your logo, colors, email templates, and custom domain for every door. Clients see your brand. Your vendors see your vendors&apos; brand. The building is always yours.",
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
    title: "Runs the show from the desk",
    body: "Nine domains, 60+ modules, one sidebar. Proposals to payouts, POs to ceremonies. The production office that doesn&apos;t need eleven tabs.",
    bullets: [
      "60+ modules across 9 domains",
      "AI runner that drafts from your manifest",
      "Immutable audit log — who, when, before, after",
      "Role matrix on every tier, every module",
    ],
    href: "/solutions/atlvs",
  },
  {
    slug: "gvteway",
    name: "GVTEWAY",
    tier: "DOOR",
    title: "Every stakeholder. Their own entrance.",
    body: "Twelve personas, twelve doors, one manifest. Artist, vendor, client, sponsor, guest, crew, delegation, media, VIP, hospitality, volunteer, athlete.",
    bullets: [
      "12 persona doors per project",
      "Proposals signed in place — 23 block types",
      "Live advancing + deliverable tracking",
      "Per-persona KBYG door passes",
    ],
    href: "/solutions/gvteway",
  },
  {
    slug: "compvss",
    name: "COMPVSS",
    tier: "FLOOR",
    title: "Runs the night from your pocket",
    body: "Gate scan, shift check-in, medic triage, crisis alerts, driver manifest, guard tour, warehouse scans. Offline-first. Installs in one tap.",
    bullets: [
      "<100ms gate scan — offline or on",
      "Geo-verified shift + meal credits",
      "Offline queue replays in order",
      "Tonight&apos;s call sheet + KBYG in pocket",
    ],
    href: "/solutions/compvss",
  },
] as const;

const INDUSTRIES = [
  { slug: "live-events", name: "Live Events", blurb: "Residencies, club nights, one-offs" },
  { slug: "concerts", name: "Concerts", blurb: "Single night, amphitheatre, arena" },
  { slug: "festivals-tours", name: "Festivals & Tours", blurb: "Multi-day, multi-stage, multi-city" },
  { slug: "immersive-experiences", name: "Immersive", blurb: "Installations, walk-throughs, pop-ups" },
  { slug: "brand-activations", name: "Brand Activations", blurb: "Launches, pop-ups, experiential" },
  { slug: "corporate-events", name: "Corporate", blurb: "Conferences, AGMs, summits, off-sites" },
  { slug: "theatrical-performances", name: "Theatrical", blurb: "Residencies, tours, galas" },
  { slug: "broadcast-tv-film", name: "Broadcast / TV / Film", blurb: "Studio, remote, location" },
];
