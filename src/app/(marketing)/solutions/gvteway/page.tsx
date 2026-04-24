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
  title: "GVTEWAY — twelve stakeholder doors. One manifest.",
  description:
    "Every stakeholder gets their own entrance. Artist, vendor, client, sponsor, guest, crew, delegation, media, VIP, hospitality, volunteer, athlete. Signed proposals, live advancing, per-persona door passes.",
  path: "/solutions/gvteway",
  keywords: ["GVTEWAY", "stakeholder portal", "artist portal", "vendor portal", "client portal", "event portal software"],
  ogImageEyebrow: "GVTEWAY",
  ogImageTitle: "Every stakeholder. Their own entrance.",
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
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">GVTEWAY · the door</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Every Stakeholder. Their Own Entrance.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Stop emailing PDFs to twelve different people at midnight. Every stakeholder gets their own door, their own data, their own lane. Artists advance. Vendors quote. Clients sign. Guests scan in. Crew clocks on. Same show — a dozen different reads, zero crossover.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">Doors open</Button>
          <Button href="/contact" variant="secondary">Backstage walkthrough</Button>
        </div>
      </section>

      {/* Personas */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Twelve Doors. One Manifest.</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Every persona gets its own entrance — nav, flows, deliverables built for their lane. The artist never sees the sponsor&apos;s invoice. The delegation never sees the vendor&apos;s COI. Nobody confused, nobody oversharing.
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
              23 block types. Scroll-spy nav. Per-phase contract refs. Add-on pickers with live totals. E-sign in place — typed or drawn. Revocable share links. Version history. Engagement analytics on every scroll. Ships a clean PDF when your legal team still wants paper.
            </p>
            <Link href="/features/proposals" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--org-primary)]">
              See the run-sheet →
            </Link>
          </div>
          <div className="surface-raised p-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">
              <BookOpen size={14} /> KBYG · door passes
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Write It Once. Everybody Reads Theirs.</h3>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              One Know-Before-You-Go doc in ATLVS. It renders per-persona in the portal and in the field PWA. Artists get riders + catering. Crew sees call sheet + radio + PPE. Guests see logistics + tickets. 16 section types. One source, twelve reads.
            </p>
            <Link href="/features/guides" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--org-primary)]">
              See the door pass →
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
            a: "The door. Blue-branded. Every stakeholder outside your org lives here. Twelve personas today — artist, vendor, client, sponsor, guest, crew, delegation, media, VIP, hospitality, volunteer, athlete. Each gets its own lane and only its own lane.",
          },
          {
            q: "Do guests need to sign up?",
            a: "Read-only? Share the link — they&apos;re in. Contributing (ridings, COIs, signatures)? A lightweight signup creates a user scoped to that project. Fastest two-step in the building.",
          },
          {
            q: "Can I white-label the door?",
            a: "Yes — Festival tier. Your logo, your colors, your email, your custom domain. Clients see your brand. Vendors see your vendors&apos; brand. The building is always yours.",
          },
          {
            q: "How is data isolated between projects?",
            a: "At the database. Every record is scoped to its org + project. The link you share maps to one project — nobody walks out of the sponsor suite into the artist compound.",
          },
          {
            q: "Can one person hold two door passes?",
            a: "Yes. A vendor on Festival A and a sponsor on Festival B switches cleanly from their portal entryway. One login, two lanes.",
          },
        ]}
      />

      <CTASection title="Ship Twelve Doors in an Afternoon." subtitle="Twelve personas wired default. Reskin if you want. Open it if you don&apos;t." />
    </div>
  );
}
