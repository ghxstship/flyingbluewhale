// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Solutions — Three Apps. One Schema.",
  description:
    "ATLVS — production operations workspace. GVTEWAY — stakeholder portal. COMPVSS — offline-first field PWA. Same record from the office, the stakeholder, and the gate.",
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
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Solutions", href: "/solutions" },
  ];
  return (
    <>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">Solutions</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight">Three Apps. One Schema.</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
          ATLVS, GVTEWAY, COMPVSS. One database underneath. Same record, three optimized surfaces — your office, your
          stakeholders, your crew, all reading the same truth.
        </p>
      </section>

      {/* Apps */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="text-3xl font-semibold tracking-tight">The Three Apps</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {APPS.map((a) => (
            <Link
              key={a.slug}
              href={a.href}
              data-platform={a.slug}
              className="surface hover-lift relative overflow-hidden p-7"
            >
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--org-primary)" }} />
              <div className="flex items-center justify-between">
                <div
                  className="text-[11px] font-semibold tracking-[0.2em] uppercase"
                  style={{ color: "var(--org-primary)" }}
                >
                  {a.name}
                </div>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">{a.tier}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{a.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{a.body}</p>
              <ul className="mt-4 space-y-1.5 text-xs text-[var(--text-secondary)]">
                {a.bullets.map((b) => (
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
                Walk the room <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight">Live Work, Whatever the Shape</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Each shape gets a tuned setup — starter templates, default role matrix, vernacular notes from operators
          who&apos;ve done it.
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
            a: "ATLVS is the production operations workspace — where the production lives. GVTEWAY is the stakeholder portal — twelve personas, each their lane. COMPVSS is the offline-first field PWA. One database underneath.",
          },
          {
            q: "Do I get all three?",
            a: "Every tier ships all three. Most teams open with ATLVS + one GVTEWAY persona (artist or client), add COMPVSS at load-in, then expand. Your tempo.",
          },
          {
            q: "Can other orgs see my data?",
            a: "No. RLS at the database — walled in Postgres, not in the app layer. A credential in one org cannot read or touch anything in another. Enforced in the data.",
          },
          {
            q: "White-labeled portal?",
            a: "Festival. Your mark, your colors, your email, your custom domain on every persona. The brand is yours.",
          },
        ]}
      />

      <CTASection
        title="ATLVS Is Open."
        primaryLabel="Sign Up Free"
        primaryHref="/signup"
        secondaryLabel="Book a Walkthrough"
        secondaryHref="/contact"
      />
    </>
  );
}

const APPS = [
  {
    slug: "atlvs",
    name: "ATLVS",
    tier: "WORKSPACE",
    title: "Where the production lives",
    body: "Forty-seven modules in one sidebar. Pitch through wrap. Proposals to payouts, RFIs to inspections, advancing to AI.",
    bullets: [
      "47 modules across 9 domains",
      "AI assistant grounded in your workspace",
      "Immutable audit log — actor, IP, before, after",
      "Role-aware on every action, enforced server-side",
    ],
    href: "/solutions/atlvs",
  },
  {
    slug: "gvteway",
    name: "GVTEWAY",
    tier: "PORTAL",
    title: "Twelve personas, each their lane",
    body: "Artist, vendor, client, sponsor, guest, crew, delegation, media, VIP, hospitality, volunteer, athlete. Same project, scoped reads.",
    bullets: [
      "12 personas per project",
      "Proposals signed in place — 23 block types",
      "Live advancing with deliverable tracking",
      "Per-persona KBYG guides, anonymous-shareable",
    ],
    href: "/solutions/gvteway",
  },
  {
    slug: "compvss",
    name: "COMPVSS",
    tier: "FIELD",
    title: "Offline. Sub-100ms.",
    body: "Gate scan, shift clock-in, daily log, incident, medic, driver, guard, warehouse. Installs from the browser in one tap.",
    bullets: [
      "<100ms gate scan, signal or none",
      "Geo-verified shift + meal credits",
      "Offline queue replays in order",
      "Tonight's call sheet + KBYG in pocket",
    ],
    href: "/solutions/compvss",
  },
] as const;

const INDUSTRIES = [
  { slug: "live-events", name: "Residencies + nights", blurb: "Sold-out weeks, recurring programming" },
  { slug: "concerts", name: "Concerts", blurb: "Single night, amphitheatre, arena" },
  { slug: "festivals-tours", name: "Festivals + tours", blurb: "Multi-day, multi-stage, multi-city" },
  { slug: "immersive-experiences", name: "Immersive", blurb: "Installations, walk-throughs, pop-ups" },
  { slug: "brand-activations", name: "Activations", blurb: "Launches, pop-ups, experiential" },
  { slug: "corporate-events", name: "Private programs", blurb: "Summits, closed-room, invite-only" },
  { slug: "theatrical-performances", name: "Theatrical", blurb: "Residencies, tours, galas" },
  { slug: "broadcast-tv-film", name: "Broadcast / TV / Film", blurb: "Studio, remote, location" },
];
