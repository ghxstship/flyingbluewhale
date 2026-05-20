// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Mic2, Truck, Users, Award, Ticket, HardHat, BookOpen, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, productSchema, CANONICAL_CTAS } from "@/lib/seo";
import { urlFor } from "@/lib/urls";

export const metadata: Metadata = buildMetadata({
  title: "GVTEWAY — The Portal",
  description:
    "Twelve personas. Each their lane. Artists see riders. Vendors see POs. Clients see proposals. Same project, RLS at the database.",
  path: "/solutions/gvteway",
  keywords: [
    "GVTEWAY",
    "stakeholder portal",
    "artist portal",
    "vendor portal",
    "client portal",
    "event portal software",
  ],
  ogImageEyebrow: "GVTEWAY",
  ogImageTitle: "Twelve Personas. Each Their Lane.",
});

export default function GvtewayPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Solutions", href: "/solutions" },
    { label: "GVTEWAY", href: "/solutions/gvteway" },
  ];

  return (
    <div data-platform="gvteway">
      <JsonLd
        data={[
          productSchema({
            name: "GVTEWAY — The Portal",
            description:
              "External stakeholder portal. Twelve personas, each scoped to their lane via RLS at the database.",
            url: urlFor("marketing", "/solutions/gvteway"),
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-accent">GVTEWAY</div>
        <h1 className="kinetic-display mt-3">Twelve Personas. Each Their Lane.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Artists advance. Vendors quote. Clients sign. Guests scan in. Crew clocks on. Same project. Twelve scoped
          reads. RLS at the database.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
      </section>

      {/* Personas */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">Twelve Personas. Same Database.</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Every persona arrives at its own lane — nav, flows, deliverables tuned to the role. The artist never sees the
          sponsor&apos;s invoice. The delegation never sees the vendor&apos;s COI. Enforced in Postgres.
        </p>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              {
                icon: Mic2,
                title: "Artist",
                body: "Tech rider, hospitality rider, input list, stage plot, guest list, schedule, travel.",
              },
              {
                icon: Truck,
                title: "Vendor",
                body: "Submissions, pull list, POs, invoices, COI + W-9 uploads, training records.",
              },
              {
                icon: Users,
                title: "Client",
                body: "Proposals signed in place, deliverables, invoices via card/ACH, messages, files.",
              },
              {
                icon: Award,
                title: "Sponsor",
                body: "Entitlements tracker, activations, brand assets, reporting, impressions.",
              },
              {
                icon: Ticket,
                title: "Guest",
                body: "Tickets — buy, claim, transfer. Schedule. Day-of logistics. Rideshare hand-off.",
              },
              { icon: HardHat, title: "Crew", body: "Call sheet, time submission, advances, safety briefing, SOPs." },
              {
                icon: Users,
                title: "Delegation",
                body: "Entries, rate card, training venues, meetings, cases, transport, accommodation, visa.",
              },
              {
                icon: BookOpen,
                title: "Media",
                body: "MPC rate card, accommodation, shuttles, press-conf RSVP, info-on-demand.",
              },
              {
                icon: Award,
                title: "VIP + Hospitality",
                body: "Dedicated fleet, hotel allocation, itinerary, guest list, package access.",
              },
              {
                icon: HardHat,
                title: "Volunteer",
                body: "Application, training, shift schedule, uniform pickup, door pass.",
              },
              {
                icon: Mic2,
                title: "Athlete",
                body: "Training bookings, resident services, safeguarding, visa, privacy self-service.",
              },
              {
                icon: Share2,
                title: "Privacy (all)",
                body: "Every persona gets DSAR self-service + consent management. GDPR, handled.",
              },
            ]}
          />
        </div>
      </section>

      {/* Signature features */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div className="surface p-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
              <Share2 size={14} /> Proposals
            </div>
            <h3 className="hed-lg mt-3">Proposals That Close Themselves.</h3>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Twenty-three block types. Scroll-spy nav. Per-phase contract refs. Add-on pickers with live totals. E-sign
              in place — typed or drawn. Revocable share links. Version history. Engagement analytics on every scroll.
              Clean PDF if legal still wants paper.
            </p>
            <Link
              href="/features/proposals"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--org-primary)]"
            >
              Read the breakdown →
            </Link>
          </div>
          <div className="surface p-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
              <BookOpen size={14} /> KBYG
            </div>
            <h3 className="hed-lg mt-3">Written Once. Read Twelve Ways.</h3>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              One Know-Before-You-Go doc in ATLVS. Renders per-persona in the portal and in the field. Artists get
              riders + catering. Crew sees call sheet + radio + PPE. Guests see logistics + tickets. Seventeen section
              types. One source, twelve reads.
            </p>
            <Link
              href="/features/guides"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--org-primary)]"
            >
              Read the breakdown →
            </Link>
          </div>
        </div>
      </section>

      {/* Security callout */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface grid gap-10 p-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
              Security
            </div>
            <h3 className="hed-xl mt-3">RLS at the Database.</h3>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Every record is scoped to its org and project in Postgres. Share links are signed, expirable, revocable,
              audit-logged. Nobody slips from the sponsor lounge into the artist compound — access enforced on the data,
              not in the UI.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Per-project portals — one link, one project",
              "Per-persona nav, per-persona reads",
              "Signed share links with expiry + revocation",
              "File downloads self-expire",
              "Every view logged in engagement analytics",
              "E-sign in place — typed or drawn, IP + timestamp captured",
            ].map((x) => (
              <li key={x} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-[var(--org-primary)]" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FAQSection
        title="GVTEWAY · FAQ"
        faqs={[
          {
            q: "What is GVTEWAY?",
            a: "The portal. Blue-branded. Every guest, artist, vendor, sponsor, and collaborator arrives through their own lane. Twelve personas — each sees only its scope.",
          },
          {
            q: "Do guests need an account?",
            a: "Read-only? Share the link — they're in. Contributing (riders, COIs, signatures)? A lightweight signup creates a credential scoped to that project. Fast by design.",
          },
          {
            q: "Can I white-label the portal?",
            a: "Festival. Your mark, colors, email, custom domain. Clients see your brand. Vendors see your vendors' brand.",
          },
          {
            q: "How is data isolated between projects?",
            a: "Postgres RLS. Every record is scoped to its org and project. The link you share maps to one project — nobody slips from one to another.",
          },
          {
            q: "Can one credential access two projects?",
            a: "Yes. A vendor on one project and a sponsor on another switches cleanly from the portal home. One login, two scoped reads.",
          },
        ]}
      />

      <CTASection
        title="Twelve Personas. One Source."
        subtitle="Wired default. Reskin if you want. Use it if you don't."
      />
    </div>
  );
}
