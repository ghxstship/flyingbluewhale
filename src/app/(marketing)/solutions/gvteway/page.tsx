// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Mic2, Truck, Users, Award, Ticket, HardHat, BookOpen, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/marketing/Breadcrumb";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, productSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "GVTEWAY — external stakeholder portals for production",
  description:
    "GVTEWAY is flyingbluewhale's portal surface. One slug per project, one tailored view per persona — artist, vendor, client, sponsor, guest, crew. Interactive proposals with e-sign, artist advancing with deliverables, per-role event guides (KBYG).",
  path: "/solutions/gvteway",
  keywords: ["GVTEWAY", "stakeholder portal", "artist portal", "vendor portal", "client portal", "event portal software"],
  ogImageEyebrow: "GVTEWAY",
  ogImageTitle: "External portals that do the work",
});

export default function GvtewayPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Solutions", path: "/solutions" },
    { name: "GVTEWAY", path: "/solutions/gvteway" },
  ];

  return (
    <div data-platform="gvteway">
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          productSchema({
            name: "GVTEWAY — External Stakeholder Portals",
            description: "Slug-scoped external portals with 6 persona surfaces (artist, vendor, client, sponsor, guest, crew).",
            url: "https://flyingbluewhale.app/solutions/gvteway",
          }),
        ]}
      />
      <Breadcrumbs crumbs={crumbs} />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">GVTEWAY · External portals</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">External portals that do the work.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Stop emailing PDFs. Every external stakeholder gets a slug-scoped workspace with exactly the data they
          need — and nothing else. Artists advance. Vendors submit quotes. Clients sign proposals. Guests see
          tickets. Crew gets the call sheet. Same project, six tailored views.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">Start free</Button>
          <Button href="/contact" variant="secondary">Book a demo</Button>
        </div>
      </section>

      {/* Personas */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Six persona portals.</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Each persona sees a curated subset of the project, with its own rail, flows, and gate conditions.
        </p>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              { icon: Mic2, title: "Artist", body: "Technical rider, hospitality rider, input list, stage plot, crew list, guest list, schedule, travel." },
              { icon: Truck, title: "Vendor", body: "Submissions, equipment pull list, purchase orders, invoices, credential uploads (COI, W-9)." },
              { icon: Users, title: "Client", body: "Proposals with e-sign, deliverables, invoices with Stripe Checkout, messages, shared files." },
              { icon: Award, title: "Sponsor", body: "Activations, brand assets, reporting, impression tracking." },
              { icon: Ticket, title: "Guest", body: "Tickets (buy/claim/transfer), schedule, day-of logistics (parking, entrances, rideshare)." },
              { icon: HardHat, title: "Crew", body: "Call sheet, time submission, advance requests, safety briefing, SOP access." },
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
              23 block types, scroll-spy navigation, per-phase contract refs, add-on pickers with live totals,
              two-mode e-sign (typed + canvas), share-link auth, version history, analytics on every scroll.
              Print CSS that turns a proposal into a PDF without headless Chrome.
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
              Author a Boarding-Pass style guide once in ATLVS; it renders role-scoped in both the portal and the
              mobile PWA. Artists see riders; crew sees radio channels + SOPs; guests see logistics. 16 section
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
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">Slug is the boundary.</h3>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Every portal route is slug-scoped (<code>/p/[slug]/<i>persona</i></code>). The slug is the security
              boundary — combined with row-level security, there's no way to accidentally query across projects.
              Share links are HMAC-signed, expirable, revocable, and logged.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Slug-scoped routes — one slug per project",
              "Per-persona nav, per-persona data",
              "Signed share links with expiry + revocation",
              "60-second expiring signed download URLs",
              "Every view recorded in proposal_events",
              "Two-mode e-sign (typed + canvas) with SHA-256 hash",
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
            q: "What does GVTEWAY stand for?",
            a: "GVTEWAY is the codename for flyingbluewhale's external portal surface — the blue-branded shell served at /p/[slug]/<persona>. Each slug is a project; each persona is a role (artist, vendor, client, sponsor, guest, crew).",
          },
          {
            q: "Do external stakeholders need to sign up?",
            a: "No for read access via share links (HMAC-signed, time-boxed). Yes if they want to contribute (submit a rider, upload a COI, sign a proposal) — a lightweight signup creates a user scoped to that project only.",
          },
          {
            q: "Can I white-label a portal?",
            a: "Custom branding (logo, colors, email) and custom domains are Enterprise-tier. Self-serve setup lives at /console/settings/domains.",
          },
          {
            q: "How is data isolated between projects?",
            a: "Postgres row-level security. Every domain table is scoped by org_id and (for portals) project_id. The slug in the URL maps to project_id; RLS enforces the rest.",
          },
          {
            q: "Can a single person see multiple personas?",
            a: "Yes — a user's session maps to the right persona via personaForRole(), but a user with access to multiple projects/personas can switch between them from the portal gateway.",
          },
        ]}
      />

      <CTASection title="Ship portals in an afternoon" subtitle="Six personas wired by default. Customize as needed." />
    </div>
  );
}
