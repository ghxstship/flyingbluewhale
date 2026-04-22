// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
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
import { buildMetadata, productSchema } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({
  title: "GVTEWAY — stakeholder portals for production",
  description:
    "GVTEWAY is the stakeholder portal from Second Star Technologies. One tailored workspace per persona — artist, vendor, client, sponsor, guest, crew. Interactive proposals, artist advancing, role-scoped Know Before You Go guides.",
  path: "/solutions/gvteway",
  keywords: ["GVTEWAY", "stakeholder portal", "artist portal", "vendor portal", "client portal", "event portal software"],
  ogImageEyebrow: "GVTEWAY",
  ogImageTitle: "External portals that do the work",
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
        data={[productSchema({
            name: "GVTEWAY — Stakeholder Portals",
            description: "A tailored workspace for every stakeholder outside your org — artist, vendor, client, sponsor, guest, crew.",
            url: "https://flyingbluewhale.app/solutions/gvteway",
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">GVTEWAY · Stakeholder portals</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Loop In Everyone Outside.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Stop emailing PDFs. Every stakeholder gets their own workspace with exactly the data they need —
          and nothing else. Artists advance. Vendors submit quotes. Clients sign proposals. Guests see their
          tickets. Crew gets the call sheet. Same project, six tailored views.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">Start free</Button>
          <Button href="/contact" variant="secondary">Book a demo</Button>
        </div>
      </section>

      {/* Personas */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Six Persona Portals.</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Each persona sees its own lane — with a nav, flows, and deliverables built for their role.
        </p>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              { icon: Mic2, title: "Artist", body: "Tech rider, hospitality rider, input list, stage plot, crew list, guest list, schedule, travel." },
              { icon: Truck, title: "Vendor", body: "Submissions, pull list, purchase orders, invoices, COI and W-9 uploads." },
              { icon: Users, title: "Client", body: "Proposals signed in place, deliverables, invoices payable by card or ACH, messages, shared files." },
              { icon: Award, title: "Sponsor", body: "Activations, brand assets, reporting, and impression tracking." },
              { icon: Ticket, title: "Guest", body: "Tickets — buy, claim, transfer — plus schedule and day-of logistics (parking, entrances, rideshare)." },
              { icon: HardHat, title: "Crew", body: "Call sheet, time submission, advance requests, safety briefing, and SOPs." },
            ]}
          />
        </div>
      </section>

      {/* Signature features */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div className="surface-raised p-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">
              <Share2 size={14} /> Interactive proposals
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Proposals that close themselves.</h3>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Twenty-three block types, scroll-spy navigation, per-phase contract refs, add-on pickers with live
              totals, e-sign in place (typed or drawn), revocable share links, version history, and engagement
              analytics on every scroll. Clean PDF export when you need one.
            </p>
            <Link href="/features/proposals" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--org-primary)]">
              Explore proposals →
            </Link>
          </div>
          <div className="surface-raised p-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">
              <BookOpen size={14} /> Event guides (KBYG)
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Know Before You Go, built in.</h3>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Write a single KBYG in ATLVS. It renders role-scoped in the portal and in the field app.
              Artists see riders, crew sees radio channels and SOPs, guests see logistics. Sixteen section
              types cover every production detail.
            </p>
            <Link href="/features/guides" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--org-primary)]">
              Explore event guides →
            </Link>
          </div>
        </div>
      </section>

      {/* Security callout */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface-raised grid gap-10 p-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">Security</div>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">The link is the access.</h3>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Every portal is scoped to a single project. Share links are signed, expirable, revocable, and
              logged. There's no way to slip across projects — access is enforced on the data, not in the app.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Per-project portals — one link, one project",
              "Per-persona nav, per-persona data",
              "Signed share links with expiry and revocation",
              "Auto-expiring file download links",
              "Every view captured in engagement analytics",
              "E-sign in place — typed or drawn",
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
            a: "GVTEWAY is the stakeholder portal from Second Star Technologies — the blue-branded app where everyone outside your org works. Each project has six persona views: artist, vendor, client, sponsor, guest, and crew.",
          },
          {
            q: "Do external stakeholders need to sign up?",
            a: "No for read access — share a link, they're in. Yes if they want to contribute (submit a rider, upload a COI, sign a proposal). A lightweight signup creates a user scoped to that project only.",
          },
          {
            q: "Can I white-label a portal?",
            a: "Yes, on Enterprise. Custom branding — logo, colors, email — and custom domains for your portals. Your clients see your brand; your vendors see your vendors' brand.",
          },
          {
            q: "How is data isolated between projects?",
            a: "At the data layer. Every record is scoped to its organization and project. The link you share maps to a single project; no view can reach into another one.",
          },
          {
            q: "Can a single person have multiple personas?",
            a: "Yes. Someone who's both a vendor on one project and a sponsor on another can switch cleanly from their portal gateway.",
          },
        ]}
      />

      <CTASection title="Ship portals in an afternoon" subtitle="Six personas wired by default. Customize as needed." />
    </div>
  );
}
