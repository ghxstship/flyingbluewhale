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
      "flyingbluewhale is the production management platform for Live Events — club residencies, brand-hosted nights, album release parties, pop-up rooftop series. Ticketing and on-site scan, artist advancing, Stripe Connect vendor payouts, and per-persona Know-Before-You-Go guides come pre-wired.",
    hero: {
      eyebrow: "Live Events",
      title: "From Pitch to Wrap — One Platform.",
      body: "Replace the stack most venue teams run — Asana for tasks, DocuSign for contracts, QuickBooks for invoices, spreadsheets for advancing. flyingbluewhale unifies all of it on one Postgres-backed core.",
    },
    stats: [
      { value: "15k+", label: "guests / night" },
      { value: "< 100ms", label: "scan latency" },
      { value: "6", label: "persona portals" },
      { value: "25%", label: "fewer invoice errors" },
    ],
    outcomes: [
      "Scan tickets on any phone — no rental scanner kits",
      "Ship artist advancing via GVTEWAY portal, not PDF chains",
      "Route vendor payouts through Stripe Connect on approval",
      "Publish a per-role KBYG (guest, crew, artist) from one schema",
      "Proposals with e-sign → projects on signature, no manual hand-off",
      "Crew clock in through COMPVSS with geo-verification",
    ],
    modules: [
      { name: "Ticketing", body: "Atomic scan, sub-100ms, offline queue. Tiered tickets, transfers, VIP cabanas." },
      { name: "Artist Advancing", body: "Riders, input lists, stage plots, catering, travel, schedule — all via portal." },
      { name: "Vendor Payouts", body: "Stripe Connect Express onboarding; payout on PO fulfillment." },
      { name: "KBYG Guides", body: "Role-scoped event guide published to portal + mobile. 16 section types." },
      { name: "Finance", body: "Per-event P&L, deposit / balance payment splits, per-vendor invoicing." },
      { name: "Compliance", body: "Vendor COI tracking with expiry alerts, W-9 storage, audit log." },
    ],
    faqs: [
      {
        q: "How many guests can flyingbluewhale handle?",
        a: "We've scanned 15,000+ guests per event without a blip. The atomic-update check-in pattern handles any throughput Postgres can handle, so the bottleneck is your network, not us.",
      },
      {
        q: "Can I use my existing ticketing vendor?",
        a: "Yes — we import ticket batches via CSV or the /api/v1/tickets endpoint. Most teams switch to native ticketing once they see the offline scanner + analytics.",
      },
      {
        q: "Can I white-label for a venue's or promoter's brand?",
        a: "Custom domains + branding (logo, colors, email templates) are Enterprise features. Most clubs and promoters white-label their guest-facing portal.",
      },
    ],
    related: ["concerts", "festivals-tours", "brand-activations"],
  },

  concerts: {
    name: "Concerts",
    tagline: "Single-night shows, amphitheatres, arenas",
    description:
      "Purpose-built for Concerts — single-night shows to stadium-scale runs. Canonical rider, per-venue overrides, shared crew pool, venue advancing, real-time box office metrics, and a mobile PWA the house staff actually wants to use.",
    hero: {
      eyebrow: "Concerts",
      title: "One Rider. Every Venue.",
      body: "Concert touring operations live in 40 spreadsheets. flyingbluewhale keeps the canonical rider in one place and scopes per-venue variants on top — no copy-paste, no lost revisions.",
    },
    stats: [
      { value: "1×", label: "rider edit" },
      { value: "40+", label: "venues / tour" },
      { value: "< 2m", label: "per-diem approval → payout" },
      { value: "99.9%", label: "scan uptime" },
    ],
    outcomes: [
      "Canonical rider with per-venue overrides — edits cascade correctly",
      "Shared crew pool with per-show scheduling + day-rate cents",
      "Per-diem + emergency advances with Stripe payout on approval",
      "Box-office metrics + seat-map deltas in real time",
      "Credentials (DOT, insurance, certs) tracked with expiry alerts",
      "Daily settlement + wrap-up in under 48 hours post-show",
    ],
    modules: [
      { name: "Advancing", body: "Canonical + per-show overrides. Deliverables tracked across the run." },
      { name: "Crew Pool", body: "Shared roster, per-show scheduling, day-rate cents, credential expiry alerts." },
      { name: "Advances", body: "Per-diem + emergency requests with status machine + Stripe payout." },
      { name: "Box Office", body: "Real-time capacity dashboards, seat-map deltas, VIP flags." },
    ],
    faqs: [
      {
        q: "Can the canonical rider handle multi-artist bills?",
        a: "Yes. Each artist has its own project under the parent tour; advancing, schedule, travel, and rider are scoped per-artist; shared venue info lives on the parent.",
      },
      {
        q: "Do advances route through Stripe Connect?",
        a: "Yes. Cash advances route through Stripe Connect Express to the crew member's linked bank. Approval → payout is usually under two minutes.",
      },
      {
        q: "Can I pull manifest data from my ticketing vendor?",
        a: "Yes. We accept CSV bulk imports, a streaming webhook from the major ticketing APIs, and manual upload. The mobile scanner works offline and syncs when it reconnects.",
      },
    ],
    related: ["festivals-tours", "live-events", "theatrical-performances"],
  },

  "festivals-tours": {
    name: "Festivals & Tours",
    tagline: "Multi-day, multi-stage, multi-city",
    description:
      "Festivals and Tours are the hardest shape in live production — dozens of artists, multiple stages, multi-day windows, traveling crew, and a calendar that looks like a subway map. flyingbluewhale is built for that scale from day one.",
    hero: {
      eyebrow: "Festivals & Tours",
      title: "Run the Festival. Not the Spreadsheet.",
      body: "Multi-day festivals and city-to-city tours fall over when any one of 50 moving pieces breaks. Unify artist advancing, vendor payouts, crew scheduling, credentials, and KBYG guides under one platform that doesn't.",
    },
    stats: [
      { value: "200+", label: "artists / festival" },
      { value: "6", label: "stages managed" },
      { value: "40+", label: "cities / tour" },
      { value: "15k+", label: "scans / day" },
    ],
    outcomes: [
      "Per-artist advancing with set-time grid + stage assignments",
      "Per-city project cloning — edit only what's different",
      "Credential manifest with RFID / NFC wristband integration",
      "Vendor payouts via Stripe Connect on approval",
      "Real-time stage-side decision board visible to promoter + site ops",
      "Post-festival wrap including per-artist settlement in days, not weeks",
    ],
    modules: [
      { name: "Advancing Grid", body: "Per-artist rider + per-stage set-time grid with conflict detection." },
      { name: "Credentials", body: "Wristband + badge manifest with access tiers, counts, and RFID linkage." },
      { name: "Procurement", body: "Requisitions → POs → receiving; vendor COI + W-9 tracked with expiry." },
      { name: "COMPVSS Mobile", body: "Offline ticket scan, crew clock, incident reports from any stage." },
      { name: "Per-City Clone", body: "One click clones the project graph; overrides only where cities differ." },
    ],
    faqs: [
      {
        q: "Does flyingbluewhale handle RFID wristbands?",
        a: "Yes — we integrate with the major RFID vendors (Intellitix, ID&C, Plus ID) via our credential endpoints. Wristbands can be pre-assigned or bound at pickup; access tiers enforce at scan.",
      },
      {
        q: "Can I run a multi-day festival and a city tour on the same account?",
        a: "Yes. Each production is its own project; flyingbluewhale is multi-project from day one. The same team works across them without logging out.",
      },
      {
        q: "What happens when venue Wi-Fi dies?",
        a: "COMPVSS has an offline service-worker shell. Scans queue locally and reconcile atomically when the phone reconnects. No dropped entries.",
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
      body: "Immersive runs live or die by seconds. flyingbluewhale handles the operations plumbing — timed entries, per-zone capacity, cast + crew scheduling — so your team stays in the experience, not the spreadsheet.",
    },
    stats: [
      { value: "< 15s", label: "entry gap drift" },
      { value: "18", label: "zones staffed" },
      { value: "6", label: "capacity tiers" },
      { value: "0", label: "missed cues from ops" },
    ],
    outcomes: [
      "Timed-entry scheduling with auto-enforced capacity ceilings",
      "Per-zone staffing grid with role + shift + break tracking",
      "Cast + crew scheduling separated from front-of-house",
      "Per-ticket QR scan with atomic capacity decrement",
      "Incident reports with chain-of-custody to compliance",
      "Per-actor KBYG guides including safety protocols + character bible",
    ],
    modules: [
      { name: "Timed Entry", body: "15-minute windows with atomic capacity; waitlist with automated promotion." },
      { name: "Zones & Roles", body: "Zone map, role coverage, break scheduling, escalation routing." },
      { name: "Incidents", body: "COMPVSS one-tap incident log, routed to safety lead with chain-of-custody." },
      { name: "Cast Portal", body: "Character bible, blocking notes, safety protocols, per-show callsheet." },
    ],
    faqs: [
      {
        q: "Can we enforce hard capacity per zone?",
        a: "Yes. Each zone has a maximum headcount; the scanner refuses entries that would exceed it, routes the guest to waitlist, and promotes when someone exits.",
      },
      {
        q: "Can we publish a separate guide for cast vs. front-of-house?",
        a: "Yes. KBYG guides are per-persona. Cast sees blocking + cue notes + safety drills; front-of-house sees guest flow + FAQ + emergency procedures.",
      },
      {
        q: "How are incidents handled?",
        a: "COMPVSS has a one-tap incident button that captures GPS + photo + reporter. The report routes to the safety lead by role, and audit_log preserves chain-of-custody for insurance.",
      },
    ],
    related: ["theatrical-performances", "brand-activations", "live-events"],
  },

  "brand-activations": {
    name: "Brand Activations",
    tagline: "Pop-ups, product launches, experiential marketing",
    description:
      "Brand Activations turn marketing dollars into memorable moments. flyingbluewhale handles the operations — agency-to-client proposals, vendor COIs, RSVP flow, on-site capture, post-event analytics — so the creative team stays creative.",
    hero: {
      eyebrow: "Brand Activations",
      title: "From RFP to Recap. Same Platform.",
      body: "Activations live or die by the speed of the hand-off: agency to client, creative to production, production to vendors. flyingbluewhale shortens every hand-off to zero.",
    },
    stats: [
      { value: "< 1 day", label: "proposal → signed project" },
      { value: "100%", label: "vendor COIs tracked" },
      { value: "40%", label: "faster reconciliation" },
      { value: "24/7", label: "client portal access" },
    ],
    outcomes: [
      "Interactive proposals with e-sign converting to live projects on signature",
      "Client portal 24/7 for proposals, deliverables, invoices, files, messages",
      "Vendor COI + W-9 tracking with expiry alerts",
      "RSVP + check-in flow with lead capture at ingress",
      "Stripe Checkout for invoices + deposit / balance splits",
      "Post-event recap deck auto-drafted from the activation data",
    ],
    modules: [
      { name: "Proposals", body: "23 block types, scroll-spy nav, two-mode e-sign, share links, version history." },
      { name: "Client Portal", body: "Proposals, deliverables, invoices, shared files, direct messages." },
      { name: "RSVP + Capture", body: "Email RSVP with ticketing; on-site scan captures lead data to the CRM." },
      { name: "Finance", body: "Stripe Checkout, deposit + balance splits, live P&L per activation." },
    ],
    faqs: [
      {
        q: "Can agencies share one workspace with multiple clients?",
        a: "Yes. Each client is an organization with its own RLS boundary; the agency team spans them. Clients only see their own workspace.",
      },
      {
        q: "Does the platform handle lead capture at the activation?",
        a: "Yes. Every scan at the door can capture opt-in lead data (email, phone, consented fields). Data routes to the brand's CRM via webhook.",
      },
      {
        q: "Is there a branded proposal template?",
        a: "Yes. Proposals adopt the client's brand kit (logo, fonts, colors) automatically when the agency team sets it in /console/settings/branding.",
      },
    ],
    related: ["corporate-events", "immersive-experiences", "live-events"],
  },

  "corporate-events": {
    name: "Corporate Events",
    tagline: "Conferences, AGMs, summits, internal events",
    description:
      "flyingbluewhale for Corporate Events — conferences, shareholder meetings, executive summits, internal kickoffs. Client-facing proposals with e-sign, vendor COI tracking, stakeholder portals, and executive-grade guest experiences.",
    hero: {
      eyebrow: "Corporate Events",
      title: "Executive Grade. Field Ready.",
      body: "Corporate teams want proposals they can review and sign. Executives want KBYG guides. Vendors need COIs managed. Compliance wants an audit log. flyingbluewhale does all four, tuned for corporate cadence.",
    },
    stats: [
      { value: "14 → 2", label: "days to invoice" },
      { value: "100%", label: "vendor COIs tracked" },
      { value: "< 1 day", label: "proposal → project" },
      { value: "SOC-2", label: "ready primitives" },
    ],
    outcomes: [
      "Interactive proposals with e-sign converting to a live project on signature",
      "Client portal 24 / 7 for proposals, deliverables, invoices, files, messages",
      "Vendor COI + W-9 tracking with expiry alerts",
      "Per-persona KBYG: executives, VIPs, staff, crew",
      "Stripe Checkout for invoice payment + deposit / balance splits",
      "Audit log on every mutation for compliance + legal",
    ],
    modules: [
      { name: "Proposals", body: "23 block types, scroll-spy nav, two-mode e-sign, share links, version history." },
      { name: "Client Portal", body: "Proposals, deliverables, invoices, shared files, direct messages." },
      { name: "Compliance", body: "Vendor COI tracking, W-9 storage, audit log, SOC-2 primitives." },
      { name: "Finance", body: "Stripe Checkout for invoices, deposit / balance splits, live P&L." },
    ],
    faqs: [
      {
        q: "Does flyingbluewhale support SOC-2 or ISO compliance?",
        a: "We ship enterprise-grade primitives today — RLS, audit log, encryption in transit and at rest, signed URLs, rate limiting, CSP. Formal SOC-2 report is in progress for Enterprise-tier customers; contact sales for current status.",
      },
      {
        q: "Can we route proposals through legal?",
        a: "Yes. Create an internal 'Legal review' share link (distinct from the client link), annotate and revise, then send the client the final version. Version history tracks every edit.",
      },
      {
        q: "Does the client portal support SSO?",
        a: "SSO via SAML and OIDC is available on Enterprise. Access can be scoped per-proposal or per-project.",
      },
    ],
    related: ["brand-activations", "theatrical-performances", "broadcast-tv-film"],
  },

  "theatrical-performances": {
    name: "Theatrical Performances",
    tagline: "Residencies, touring productions, galas",
    description:
      "Theatrical Performances — Broadway runs, off-Broadway limited engagements, regional residencies, gala productions. flyingbluewhale handles cast + crew scheduling, cue notes, understudy tracking, per-house advancing, and compliance-ready audit trails.",
    hero: {
      eyebrow: "Theatrical Performances",
      title: "Eight Shows a Week. Zero Drift.",
      body: "Long-running productions live or die by consistency. Cast changes, understudies, rider tweaks, venue quirks — flyingbluewhale keeps the canonical production in one place and logs every deviation.",
    },
    stats: [
      { value: "8", label: "shows / week" },
      { value: "0", label: "missed cue logs" },
      { value: "1×", label: "rider edit" },
      { value: "100%", label: "understudy coverage" },
    ],
    outcomes: [
      "Per-show rundown with cue notes, blocking revisions, and understudy tracking",
      "Cast pool with availability + conflict detection across shows",
      "Canonical rider with per-venue overrides for touring productions",
      "Equity / union-compliant scheduling with break enforcement",
      "Front-of-house + back-of-house guides per persona",
      "Full audit trail — who changed what, when — for legal + compliance",
    ],
    modules: [
      { name: "Rundown", body: "Per-show cue list, blocking revisions, understudy assignments, version history." },
      { name: "Cast Pool", body: "Availability grid, conflict detection, union-compliant scheduling, day-rate." },
      { name: "Advancing", body: "Canonical production scope; per-venue overrides for touring." },
      { name: "Compliance", body: "Audit log on every change; union break enforcement; safety incident reporting." },
    ],
    faqs: [
      {
        q: "Does the platform support Equity-compliant scheduling?",
        a: "Yes. Break rules, 10-out-of-12 limitations, and overtime thresholds are configurable per production. The scheduler refuses assignments that would violate the rules.",
      },
      {
        q: "Can I track understudy coverage?",
        a: "Yes. Each role has a primary + understudy chain; availability conflicts surface as the schedule is built. Historical coverage is preserved for payroll.",
      },
      {
        q: "How is cue-note revision history handled?",
        a: "Every rundown edit is versioned with who / when / before / after. The stage manager can roll back a bad revision in one click, and the audit log satisfies legal review.",
      },
    ],
    related: ["immersive-experiences", "concerts", "broadcast-tv-film"],
  },

  "broadcast-tv-film": {
    name: "Broadcast, TV & Film",
    tagline: "Studio, remote, location-based production",
    description:
      "Broadcast, TV & Film — multi-camera studio broadcasts, remote productions, location-based shoots, episodic series. flyingbluewhale handles call-sheets, day-of-shoot logistics, vendor management, union-compliant time tracking, and per-production financial reporting.",
    hero: {
      eyebrow: "Broadcast, TV & Film",
      title: "Prep to Wrap, on One Platform.",
      body: "Film and television production carry more moving pieces than any other live-ops format. flyingbluewhale unifies call-sheets, day-of logistics, vendor COIs, union payroll, and per-production P&L so the line producer stays on set, not behind a desk.",
    },
    stats: [
      { value: "120+", label: "crew per shoot day" },
      { value: "6 a.m.", label: "call-sheet delivery" },
      { value: "100%", label: "COI tracking" },
      { value: "0", label: "missed meal penalties" },
    ],
    outcomes: [
      "Auto-generated call-sheets delivered to cast + crew by 6 a.m.",
      "Union-compliant time tracking with meal penalty enforcement",
      "Vendor COI + W-9 tracking with expiry alerts before they lapse",
      "Per-production P&L, petty-cash envelopes, and per-department budgets",
      "Location agreements + clearances tracked with rights windows",
      "COMPVSS offline time-card works when location has zero bars",
    ],
    modules: [
      { name: "Call Sheets", body: "Daily call-sheet auto-drafted from schedule + crew pool; delivered via email + portal." },
      { name: "Time Tracking", body: "Union-compliant clock with meal penalty logic; DGA / IATSE / SAG rules configurable." },
      { name: "Locations", body: "Location library with agreements, rights windows, contact rolodex." },
      { name: "Procurement", body: "Purchase orders with receiving; vendor COI + W-9 on every vendor; petty-cash envelopes per department." },
    ],
    faqs: [
      {
        q: "Can the platform handle union-specific rules (DGA, IATSE, SAG, AEA)?",
        a: "Yes. Each production configures its union rule set per department; time-card entries validate against the rules at submission. Meal penalties + overtime thresholds enforce automatically.",
      },
      {
        q: "How does location clearance work?",
        a: "Each location has a clearance record with rights-holder contact, granted window, and linked agreement. The system warns when a shoot date falls outside a cleared window.",
      },
      {
        q: "Can we integrate with our payroll provider (Cast & Crew, Entertainment Partners)?",
        a: "Yes — time-card exports in the standard formats those providers consume. Two-way sync is Enterprise; export-only is on every tier including Access.",
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
