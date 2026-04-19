// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/marketing/Breadcrumb";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { StatStrip } from "@/components/marketing/StatStrip";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";

type IndustryConfig = {
  name: string;
  tagline: string;
  description: string;
  hero: { eyebrow: string; title: string; body: string };
  stats: { value: string; label: string }[];
  outcomes: string[];
  modules: { name: string; body: string }[];
  faqs: { q: string; a: string }[];
  related: string[];
};

const INDUSTRIES: Record<string, IndustryConfig> = {
  "live-events": {
    name: "Live events",
    tagline: "Music festivals, brand activations, residencies",
    description:
      "flyingbluewhale is the production management platform for live events — festivals, brand activations, club residencies, and pop-ups. Ticketing and on-site scan, artist advancing, Stripe Connect vendor payouts, and per-persona event guides (KBYG) come pre-wired.",
    hero: {
      eyebrow: "Live events",
      title: "From pitch to wrap — one platform.",
      body: "Replace the stack of tools most festival teams run: Asana for tasks, DocuSign for proposals, QuickBooks for invoices, Excel for advancing, iPads with rented scanner apps. flyingbluewhale unifies all of it.",
    },
    stats: [
      { value: "15k+", label: "guests / show" },
      { value: "< 100ms", label: "scan latency" },
      { value: "6", label: "persona portals" },
      { value: "25%", label: "fewer invoice errors" },
    ],
    outcomes: [
      "Scan tickets on any phone — no rental scanner kits",
      "Ship artist advancing via GVTEWAY portal, not PDFs",
      "Route vendor payouts through Stripe Connect on approval",
      "Publish a per-role KBYG (guest, crew, artist) from one schema",
      "Proposals with e-sign → projects on signature — no manual handoff",
      "Crew clocks in through COMPVSS with geo-verification",
    ],
    modules: [
      { name: "Ticketing", body: "Atomic scan, sub-100ms, offline queue. Tiered tickets, transfers, VIP cabanas." },
      { name: "Artist advancing", body: "Riders, input lists, stage plots, catering, travel, schedule. All via portal." },
      { name: "Vendor payouts", body: "Stripe Connect Express onboarding; payout on PO fulfillment." },
      { name: "KBYG", body: "Role-scoped event guide published to portal + mobile. 16 section types." },
      { name: "Finance", body: "Per-event P&L, deposit/balance payment splits, per-vendor invoicing." },
      { name: "Compliance", body: "Vendor COI tracking with expiry alerts, W-9 storage, audit log." },
    ],
    faqs: [
      {
        q: "How many guests can flyingbluewhale handle?",
        a: "We've scanned 15,000+ guests per event without a blip. The atomic-update check-in pattern handles any throughput Postgres can handle — so the bottleneck is your network, not us.",
      },
      {
        q: "Can I use my existing ticketing vendor?",
        a: "Yes — we import ticket batches via CSV or the /api/v1/tickets endpoint. Most teams use our native ticketing once they see the offline scanner + analytics.",
      },
      {
        q: "Does the artist portal support multi-artist festivals?",
        a: "Yes. Each artist gets a project slug (or subproject slug). Advancing, schedule, travel, and rider are scoped per-artist; shared production info lives on the parent project.",
      },
      {
        q: "Can I white-label for a promoter's brand?",
        a: "Custom domains + branding (logo, colors, email templates) are Enterprise features. Most clubs and promoters white-label their guest-facing portal.",
      },
    ],
    related: ["touring", "corporate", "fabrication"],
  },
  fabrication: {
    name: "Fabrication",
    tagline: "Scenic, signage, custom build",
    description:
      "Run your fabrication shop on flyingbluewhale. Fabrication orders with due dates, equipment + rental tracking, purchase orders and receiving, multi-stage crew scheduling, and Stripe Connect for your subcontractors.",
    hero: {
      eyebrow: "Fabrication",
      title: "From CAD to crate — tracked.",
      body: "Scenic and signage shops live in spreadsheets and hand-offs. Replace them with fabrication orders, PO receiving, equipment reservations, and vendor Connect payouts on a single platform.",
    },
    stats: [
      { value: "4x", label: "faster PO turnaround" },
      { value: "100%", label: "receiving tracked" },
      { value: "0", label: "duplicate POs" },
      { value: "2", label: "days to invoice" },
    ],
    outcomes: [
      "Fabrication orders with status machine (open → in-progress → blocked → complete)",
      "PO receiving with deviation tracking (vs ordered)",
      "Equipment inventory with asset tags and reservations",
      "Subcontractor Connect payouts on PO fulfillment",
      "Crew scheduling with day-rate cents + credentialing",
      "Materials + labor both tied to the same project",
    ],
    modules: [
      { name: "Fabrication orders", body: "Titled orders with due dates, descriptions, status machine, attached files." },
      { name: "Procurement", body: "Requisitions → POs → receiving; COI + W-9 tracking on every vendor." },
      { name: "Equipment", body: "Canonical inventory with asset tags, serial numbers, daily rates, availability." },
      { name: "Crew", body: "Day-rate cents, credential engine, scheduling grid." },
      { name: "Finance", body: "Per-project material + labor splits, budget utilization bars." },
    ],
    faqs: [
      {
        q: "Can flyingbluewhale handle subcontractor workflows?",
        a: "Yes. Each subcontractor gets a vendor record + Connect account; POs route through them; payouts release on PO fulfillment. COIs are tracked with expiry alerts so nothing lapses mid-project.",
      },
      {
        q: "Is there a BOM / parts explosion feature?",
        a: "Not in v1 — fabrication orders carry a descriptive scope + linked PO line items. BOM with parts hierarchy is on the v2 roadmap; contact us if it's a dealbreaker.",
      },
      {
        q: "Can I track rentals vs purchases?",
        a: "Yes. Equipment has an `owned` vs `rental` designation. Rentals carry start/end dates and per-day rates; we never double-book.",
      },
    ],
    related: ["live-events", "corporate", "touring"],
  },
  touring: {
    name: "Touring",
    tagline: "Per-city advancing + crew",
    description:
      "flyingbluewhale is the production management platform for touring operations — 40+ shows a year, one artist portal per city, shared crew pool, per-diem advances, and a mobile PWA that works when venue wifi doesn't.",
    hero: {
      eyebrow: "Touring",
      title: "Run the tour, not the spreadsheet.",
      body: "Per-city advancing means 40+ variants of the same rider. flyingbluewhale keeps the canonical rider in one place and scopes advancing per event.",
    },
    stats: [
      { value: "40+", label: "shows / year" },
      { value: "1×", label: "rider edit" },
      { value: "< 2m", label: "per-diem request → pay" },
      { value: "6", label: "persona portals / show" },
    ],
    outcomes: [
      "Canonical rider in one place; per-city overrides auto-advance",
      "Shared crew pool with per-event scheduling + day-rate",
      "Per-diem + emergency advances with Stripe payout on approval",
      "Mobile PWA works through venue wifi blackholes",
      "Credentials (DOT, licenses, certs) tracked with expiry alerts",
      "Daily settlement + wrap-up in < 2 days post-show",
    ],
    modules: [
      { name: "Advancing", body: "Canonical + per-event overrides. Deliverables tracked across the tour." },
      { name: "Crew pool", body: "Shared roster, per-city scheduling, day-rate cents, credential expiry alerts." },
      { name: "Advances", body: "Per-diem + emergency requests with status machine + Stripe payout." },
      { name: "COMPVSS", body: "Offline clock-in, today's call sheet, venue guide." },
    ],
    faqs: [
      {
        q: "Can I clone a project for the next city?",
        a: "Yes — 'Clone project' copies the canonical scope, schedule template, crew assignments, and guide blocks. You edit only what's different for the next city.",
      },
      {
        q: "Do advances support ACH / Stripe Connect?",
        a: "Yes. Cash advances route through Stripe Connect Express to the crew member's linked bank. Approval → payout is usually under 2 minutes.",
      },
      {
        q: "How does the canonical rider handle per-city variations?",
        a: "Each event inherits the rider from the parent tour project. Per-event deliverables (e.g. a stage plot for a specific venue) override without mutating the canonical version. History is preserved.",
      },
    ],
    related: ["live-events", "fabrication"],
  },
  corporate: {
    name: "Corporate",
    tagline: "Product launches, AGMs, summits",
    description:
      "flyingbluewhale for corporate and brand events — client-facing proposals with e-sign, vendor COI tracking, stakeholder portals, and executive-grade guest experiences.",
    hero: {
      eyebrow: "Corporate events",
      title: "From RFP to recap — on one platform.",
      body: "Client teams want proposals they can review and sign. Execs want KBYG guides. Vendors need COIs managed. flyingbluewhale does all three, tuned for the corporate cadence.",
    },
    stats: [
      { value: "14 → 2", label: "days to invoice" },
      { value: "100%", label: "vendor COIs tracked" },
      { value: "< 1 day", label: "from proposal to project" },
      { value: "24/7", label: "client portal access" },
    ],
    outcomes: [
      "Interactive proposals with e-sign converting to a live project on signature",
      "Client portal 24/7 for proposals, deliverables, invoices, files, messages",
      "Vendor COI + W-9 tracking with expiry alerts",
      "Per-persona KBYG: execs, VIPs, staff, crew",
      "Stripe Checkout for invoice payment",
      "Audit log on every mutation for compliance",
    ],
    modules: [
      { name: "Proposals", body: "23 block types, scroll-spy nav, two-mode e-sign, share links, version history." },
      { name: "Client portal", body: "Proposals, deliverables, invoices, shared files, direct messages." },
      { name: "Compliance", body: "Vendor COI tracking, W-9 storage, audit log, SOC-2 ready." },
      { name: "Finance", body: "Stripe Checkout for invoices, deposit/balance splits, live P&L." },
    ],
    faqs: [
      {
        q: "Does flyingbluewhale support SOC-2 / ISO compliance?",
        a: "We ship enterprise-grade primitives today (RLS, audit log, encryption in transit + at rest, signed URLs, rate limiting, CSP). Formal SOC-2 report is in progress for Enterprise tier customers — contact sales for current status.",
      },
      {
        q: "Can we route proposals through legal?",
        a: "Yes. Create an internal 'Legal review' share link (different from the client link), annotate + revise, then send the client the final version. Version history tracks every edit.",
      },
      {
        q: "Is there a DocuSign / Dropbox Sign integration?",
        a: "We ship native e-sign (typed + canvas) with SHA-256 hash. For companies that require DocuSign specifically, we embed their iframe — custom integration on Enterprise.",
      },
    ],
    related: ["live-events", "fabrication"],
  },
};

type Props = { params: Promise<{ industry: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry } = await params;
  const info = INDUSTRIES[industry];
  if (!info) return buildMetadata({ title: "Solution", description: "Industry solution", path: `/solutions/${industry}` });
  return buildMetadata({
    title: `${info.name} — ${info.tagline} on flyingbluewhale`,
    description: info.description,
    path: `/solutions/${industry}`,
    keywords: [info.name.toLowerCase(), info.tagline.toLowerCase()],
    ogImageEyebrow: "Solutions",
    ogImageTitle: info.hero.title,
  });
}

export async function generateStaticParams() {
  return Object.keys(INDUSTRIES).map((industry) => ({ industry }));
}

export default async function IndustryPage({ params }: Props) {
  const { industry } = await params;
  const info = INDUSTRIES[industry];
  if (!info) notFound();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Solutions", path: "/solutions" },
    { name: info.name, path: `/solutions/${industry}` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <Breadcrumbs crumbs={crumbs} />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">{info.hero.eyebrow}</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl text-balance">{info.hero.title}</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">{info.hero.body}</p>
        <div className="mt-8 flex gap-3">
          <Button href="/signup">Start free</Button>
          <Button href="/contact" variant="secondary">Book a demo</Button>
        </div>
      </section>

      <StatStrip stats={info.stats} />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight">Outcomes</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {info.outcomes.map((o) => (
            <li key={o} className="surface flex items-start gap-3 p-4">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--org-primary)]" />
              <span className="text-sm">{o}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight">Modules used</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {info.modules.map((m) => (
            <div key={m.name} className="surface p-5">
              <div className="text-sm font-semibold">{m.name}</div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      <FAQSection title={`${info.name} · FAQ`} faqs={info.faqs} />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Related industries</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {info.related.map((r) => {
            const rel = INDUSTRIES[r];
            if (!rel) return null;
            return (
              <Link key={r} href={`/solutions/${r}`} className="surface hover-lift p-4">
                <div className="text-sm font-semibold">{rel.name}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{rel.tagline}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <CTASection />
    </>
  );
}
