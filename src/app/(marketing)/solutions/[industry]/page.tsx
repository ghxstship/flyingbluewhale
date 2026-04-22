// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { StatStrip } from "@/components/marketing/StatStrip";
import { buildMetadata } from "@/lib/seo";
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
    name: "Live Events",
    tagline: "Venue residencies, club nights, one-offs",
    description:
      "Second Star Technologies is the production platform for Live Events — club residencies, brand-hosted nights, album release parties, rooftop pop-ups. Ticketing with on-site scan, artist advancing, direct vendor payouts, and per-role Know Before You Go guides — all connected on day one.",
    hero: {
      eyebrow: "Live Events",
      title: "From Pitch to Wrap. One Platform.",
      body: "Replace the stack most venue teams run — Asana for tasks, DocuSign for contracts, QuickBooks for invoices, spreadsheets for advancing. Second Star Technologies unifies all of it.",
    },
    stats: [
      { value: "15k+", label: "guests / night" },
      { value: "< 100ms", label: "scan latency" },
      { value: "6", label: "persona portals" },
      { value: "25%", label: "fewer invoice errors" },
    ],
    outcomes: [
      "Scan tickets on any phone — no rental scanner kits",
      "Ship artist advancing through the portal, not PDF chains",
      "Route vendor payouts directly on approval",
      "Publish one KBYG — guest, crew, artist each see their version",
      "Signed proposals turn into live projects on signature",
      "Crew clock in through COMPVSS with geo-verification",
    ],
    modules: [
      { name: "Ticketing", body: "Sub-100ms scan. Zero duplicates. Offline queue. Tiered tickets, transfers, VIP cabanas." },
      { name: "Artist Advancing", body: "Riders, input lists, stage plots, catering, travel, schedule — all through the portal." },
      { name: "Vendor Payouts", body: "Vendors onboard a payout account. Direct payout on PO fulfillment — ACH, card, or wire." },
      { name: "KBYG Guides", body: "One source, role-scoped views. Sixteen section types rendered to portal and mobile." },
      { name: "Finance", body: "Per-event P&L, deposit and balance splits, per-vendor invoicing." },
      { name: "Compliance", body: "Vendor COI tracking with expiry alerts, W-9 storage, immutable audit log." },
    ],
    faqs: [
      {
        q: "How many guests can the platform handle?",
        a: "We've scanned 15,000+ guests per event without a blip. Every ticket scans exactly once under concurrent load — the bottleneck is your network, not us.",
      },
      {
        q: "Can I use my existing ticketing vendor?",
        a: "Yes. Import ticket batches via CSV or webhook. Most teams switch to native ticketing once they see the offline scanner and analytics.",
      },
      {
        q: "Can I white-label for a venue's or promoter's brand?",
        a: "Yes, on Enterprise. Custom branding and custom domains. Most clubs and promoters white-label their guest-facing portal.",
      },
    ],
    related: ["concerts", "festivals-tours", "brand-activations"],
  },

  concerts: {
    name: "Concerts",
    tagline: "Single-night shows, amphitheatres, arenas",
    description:
      "Purpose-built for Concerts — single-night shows to stadium-scale runs. Canonical rider, per-venue overrides, shared crew pool, venue advancing, real-time box office metrics, and a field app the house staff actually wants to use.",
    hero: {
      eyebrow: "Concerts",
      title: "One Rider. Every Venue.",
      body: "Concert touring operations live in forty spreadsheets. We keep the canonical rider in one place and scope per-venue variants on top — no copy-paste, no lost revisions.",
    },
    stats: [
      { value: "1×", label: "rider edit" },
      { value: "40+", label: "venues / tour" },
      { value: "< 2m", label: "per-diem approval → payout" },
      { value: "99.9%", label: "scan uptime" },
    ],
    outcomes: [
      "Canonical rider with per-venue overrides — edits cascade correctly",
      "Shared crew pool with per-show scheduling and day rates",
      "Per-diem and emergency advances payout on approval",
      "Box-office metrics and seat-map deltas in real time",
      "Credentials (DOT, insurance, certs) tracked with expiry alerts",
      "Daily settlement in under 48 hours post-show",
    ],
    modules: [
      { name: "Advancing", body: "Canonical plus per-show overrides. Deliverables tracked across the run." },
      { name: "Crew Pool", body: "Shared roster, per-show scheduling, day rates, credential expiry alerts." },
      { name: "Advances", body: "Per-diem and emergency requests with clean status flow and direct payout." },
      { name: "Box Office", body: "Real-time capacity dashboards, seat-map deltas, VIP flags." },
    ],
    faqs: [
      {
        q: "Can the canonical rider handle multi-artist bills?",
        a: "Yes. Each artist has its own project under the parent tour. Advancing, schedule, travel, and rider stay scoped per artist; shared venue info lives on the parent.",
      },
      {
        q: "Do advances pay out directly?",
        a: "Yes. Cash advances route directly to the crew member's linked account. Approval to payout is usually under two minutes.",
      },
      {
        q: "Can I pull manifest data from my ticketing vendor?",
        a: "Yes. CSV bulk imports, webhook from the major ticketing systems, or manual upload. The mobile scanner works offline and syncs when it reconnects.",
      },
    ],
    related: ["festivals-tours", "live-events", "theatrical-performances"],
  },

  "festivals-tours": {
    name: "Festivals & Tours",
    tagline: "Multi-day, multi-stage, multi-city",
    description:
      "Festivals and Tours are the hardest shape in live production — dozens of artists, multiple stages, multi-day windows, traveling crew, and a calendar that looks like a subway map. Built for that scale from day one.",
    hero: {
      eyebrow: "Festivals & Tours",
      title: "Run the Festival. Not the Spreadsheet.",
      body: "Multi-day festivals and city-to-city tours fall over when any one of fifty moving pieces breaks. Unify artist advancing, vendor payouts, crew scheduling, credentials, and KBYG under one platform that doesn't.",
    },
    stats: [
      { value: "200+", label: "artists / festival" },
      { value: "6", label: "stages managed" },
      { value: "40+", label: "cities / tour" },
      { value: "15k+", label: "scans / day" },
    ],
    outcomes: [
      "Per-artist advancing with a set-time grid and stage assignments",
      "Per-city project cloning — edit only what's different",
      "Credential manifest with RFID and NFC wristband integration",
      "Direct vendor payouts on approval",
      "Real-time stage-side decision board visible to promoter and site ops",
      "Per-artist settlement in days, not weeks",
    ],
    modules: [
      { name: "Advancing Grid", body: "Per-artist rider and per-stage set-time grid with conflict detection." },
      { name: "Credentials", body: "Wristband and badge manifest with access tiers, counts, and RFID linkage." },
      { name: "Procurement", body: "Requisition to PO to receiving. Vendor COI and W-9 tracked with expiry." },
      { name: "COMPVSS Field App", body: "Offline ticket scan, crew clock-in, incident reports from any stage." },
      { name: "Per-City Clone", body: "One click clones the project. Override only what differs." },
    ],
    faqs: [
      {
        q: "Does the platform handle RFID wristbands?",
        a: "Yes. We integrate with the major RFID vendors (Intellitix, ID&C, Plus ID). Wristbands can be pre-assigned or bound at pickup; access tiers enforce at scan.",
      },
      {
        q: "Can I run a multi-day festival and a city tour on the same account?",
        a: "Yes. Each production is its own project, and the platform is multi-project from day one. The same team works across them without logging out.",
      },
      {
        q: "What happens when venue Wi-Fi dies?",
        a: "The field app is offline-first. Scans queue on the device and reconcile cleanly when the phone reconnects. No dropped entries.",
      },
    ],
    related: ["concerts", "live-events", "theatrical-performances"],
  },

  "immersive-experiences": {
    name: "Immersive Experiences",
    tagline: "Installations, walk-throughs, pop-ups",
    description:
      "Immersive Experiences demand operations software that respects narrative pacing — timed-entry scheduling, per-zone staffing, capacity ceilings, role-specific guides, and an advancing system that treats every act as its own discipline.",
    hero: {
      eyebrow: "Immersive Experiences",
      title: "The Show Runs You. We Run the Show.",
      body: "Immersive runs live or die by seconds. We handle the operations — timed entries, per-zone capacity, cast and crew scheduling — so your team stays in the experience, not the spreadsheet.",
    },
    stats: [
      { value: "< 15s", label: "entry gap drift" },
      { value: "18", label: "zones staffed" },
      { value: "6", label: "capacity tiers" },
      { value: "0", label: "missed cues from ops" },
    ],
    outcomes: [
      "Timed-entry scheduling with enforced capacity ceilings",
      "Per-zone staffing grid with role, shift, and break tracking",
      "Cast and crew scheduling separated from front-of-house",
      "Per-ticket scan with immediate capacity decrement",
      "Incident reports with chain-of-custody for compliance",
      "Per-actor KBYG with safety protocols and character bible",
    ],
    modules: [
      { name: "Timed Entry", body: "Fifteen-minute windows with hard capacity. Waitlist with automated promotion." },
      { name: "Zones & Roles", body: "Zone map, role coverage, break scheduling, escalation routing." },
      { name: "Incidents", body: "One-tap incident log from the field, routed to the safety lead with chain-of-custody." },
      { name: "Cast Portal", body: "Character bible, blocking notes, safety protocols, per-show call sheet." },
    ],
    faqs: [
      {
        q: "Can we enforce hard capacity per zone?",
        a: "Yes. Each zone has a maximum headcount. The scanner refuses entries that would exceed it, routes the guest to waitlist, and promotes when someone exits.",
      },
      {
        q: "Can we publish a separate guide for cast vs. front-of-house?",
        a: "Yes. KBYG guides are per-persona. Cast sees blocking, cue notes, and safety drills. Front-of-house sees guest flow, FAQ, and emergency procedures.",
      },
      {
        q: "How are incidents handled?",
        a: "One-tap from the field. GPS, photo, and reporter captured automatically. The report routes to the safety lead, and the audit log preserves chain-of-custody for insurance.",
      },
    ],
    related: ["theatrical-performances", "brand-activations", "live-events"],
  },

  "brand-activations": {
    name: "Brand Activations",
    tagline: "Pop-ups, product launches, experiential marketing",
    description:
      "Brand Activations turn marketing dollars into memorable moments. We handle the operations — agency-to-client proposals, vendor COIs, RSVP flow, on-site capture, post-event analytics — so the creative team stays creative.",
    hero: {
      eyebrow: "Brand Activations",
      title: "From RFP to Recap. Same Platform.",
      body: "Activations live or die by the speed of the hand-off — agency to client, creative to production, production to vendors. Second Star Technologies shortens every hand-off to zero.",
    },
    stats: [
      { value: "< 1 day", label: "proposal → signed project" },
      { value: "100%", label: "vendor COIs tracked" },
      { value: "40%", label: "faster reconciliation" },
      { value: "24/7", label: "client portal access" },
    ],
    outcomes: [
      "Signed proposals convert to live projects on signature",
      "Client portal open 24/7 for proposals, deliverables, invoices, files, and messages",
      "Vendor COI and W-9 tracking with expiry alerts",
      "RSVP and check-in flow with lead capture at ingress",
      "Card or ACH invoice payments with deposit and balance splits",
      "Post-event recap deck auto-drafted from the activation data",
    ],
    modules: [
      { name: "Proposals", body: "Twenty-three block types, scroll-spy nav, e-sign in place, share links, version history." },
      { name: "Client Portal", body: "Proposals, deliverables, invoices, shared files, direct messages." },
      { name: "RSVP + Capture", body: "Email RSVP with ticketing. On-site scan captures lead data to the CRM." },
      { name: "Finance", body: "Card or ACH invoicing, deposit and balance splits, live P&L per activation." },
    ],
    faqs: [
      {
        q: "Can agencies share one workspace with multiple clients?",
        a: "Yes. Each client is its own organization with its own data walled off. The agency team spans them; clients only ever see their own workspace.",
      },
      {
        q: "Does the platform handle lead capture at the activation?",
        a: "Yes. Every scan at the door can capture opt-in lead data (email, phone, consented fields). Data routes to the brand's CRM.",
      },
      {
        q: "Is there a branded proposal template?",
        a: "Yes. Proposals adopt the client's brand kit — logo, fonts, colors — automatically once the agency team sets it in settings.",
      },
    ],
    related: ["corporate-events", "immersive-experiences", "live-events"],
  },

  "corporate-events": {
    name: "Corporate Events",
    tagline: "Conferences, AGMs, summits, internal events",
    description:
      "Second Star Technologies for Corporate Events — conferences, shareholder meetings, executive summits, internal kickoffs. Client-facing proposals, vendor COI tracking, stakeholder portals, and executive-grade guest experiences.",
    hero: {
      eyebrow: "Corporate Events",
      title: "Executive Grade. Field Ready.",
      body: "Corporate teams want proposals they can review and sign. Executives want KBYG. Vendors need COIs managed. Compliance wants an audit log. We do all four, tuned for corporate cadence.",
    },
    stats: [
      { value: "14 → 2", label: "days to invoice" },
      { value: "100%", label: "vendor COIs tracked" },
      { value: "< 1 day", label: "proposal → project" },
      { value: "SOC 2", label: "controls in production" },
    ],
    outcomes: [
      "Signed proposals convert to a live project on signature",
      "Client portal open 24/7 for proposals, deliverables, invoices, files, and messages",
      "Vendor COI and W-9 tracking with expiry alerts",
      "Per-persona KBYG — executives, VIPs, staff, crew",
      "Card or ACH invoicing with deposit and balance splits",
      "Immutable audit log on every change, for compliance and legal",
    ],
    modules: [
      { name: "Proposals", body: "Twenty-three block types, scroll-spy nav, e-sign in place, share links, version history." },
      { name: "Client Portal", body: "Proposals, deliverables, invoices, shared files, direct messages." },
      { name: "Compliance", body: "Vendor COI tracking, W-9 storage, immutable audit log, SOC 2 controls." },
      { name: "Finance", body: "Card or ACH invoicing, deposit and balance splits, live P&L." },
    ],
    faqs: [
      {
        q: "Does the platform support SOC 2 or ISO compliance?",
        a: "The controls SOC 2 attests to — access control, change management, audit logging, encryption, monitoring — are already in production. SOC 2 Type II is in progress for Enterprise customers. Contact sales for current status.",
      },
      {
        q: "Can we route proposals through legal?",
        a: "Yes. Create a separate internal review link from the client link. Annotate and revise. Send the final version when you're ready. Version history tracks every edit.",
      },
      {
        q: "Does the client portal support SSO?",
        a: "Yes, on Enterprise. SSO via SAML and OIDC. Access can be scoped per proposal or per project.",
      },
    ],
    related: ["brand-activations", "theatrical-performances", "broadcast-tv-film"],
  },

  "theatrical-performances": {
    name: "Theatrical Performances",
    tagline: "Residencies, touring productions, galas",
    description:
      "Theatrical Performances — Broadway runs, off-Broadway limited engagements, regional residencies, gala productions. Cast and crew scheduling, cue notes, understudy tracking, per-house advancing, and compliance-ready audit trails.",
    hero: {
      eyebrow: "Theatrical Performances",
      title: "Eight Shows a Week. Zero Drift.",
      body: "Long-running productions live or die by consistency. Cast changes, understudies, rider tweaks, venue quirks — we keep the canonical production in one place and log every deviation.",
    },
    stats: [
      { value: "8", label: "shows / week" },
      { value: "0", label: "missed cue logs" },
      { value: "1×", label: "rider edit" },
      { value: "100%", label: "understudy coverage" },
    ],
    outcomes: [
      "Per-show rundown with cue notes, blocking revisions, and understudy tracking",
      "Cast pool with availability and conflict detection across shows",
      "Canonical rider with per-venue overrides for touring productions",
      "Equity and union-compliant scheduling with break enforcement",
      "Front-of-house and back-of-house guides per persona",
      "Full audit trail — who changed what, when — for legal and compliance",
    ],
    modules: [
      { name: "Rundown", body: "Per-show cue list, blocking revisions, understudy assignments, version history." },
      { name: "Cast Pool", body: "Availability grid, conflict detection, union-compliant scheduling, day rates." },
      { name: "Advancing", body: "Canonical production scope. Per-venue overrides for touring." },
      { name: "Compliance", body: "Audit log on every change. Union break enforcement. Safety incident reporting." },
    ],
    faqs: [
      {
        q: "Does the platform support Equity-compliant scheduling?",
        a: "Yes. Break rules, 10-out-of-12 limitations, and overtime thresholds are configurable per production. The scheduler refuses assignments that would violate the rules.",
      },
      {
        q: "Can I track understudy coverage?",
        a: "Yes. Each role has a primary and understudy chain. Availability conflicts surface as the schedule is built. Historical coverage is preserved for payroll.",
      },
      {
        q: "How is cue-note revision history handled?",
        a: "Every rundown edit is versioned — who, when, before, after. The stage manager can roll back a bad revision in one click, and the audit log satisfies legal review.",
      },
    ],
    related: ["immersive-experiences", "concerts", "broadcast-tv-film"],
  },

  "broadcast-tv-film": {
    name: "Broadcast, TV & Film",
    tagline: "Studio, remote, location-based production",
    description:
      "Broadcast, TV & Film — multi-camera studio broadcasts, remote productions, location shoots, episodic series. Call sheets, day-of logistics, vendor management, union-compliant time tracking, and per-production financial reporting.",
    hero: {
      eyebrow: "Broadcast, TV & Film",
      title: "Prep to Wrap. One Platform.",
      body: "Film and television production carry more moving pieces than any other live format. We unify call sheets, day-of logistics, vendor COIs, union payroll, and per-production P&L — so the line producer stays on set, not behind a desk.",
    },
    stats: [
      { value: "120+", label: "crew per shoot day" },
      { value: "6 a.m.", label: "call-sheet delivery" },
      { value: "100%", label: "COI tracking" },
      { value: "0", label: "missed meal penalties" },
    ],
    outcomes: [
      "Call sheets auto-drafted and delivered to cast and crew by 6 a.m.",
      "Union-compliant time tracking with meal penalty enforcement",
      "Vendor COI and W-9 tracking with expiry alerts before they lapse",
      "Per-production P&L, petty cash envelopes, and per-department budgets",
      "Location agreements and clearances tracked with rights windows",
      "Offline time cards work when location has zero bars",
    ],
    modules: [
      { name: "Call Sheets", body: "Daily call sheets auto-drafted from schedule and crew pool. Delivered via email and portal." },
      { name: "Time Tracking", body: "Union-compliant clock with meal penalty logic. DGA, IATSE, SAG rules configurable." },
      { name: "Locations", body: "Location library with agreements, rights windows, and contact rolodex." },
      { name: "Procurement", body: "Purchase orders with receiving. Vendor COI and W-9 on every vendor. Petty cash per department." },
    ],
    faqs: [
      {
        q: "Can the platform handle union-specific rules (DGA, IATSE, SAG, AEA)?",
        a: "Yes. Each production configures its union rule set per department. Time cards validate against the rules at submission. Meal penalties and overtime enforce automatically.",
      },
      {
        q: "How does location clearance work?",
        a: "Each location has a clearance record with rights-holder contact, granted window, and linked agreement. The system warns when a shoot date falls outside a cleared window.",
      },
      {
        q: "Can we integrate with our payroll provider (Cast & Crew, Entertainment Partners)?",
        a: "Yes. Time card exports in the standard formats those providers consume. Two-way sync is Enterprise. Export-only is available on every tier.",
      },
    ],
    related: ["theatrical-performances", "corporate-events", "concerts"],
  },
};

type Props = { params: Promise<{ industry: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry } = await params;
  const info = INDUSTRIES[industry];
  if (!info) return buildMetadata({ title: "Solution", description: "Industry solution", path: `/solutions/${industry}` });
  return buildMetadata({
    title: `${info.name} — ${info.tagline} on Second Star Technologies`,
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
    { label: "Home", href: "/" },
    { label: "Solutions", href: "/solutions" },
    { label: info.name, href: `/solutions/${industry}` },
  ];

  return (
    <>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">{info.hero.eyebrow}</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl text-balance">{info.hero.title}</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">{info.hero.body}</p>
        <div className="mt-8 flex gap-3">
          <Button href="/signup">Start Free</Button>
          <Button href="/contact" variant="secondary">Book a Demo</Button>
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
        <h2 className="text-3xl font-semibold tracking-tight">Modules Used</h2>
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
        <h2 className="text-2xl font-semibold tracking-tight">Related Industries</h2>
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
