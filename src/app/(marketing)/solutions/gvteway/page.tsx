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
  title: "GVTEWAY — The Door",
  description:
    "Every guest, artist, and vendor — their own way in. Twelve doors. One manifest. Signed proposals, live advancing, per-persona door passes. Private by design.",
  path: "/solutions/gvteway",
  keywords: ["GVTEWAY", "stakeholder portal", "artist portal", "vendor portal", "client portal", "event portal software"],
  ogImageEyebrow: "GVTEWAY",
  ogImageTitle: "Every Guest, Their Own Way In.",
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
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">GVTEWAY · The Door</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Every Guest. Their Own Way In.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Twelve doors. One manifest. Artists advance. Vendors quote. Clients sign. Guests scan in. Crew clocks on. Same night — a dozen private reads, no crossover by design.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">Get on the list</Button>
          <Button href="/contact" variant="secondary">Private walkthrough</Button>
        </div>
      </section>

      {/* Personas */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Twelve Doors. One Manifest.</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Every persona gets its own entrance — nav, flows, deliverables tuned to their lane. The artist never sees the sponsor&apos;s invoice. The delegation never sees the vendor&apos;s COI. Private by design.
        </p>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              { icon: Mic2, title: "Artist", body: "Tech rider, hospitality rider, input list, stage plot, guest list, schedule, travel." },
              { icon: Truck, title: "Vendor", body: "Submissions, pull list, POs, invoices, COI + W-9 uploads, training." },
              { icon: Users, title: "Client", body: "Proposals signed in place, deliverables, invoices by card/ACH, messages, files." },
              { icon: Award, title: "Sponsor", body: "Entitlements tracker, activations, brand assets, reporting, impressions." },
              { icon: Ticket, title: "Guest", body: "Tickets — buy, claim, transfer. Schedule. Day-of logistics. Rideshare hand-off." },
              { icon: HardHat, title: "Crew", body: "Call sheet, time submission, advances, safety briefing, SOPs." },
              { icon: Users, title: "Delegation", body: "Entries, rate card, training venues, meetings, cases, transport, accommodation, visa." },
              { icon: BookOpen, title: "Media", body: "MPC rate card, accommodation, shuttles, press-conf RSVP, info-on-demand." },
              { icon: Award, title: "VIP + Hospitality", body: "Dedicated fleet, hotel allocation, itinerary, guest list, package access." },
              { icon: HardHat, title: "Volunteer", body: "Application, training, shift schedule, uniform pickup, door pass." },
              { icon: Mic2, title: "Athlete", body: "Training bookings, resident services, safeguarding, visa, privacy self-service." },
              { icon: Share2, title: "Privacy (all)", body: "Every persona gets DSAR self-service + consent management. GDPR, handled." },
            ]}
          />
        </div>
      </section>

      {/* Signature features */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div className="surface-raised p-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">
              <Share2 size={14} /> Proposals · signed live
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Proposals That Close Themselves.</h3>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Twenty-three block types. Scroll-spy nav. Per-phase contract refs. Add-on pickers with live totals. E-sign in place — typed or drawn. Revocable share links. Version history. Engagement analytics on every scroll. A clean PDF if your legal team still wants paper.
            </p>
            <Link href="/features/proposals" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--org-primary)]">
              Read the run-sheet →
            </Link>
          </div>
          <div className="surface-raised p-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">
              <BookOpen size={14} /> KBYG · door passes
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Written Once. Read Twelve Ways.</h3>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              One Know-Before-You-Go doc in ATLVS. Renders per-persona in the portal and in the floor PWA. Artists get riders + catering. Crew sees call sheet + radio + PPE. Guests see logistics + tickets. Sixteen section types. One source, twelve reads.
            </p>
            <Link href="/features/guides" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--org-primary)]">
              Read the door pass →
            </Link>
          </div>
        </div>
      </section>

      {/* Security callout */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface-raised grid gap-10 p-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">Security</div>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">The Link Is the Access.</h3>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Every door maps to one project. Share links are signed, expirable, revocable, and logged. Nobody slips from the sponsor lounge into the artist compound — access is enforced on the data, not just in the UI.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Per-project doors — one link, one project",
              "Per-persona nav, per-persona manifest",
              "Signed share links with expiry + revocation",
              "File downloads auto-expire — no backstage leaks",
              "Every view logged in engagement analytics",
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
            a: "The door. Blue-branded. Every guest, artist, vendor, sponsor, and collaborator arrives through their own lane. Twelve personas today — each sees only their lane.",
          },
          {
            q: "Do guests need an account?",
            a: "Read-only? Share the link — they&apos;re in. Contributing (riders, COIs, signatures)? A lightweight signup creates a user scoped to that project. Fast by design.",
          },
          {
            q: "Can I white-label the door?",
            a: "Festival tier. Your mark, colors, email, custom domain. Clients see your brand. Vendors see your vendors&apos; brand. The house is always yours.",
          },
          {
            q: "How is data isolated between rooms?",
            a: "At the database. Every record is scoped to its org and project. The link you share maps to one project — nobody slips from the sponsor suite into the artist compound.",
          },
          {
            q: "Can one person hold two door passes?",
            a: "Yes. A vendor on one room and a sponsor on another switches cleanly from their portal entryway. One login, two lanes.",
          },
        ]}
      />

      <CTASection title="Twelve Doors. One Manifest." subtitle="Twelve personas wired default. Reskin if you want. Open it if you don&apos;t." />
    </div>
  );
}
