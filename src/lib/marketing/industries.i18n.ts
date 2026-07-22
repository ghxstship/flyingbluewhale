/**
 * GENERATED FILE — do not hand-edit. Regenerate with:
 *   node --experimental-strip-types scripts/gen-marketing-i18n.mjs
 *
 * Render-site i18n overlay for src/lib/marketing/industries.ts (I18N-WRAP, decision 7 rider).
 * The data file stays the SSOT for structure + English copy; this module
 * wraps every user-visible prose field in the 3-arg t(key, undefined,
 * fallback) form with PLAIN-STRING key and fallback literals so
 * scripts/extract-i18n-keys.mjs can land the keys in the locale catalogs.
 * Template-literal keys are invisible to the extractor, which is why every
 * slug is enumerated here instead of composed at the render site.
 *
 * Drift guard: i18n-content.test.ts asserts the identity-translator output
 * deep-equals the source entries, so data-file copy edits without a re-run
 * of the generator fail CI instead of silently shipping stale fallbacks.
 */

import { INDUSTRIES, type IndustryConfig } from "./industries";

export type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

const LOCALIZERS: Record<string, (e: IndustryConfig, t: Translator) => IndustryConfig> = {
  "live-events": (e, t) => ({
    ...e,
    name: t("marketing.industriesContent.live-events.name", undefined, "Live Events"),
    tagline: t(
      "marketing.industriesContent.live-events.tagline",
      undefined,
      "Venue residencies, club nights, one-offs",
    ),
    description: t(
      "marketing.industriesContent.live-events.description",
      undefined,
      "ATLVS Technologies is the production platform for Live Events: club residencies, brand-hosted nights, album release parties, rooftop pop-ups. Ticketing with on-site scan, artist advancing, direct vendor payouts, and per-role Know Before You Go guides, all connected on day one.",
    ),
    hero: {
      eyebrow: t("marketing.industriesContent.live-events.hero.eyebrow", undefined, "Live Events"),
      title: t("marketing.industriesContent.live-events.hero.title", undefined, "From Pitch to Wrap. One Platform."),
      body: t(
        "marketing.industriesContent.live-events.hero.body",
        undefined,
        "Replace the stack most venue teams run: task apps, e-sign tools, accounting software, spreadsheets for advancing. ATLVS Technologies runs all of it in one place.",
      ),
    },
    stats: [
      { value: "15k+", label: t("marketing.industriesContent.live-events.stats.0.label", undefined, "guests / night") },
      {
        value: "< 100ms",
        label: t("marketing.industriesContent.live-events.stats.1.label", undefined, "scan latency"),
      },
      { value: "6", label: t("marketing.industriesContent.live-events.stats.2.label", undefined, "persona portals") },
      {
        value: "25%",
        label: t("marketing.industriesContent.live-events.stats.3.label", undefined, "fewer invoice errors"),
      },
    ],
    outcomes: [
      t(
        "marketing.industriesContent.live-events.outcomes.0",
        undefined,
        "Scan tickets on any phone, no rental scanner kits",
      ),
      t(
        "marketing.industriesContent.live-events.outcomes.1",
        undefined,
        "Ship artist advancing through the portal, not PDF chains",
      ),
      t("marketing.industriesContent.live-events.outcomes.2", undefined, "Route vendor payouts directly on approval"),
      t(
        "marketing.industriesContent.live-events.outcomes.3",
        undefined,
        "Publish one KBYG and guest, crew, and artist each see their version",
      ),
      t(
        "marketing.industriesContent.live-events.outcomes.4",
        undefined,
        "Signed proposals turn into live projects on signature",
      ),
      t(
        "marketing.industriesContent.live-events.outcomes.5",
        undefined,
        "Crew clock in through COMPVSS with geo-verification",
      ),
    ],
    modules: [
      {
        name: t("marketing.industriesContent.live-events.modules.0.name", undefined, "Ticketing"),
        body: t(
          "marketing.industriesContent.live-events.modules.0.body",
          undefined,
          "Sub-100ms scan. Zero duplicates. Offline queue. Tiered tickets, transfers, VIP cabanas.",
        ),
      },
      {
        name: t("marketing.industriesContent.live-events.modules.1.name", undefined, "Artist Advancing"),
        body: t(
          "marketing.industriesContent.live-events.modules.1.body",
          undefined,
          "Riders, input lists, stage plots, catering, travel, schedule: all through the portal.",
        ),
      },
      {
        name: t("marketing.industriesContent.live-events.modules.2.name", undefined, "Vendor Payouts"),
        body: t(
          "marketing.industriesContent.live-events.modules.2.body",
          undefined,
          "Vendors onboard a payout account. Direct payout on PO fulfillment by ACH, card, or wire.",
        ),
      },
      {
        name: t("marketing.industriesContent.live-events.modules.3.name", undefined, "KBYG Guides"),
        body: t(
          "marketing.industriesContent.live-events.modules.3.body",
          undefined,
          "One source, role-scoped views. Sixteen section types rendered to portal and mobile.",
        ),
      },
      {
        name: t("marketing.industriesContent.live-events.modules.4.name", undefined, "Finance"),
        body: t(
          "marketing.industriesContent.live-events.modules.4.body",
          undefined,
          "Per-event P&L, deposit and balance splits, per-vendor invoicing.",
        ),
      },
      {
        name: t("marketing.industriesContent.live-events.modules.5.name", undefined, "Compliance"),
        body: t(
          "marketing.industriesContent.live-events.modules.5.body",
          undefined,
          "Vendor COI tracking with expiry alerts, W-9 storage, immutable audit log.",
        ),
      },
    ],
    faqs: [
      {
        q: t("marketing.industriesContent.live-events.faqs.0.q", undefined, "How many guests can the platform handle?"),
        a: t(
          "marketing.industriesContent.live-events.faqs.0.a",
          undefined,
          "We've scanned 15,000+ guests per event without a blip. Every ticket scans exactly once under concurrent load. The bottleneck is your network, not us.",
        ),
      },
      {
        q: t("marketing.industriesContent.live-events.faqs.1.q", undefined, "Can I use my existing ticketing vendor?"),
        a: t(
          "marketing.industriesContent.live-events.faqs.1.a",
          undefined,
          "Yes. Import ticket batches via CSV or webhook. Most teams switch to native ticketing once they see the offline scanner and analytics.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.live-events.faqs.2.q",
          undefined,
          "Can I white-label for a venue's or promoter's brand?",
        ),
        a: t(
          "marketing.industriesContent.live-events.faqs.2.a",
          undefined,
          "Yes, on Enterprise. Custom branding and custom domains. Most clubs and promoters white-label their guest-facing portal.",
        ),
      },
    ],
  }),
  concerts: (e, t) => ({
    ...e,
    name: t("marketing.industriesContent.concerts.name", undefined, "Concerts"),
    tagline: t("marketing.industriesContent.concerts.tagline", undefined, "Single-night shows, amphitheatres, arenas"),
    description: t(
      "marketing.industriesContent.concerts.description",
      undefined,
      "Purpose-built for Concerts, from single-night shows to stadium-scale runs. Canonical rider, per-venue overrides, shared crew pool, venue advancing, real-time box office metrics, and a field app the house staff actually wants to use.",
    ),
    hero: {
      eyebrow: t("marketing.industriesContent.concerts.hero.eyebrow", undefined, "Concerts"),
      title: t("marketing.industriesContent.concerts.hero.title", undefined, "One Rider. Every Venue."),
      body: t(
        "marketing.industriesContent.concerts.hero.body",
        undefined,
        "Concert touring operations live in forty spreadsheets. We keep the canonical rider in one place and scope per-venue variants on top. No copy-paste, no lost revisions.",
      ),
    },
    stats: [
      { value: "1×", label: t("marketing.industriesContent.concerts.stats.0.label", undefined, "rider edit") },
      { value: "40+", label: t("marketing.industriesContent.concerts.stats.1.label", undefined, "venues / tour") },
      {
        value: "< 2m",
        label: t("marketing.industriesContent.concerts.stats.2.label", undefined, "per-diem approval → payout"),
      },
      { value: "99.9%", label: t("marketing.industriesContent.concerts.stats.3.label", undefined, "scan uptime") },
    ],
    outcomes: [
      t(
        "marketing.industriesContent.concerts.outcomes.0",
        undefined,
        "Canonical rider with per-venue overrides, and edits cascade correctly",
      ),
      t(
        "marketing.industriesContent.concerts.outcomes.1",
        undefined,
        "Shared crew pool with per-show scheduling and day rates",
      ),
      t(
        "marketing.industriesContent.concerts.outcomes.2",
        undefined,
        "Per-diem and emergency advances payout on approval",
      ),
      t(
        "marketing.industriesContent.concerts.outcomes.3",
        undefined,
        "Box-office metrics and seat-map deltas in real time",
      ),
      t(
        "marketing.industriesContent.concerts.outcomes.4",
        undefined,
        "Credentials (DOT, insurance, certs) tracked with expiry alerts",
      ),
      t("marketing.industriesContent.concerts.outcomes.5", undefined, "Daily settlement in under 48 hours post-show"),
    ],
    modules: [
      {
        name: t("marketing.industriesContent.concerts.modules.0.name", undefined, "Advancing"),
        body: t(
          "marketing.industriesContent.concerts.modules.0.body",
          undefined,
          "Canonical plus per-show overrides. Deliverables tracked across the run.",
        ),
      },
      {
        name: t("marketing.industriesContent.concerts.modules.1.name", undefined, "Crew Pool"),
        body: t(
          "marketing.industriesContent.concerts.modules.1.body",
          undefined,
          "Shared roster, per-show scheduling, day rates, credential expiry alerts.",
        ),
      },
      {
        name: t("marketing.industriesContent.concerts.modules.2.name", undefined, "Advances"),
        body: t(
          "marketing.industriesContent.concerts.modules.2.body",
          undefined,
          "Per-diem and emergency requests with clean status flow and direct payout.",
        ),
      },
      {
        name: t("marketing.industriesContent.concerts.modules.3.name", undefined, "Box Office"),
        body: t(
          "marketing.industriesContent.concerts.modules.3.body",
          undefined,
          "Real-time capacity dashboards, seat-map deltas, VIP flags.",
        ),
      },
    ],
    faqs: [
      {
        q: t(
          "marketing.industriesContent.concerts.faqs.0.q",
          undefined,
          "Can the canonical rider handle multi-artist bills?",
        ),
        a: t(
          "marketing.industriesContent.concerts.faqs.0.a",
          undefined,
          "Yes. Each artist has its own project under the parent tour. Advancing, schedule, travel, and rider stay scoped per artist; shared venue info lives on the parent.",
        ),
      },
      {
        q: t("marketing.industriesContent.concerts.faqs.1.q", undefined, "Do advances pay out directly?"),
        a: t(
          "marketing.industriesContent.concerts.faqs.1.a",
          undefined,
          "Yes. Cash advances route directly to the crew member's linked account. Approval to payout is usually under two minutes.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.concerts.faqs.2.q",
          undefined,
          "Can I pull manifest data from my ticketing vendor?",
        ),
        a: t(
          "marketing.industriesContent.concerts.faqs.2.a",
          undefined,
          "Yes. CSV bulk imports, webhook from the major ticketing systems, or manual upload. The mobile scanner works offline and syncs when it reconnects.",
        ),
      },
    ],
  }),
  "festivals-tours": (e, t) => ({
    ...e,
    name: t("marketing.industriesContent.festivals-tours.name", undefined, "Festivals & Tours"),
    tagline: t("marketing.industriesContent.festivals-tours.tagline", undefined, "Multi-day, multi-stage, multi-city"),
    description: t(
      "marketing.industriesContent.festivals-tours.description",
      undefined,
      "Festivals and Tours are the hardest shape in live production: dozens of artists, multiple stages, multi-day windows, traveling crew, and a calendar that looks like a subway map. Built for that scale from day one.",
    ),
    hero: {
      eyebrow: t("marketing.industriesContent.festivals-tours.hero.eyebrow", undefined, "Festivals & Tours"),
      title: t(
        "marketing.industriesContent.festivals-tours.hero.title",
        undefined,
        "Run the Festival. Not the Spreadsheet.",
      ),
      body: t(
        "marketing.industriesContent.festivals-tours.hero.body",
        undefined,
        "Multi-day festivals and city-to-city tours fall over when any one of fifty moving pieces breaks. Put artist advancing, vendor payouts, crew scheduling, credentials, and KBYG on one platform that doesn't.",
      ),
    },
    stats: [
      {
        value: "200+",
        label: t("marketing.industriesContent.festivals-tours.stats.0.label", undefined, "artists / festival"),
      },
      {
        value: "6",
        label: t("marketing.industriesContent.festivals-tours.stats.1.label", undefined, "stages managed"),
      },
      {
        value: "40+",
        label: t("marketing.industriesContent.festivals-tours.stats.2.label", undefined, "cities / tour"),
      },
      {
        value: "15k+",
        label: t("marketing.industriesContent.festivals-tours.stats.3.label", undefined, "scans / day"),
      },
    ],
    outcomes: [
      t(
        "marketing.industriesContent.festivals-tours.outcomes.0",
        undefined,
        "Per-artist advancing with a set-time grid and stage assignments",
      ),
      t(
        "marketing.industriesContent.festivals-tours.outcomes.1",
        undefined,
        "Per-city project cloning where you edit only what's different",
      ),
      t(
        "marketing.industriesContent.festivals-tours.outcomes.2",
        undefined,
        "Credential manifest with RFID and NFC wristband integration",
      ),
      t("marketing.industriesContent.festivals-tours.outcomes.3", undefined, "Direct vendor payouts on approval"),
      t(
        "marketing.industriesContent.festivals-tours.outcomes.4",
        undefined,
        "Real-time stage-side decision board visible to promoter and site ops",
      ),
      t(
        "marketing.industriesContent.festivals-tours.outcomes.5",
        undefined,
        "Per-artist settlement in days, not weeks",
      ),
    ],
    modules: [
      {
        name: t("marketing.industriesContent.festivals-tours.modules.0.name", undefined, "Advancing Grid"),
        body: t(
          "marketing.industriesContent.festivals-tours.modules.0.body",
          undefined,
          "Per-artist rider and per-stage set-time grid with conflict detection.",
        ),
      },
      {
        name: t("marketing.industriesContent.festivals-tours.modules.1.name", undefined, "Credentials"),
        body: t(
          "marketing.industriesContent.festivals-tours.modules.1.body",
          undefined,
          "Wristband and badge manifest with access tiers, counts, and RFID linkage.",
        ),
      },
      {
        name: t("marketing.industriesContent.festivals-tours.modules.2.name", undefined, "Procurement"),
        body: t(
          "marketing.industriesContent.festivals-tours.modules.2.body",
          undefined,
          "Requisition to PO to receiving. Vendor COI and W-9 tracked with expiry.",
        ),
      },
      {
        name: t("marketing.industriesContent.festivals-tours.modules.3.name", undefined, "COMPVSS Field App"),
        body: t(
          "marketing.industriesContent.festivals-tours.modules.3.body",
          undefined,
          "Offline ticket scan, crew clock-in, incident reports from any stage.",
        ),
      },
      {
        name: t("marketing.industriesContent.festivals-tours.modules.4.name", undefined, "Per-City Clone"),
        body: t(
          "marketing.industriesContent.festivals-tours.modules.4.body",
          undefined,
          "One click clones the project. Override only what differs.",
        ),
      },
    ],
    faqs: [
      {
        q: t(
          "marketing.industriesContent.festivals-tours.faqs.0.q",
          undefined,
          "Does the platform handle RFID wristbands?",
        ),
        a: t(
          "marketing.industriesContent.festivals-tours.faqs.0.a",
          undefined,
          "Yes. We integrate with the major RFID vendors (Intellitix, ID&C, Plus ID). Wristbands can be pre-assigned or bound at pickup; access tiers enforce at scan.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.festivals-tours.faqs.1.q",
          undefined,
          "Can I run a multi-day festival and a city tour on the same account?",
        ),
        a: t(
          "marketing.industriesContent.festivals-tours.faqs.1.a",
          undefined,
          "Yes. Each production is its own project, and the platform is multi-project from day one. The same team works across them without logging out.",
        ),
      },
      {
        q: t("marketing.industriesContent.festivals-tours.faqs.2.q", undefined, "What happens when venue Wi-Fi dies?"),
        a: t(
          "marketing.industriesContent.festivals-tours.faqs.2.a",
          undefined,
          "The field app is offline-first. Scans queue on the device and reconcile cleanly when the phone reconnects. No dropped entries.",
        ),
      },
    ],
  }),
  "immersive-experiences": (e, t) => ({
    ...e,
    name: t("marketing.industriesContent.immersive-experiences.name", undefined, "Immersive Experiences"),
    tagline: t(
      "marketing.industriesContent.immersive-experiences.tagline",
      undefined,
      "Installations, walk-throughs, pop-ups",
    ),
    description: t(
      "marketing.industriesContent.immersive-experiences.description",
      undefined,
      "Immersive Experiences demand operations software that respects narrative pacing: timed-entry scheduling, per-zone staffing, capacity ceilings, role-specific guides, and an advancing system that treats every act as its own discipline.",
    ),
    hero: {
      eyebrow: t("marketing.industriesContent.immersive-experiences.hero.eyebrow", undefined, "Immersive Experiences"),
      title: t(
        "marketing.industriesContent.immersive-experiences.hero.title",
        undefined,
        "The Show Runs You. We Run the Show.",
      ),
      body: t(
        "marketing.industriesContent.immersive-experiences.hero.body",
        undefined,
        "Immersive runs live or die by seconds. We handle the operations (timed entries, per-zone capacity, cast and crew scheduling) so your team stays in the experience, not the spreadsheet.",
      ),
    },
    stats: [
      {
        value: "< 15s",
        label: t("marketing.industriesContent.immersive-experiences.stats.0.label", undefined, "entry gap drift"),
      },
      {
        value: "18",
        label: t("marketing.industriesContent.immersive-experiences.stats.1.label", undefined, "zones staffed"),
      },
      {
        value: "6",
        label: t("marketing.industriesContent.immersive-experiences.stats.2.label", undefined, "capacity tiers"),
      },
      {
        value: "0",
        label: t("marketing.industriesContent.immersive-experiences.stats.3.label", undefined, "missed cues from ops"),
      },
    ],
    outcomes: [
      t(
        "marketing.industriesContent.immersive-experiences.outcomes.0",
        undefined,
        "Timed-entry scheduling with enforced capacity ceilings",
      ),
      t(
        "marketing.industriesContent.immersive-experiences.outcomes.1",
        undefined,
        "Per-zone staffing grid with role, shift, and break tracking",
      ),
      t(
        "marketing.industriesContent.immersive-experiences.outcomes.2",
        undefined,
        "Cast and crew scheduling separated from front-of-house",
      ),
      t(
        "marketing.industriesContent.immersive-experiences.outcomes.3",
        undefined,
        "Per-ticket scan with immediate capacity decrement",
      ),
      t(
        "marketing.industriesContent.immersive-experiences.outcomes.4",
        undefined,
        "Incident reports with chain-of-custody for compliance",
      ),
      t(
        "marketing.industriesContent.immersive-experiences.outcomes.5",
        undefined,
        "Per-actor KBYG with safety protocols and character bible",
      ),
    ],
    modules: [
      {
        name: t("marketing.industriesContent.immersive-experiences.modules.0.name", undefined, "Timed Entry"),
        body: t(
          "marketing.industriesContent.immersive-experiences.modules.0.body",
          undefined,
          "Fifteen-minute windows with hard capacity. Waitlist with automated promotion.",
        ),
      },
      {
        name: t("marketing.industriesContent.immersive-experiences.modules.1.name", undefined, "Zones & Roles"),
        body: t(
          "marketing.industriesContent.immersive-experiences.modules.1.body",
          undefined,
          "Zone map, role coverage, break scheduling, escalation routing.",
        ),
      },
      {
        name: t("marketing.industriesContent.immersive-experiences.modules.2.name", undefined, "Incidents"),
        body: t(
          "marketing.industriesContent.immersive-experiences.modules.2.body",
          undefined,
          "One-tap incident log from the field, routed to the safety lead with chain-of-custody.",
        ),
      },
      {
        name: t("marketing.industriesContent.immersive-experiences.modules.3.name", undefined, "Cast Portal"),
        body: t(
          "marketing.industriesContent.immersive-experiences.modules.3.body",
          undefined,
          "Character bible, blocking notes, safety protocols, per-show call sheet.",
        ),
      },
    ],
    faqs: [
      {
        q: t(
          "marketing.industriesContent.immersive-experiences.faqs.0.q",
          undefined,
          "Can we enforce hard capacity per zone?",
        ),
        a: t(
          "marketing.industriesContent.immersive-experiences.faqs.0.a",
          undefined,
          "Yes. Each zone has a maximum headcount. The scanner refuses entries that would exceed it, routes the guest to waitlist, and promotes when someone exits.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.immersive-experiences.faqs.1.q",
          undefined,
          "Can we publish a separate guide for cast and for front-of-house?",
        ),
        a: t(
          "marketing.industriesContent.immersive-experiences.faqs.1.a",
          undefined,
          "Yes. KBYG guides are per-persona. Cast sees blocking, cue notes, and safety drills. Front-of-house sees guest flow, FAQ, and emergency procedures.",
        ),
      },
      {
        q: t("marketing.industriesContent.immersive-experiences.faqs.2.q", undefined, "How are incidents handled?"),
        a: t(
          "marketing.industriesContent.immersive-experiences.faqs.2.a",
          undefined,
          "One-tap from the field. GPS, photo, and reporter captured automatically. The report routes to the safety lead, and the audit log preserves chain-of-custody for insurance.",
        ),
      },
    ],
  }),
  "brand-activations": (e, t) => ({
    ...e,
    name: t("marketing.industriesContent.brand-activations.name", undefined, "Brand Activations"),
    tagline: t(
      "marketing.industriesContent.brand-activations.tagline",
      undefined,
      "Pop-ups, product launches, experiential marketing",
    ),
    description: t(
      "marketing.industriesContent.brand-activations.description",
      undefined,
      "Brand Activations turn marketing dollars into memorable moments. We handle the operations (agency-to-client proposals, vendor COIs, RSVP flow, on-site capture, post-event analytics) so the creative team stays creative.",
    ),
    hero: {
      eyebrow: t("marketing.industriesContent.brand-activations.hero.eyebrow", undefined, "Brand Activations"),
      title: t(
        "marketing.industriesContent.brand-activations.hero.title",
        undefined,
        "From RFP to Recap. Same Platform.",
      ),
      body: t(
        "marketing.industriesContent.brand-activations.hero.body",
        undefined,
        "Activations live or die by the speed of the hand-off: agency to client, creative to production, production to vendors. ATLVS Technologies shortens every hand-off to zero.",
      ),
    },
    stats: [
      {
        value: "< 1 day",
        label: t("marketing.industriesContent.brand-activations.stats.0.label", undefined, "proposal → signed project"),
      },
      {
        value: "100%",
        label: t("marketing.industriesContent.brand-activations.stats.1.label", undefined, "vendor COIs tracked"),
      },
      {
        value: "40%",
        label: t("marketing.industriesContent.brand-activations.stats.2.label", undefined, "faster reconciliation"),
      },
      {
        value: "24/7",
        label: t("marketing.industriesContent.brand-activations.stats.3.label", undefined, "client portal access"),
      },
    ],
    outcomes: [
      t(
        "marketing.industriesContent.brand-activations.outcomes.0",
        undefined,
        "Signed proposals convert to live projects on signature",
      ),
      t(
        "marketing.industriesContent.brand-activations.outcomes.1",
        undefined,
        "Client portal open 24/7 for proposals, deliverables, invoices, files, and messages",
      ),
      t(
        "marketing.industriesContent.brand-activations.outcomes.2",
        undefined,
        "Vendor COI and W-9 tracking with expiry alerts",
      ),
      t(
        "marketing.industriesContent.brand-activations.outcomes.3",
        undefined,
        "RSVP and check-in flow with lead capture at ingress",
      ),
      t(
        "marketing.industriesContent.brand-activations.outcomes.4",
        undefined,
        "Card or ACH invoice payments with deposit and balance splits",
      ),
      t(
        "marketing.industriesContent.brand-activations.outcomes.5",
        undefined,
        "Post-event recap deck auto-drafted from the activation data",
      ),
    ],
    modules: [
      {
        name: t("marketing.industriesContent.brand-activations.modules.0.name", undefined, "Proposals"),
        body: t(
          "marketing.industriesContent.brand-activations.modules.0.body",
          undefined,
          "Twenty-three block types, scroll-spy nav, e-sign in place, share links, version history.",
        ),
      },
      {
        name: t("marketing.industriesContent.brand-activations.modules.1.name", undefined, "Client Portal"),
        body: t(
          "marketing.industriesContent.brand-activations.modules.1.body",
          undefined,
          "Proposals, deliverables, invoices, shared files, direct messages.",
        ),
      },
      {
        name: t("marketing.industriesContent.brand-activations.modules.2.name", undefined, "RSVP + Capture"),
        body: t(
          "marketing.industriesContent.brand-activations.modules.2.body",
          undefined,
          "Email RSVP with ticketing. On-site scan captures lead data to the CRM.",
        ),
      },
      {
        name: t("marketing.industriesContent.brand-activations.modules.3.name", undefined, "Finance"),
        body: t(
          "marketing.industriesContent.brand-activations.modules.3.body",
          undefined,
          "Card or ACH invoicing, deposit and balance splits, live P&L per activation.",
        ),
      },
    ],
    faqs: [
      {
        q: t(
          "marketing.industriesContent.brand-activations.faqs.0.q",
          undefined,
          "Can agencies share one workspace with multiple clients?",
        ),
        a: t(
          "marketing.industriesContent.brand-activations.faqs.0.a",
          undefined,
          "Yes. Each client is its own organization with its own data walled off. The agency team spans them; clients only ever see their own workspace.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.brand-activations.faqs.1.q",
          undefined,
          "Does the platform handle lead capture at the activation?",
        ),
        a: t(
          "marketing.industriesContent.brand-activations.faqs.1.a",
          undefined,
          "Yes. Every scan at the door can capture opt-in lead data (email, phone, consented fields). Data routes to the brand's CRM.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.brand-activations.faqs.2.q",
          undefined,
          "Is there a branded proposal template?",
        ),
        a: t(
          "marketing.industriesContent.brand-activations.faqs.2.a",
          undefined,
          "Yes. Proposals adopt the client's brand kit (logo, fonts, colors) automatically once the agency team sets it in settings.",
        ),
      },
    ],
  }),
  "corporate-events": (e, t) => ({
    ...e,
    name: t("marketing.industriesContent.corporate-events.name", undefined, "Corporate Events"),
    tagline: t(
      "marketing.industriesContent.corporate-events.tagline",
      undefined,
      "Conferences, AGMs, summits, internal events",
    ),
    description: t(
      "marketing.industriesContent.corporate-events.description",
      undefined,
      "ATLVS Technologies for Corporate Events: conferences, shareholder meetings, executive summits, internal kickoffs. Client-facing proposals, vendor COI tracking, stakeholder portals, and executive-grade guest experiences.",
    ),
    hero: {
      eyebrow: t("marketing.industriesContent.corporate-events.hero.eyebrow", undefined, "Corporate Events"),
      title: t("marketing.industriesContent.corporate-events.hero.title", undefined, "Executive Grade. Field Ready."),
      body: t(
        "marketing.industriesContent.corporate-events.hero.body",
        undefined,
        "Corporate teams want proposals they can review and sign. Executives want KBYG. Vendors need COIs managed. Compliance wants an audit log. We do all four, tuned for corporate cadence.",
      ),
    },
    stats: [
      {
        value: "14 → 2",
        label: t("marketing.industriesContent.corporate-events.stats.0.label", undefined, "days to invoice"),
      },
      {
        value: "100%",
        label: t("marketing.industriesContent.corporate-events.stats.1.label", undefined, "vendor COIs tracked"),
      },
      {
        value: "< 1 day",
        label: t("marketing.industriesContent.corporate-events.stats.2.label", undefined, "proposal → project"),
      },
      {
        value: "SOC 2",
        label: t("marketing.industriesContent.corporate-events.stats.3.label", undefined, "controls in production"),
      },
    ],
    outcomes: [
      t(
        "marketing.industriesContent.corporate-events.outcomes.0",
        undefined,
        "Signed proposals convert to a live project on signature",
      ),
      t(
        "marketing.industriesContent.corporate-events.outcomes.1",
        undefined,
        "Client portal open 24/7 for proposals, deliverables, invoices, files, and messages",
      ),
      t(
        "marketing.industriesContent.corporate-events.outcomes.2",
        undefined,
        "Vendor COI and W-9 tracking with expiry alerts",
      ),
      t(
        "marketing.industriesContent.corporate-events.outcomes.3",
        undefined,
        "Per-persona KBYG for executives, VIPs, staff, and crew",
      ),
      t(
        "marketing.industriesContent.corporate-events.outcomes.4",
        undefined,
        "Card or ACH invoicing with deposit and balance splits",
      ),
      t(
        "marketing.industriesContent.corporate-events.outcomes.5",
        undefined,
        "Immutable audit log on every change, for compliance and legal",
      ),
    ],
    modules: [
      {
        name: t("marketing.industriesContent.corporate-events.modules.0.name", undefined, "Proposals"),
        body: t(
          "marketing.industriesContent.corporate-events.modules.0.body",
          undefined,
          "Twenty-three block types, scroll-spy nav, e-sign in place, share links, version history.",
        ),
      },
      {
        name: t("marketing.industriesContent.corporate-events.modules.1.name", undefined, "Client Portal"),
        body: t(
          "marketing.industriesContent.corporate-events.modules.1.body",
          undefined,
          "Proposals, deliverables, invoices, shared files, direct messages.",
        ),
      },
      {
        name: t("marketing.industriesContent.corporate-events.modules.2.name", undefined, "Compliance"),
        body: t(
          "marketing.industriesContent.corporate-events.modules.2.body",
          undefined,
          "Vendor COI tracking, W-9 storage, immutable audit log, SOC 2 controls.",
        ),
      },
      {
        name: t("marketing.industriesContent.corporate-events.modules.3.name", undefined, "Finance"),
        body: t(
          "marketing.industriesContent.corporate-events.modules.3.body",
          undefined,
          "Card or ACH invoicing, deposit and balance splits, live P&L.",
        ),
      },
    ],
    faqs: [
      {
        q: t(
          "marketing.industriesContent.corporate-events.faqs.0.q",
          undefined,
          "Does the platform support SOC 2 or ISO compliance?",
        ),
        a: t(
          "marketing.industriesContent.corporate-events.faqs.0.a",
          undefined,
          "The controls SOC 2 attests to (access control, change management, audit logging, encryption, monitoring) are already in production. SOC 2 Type II is in progress for Enterprise customers. Contact sales for current status.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.corporate-events.faqs.1.q",
          undefined,
          "Can we route proposals through legal?",
        ),
        a: t(
          "marketing.industriesContent.corporate-events.faqs.1.a",
          undefined,
          "Yes. Create a separate internal review link from the client link. Annotate and revise. Send the final version when you're ready. Version history tracks every edit.",
        ),
      },
    ],
  }),
  "theatrical-performances": (e, t) => ({
    ...e,
    name: t("marketing.industriesContent.theatrical-performances.name", undefined, "Theatrical Performances"),
    tagline: t(
      "marketing.industriesContent.theatrical-performances.tagline",
      undefined,
      "Residencies, touring productions, galas",
    ),
    description: t(
      "marketing.industriesContent.theatrical-performances.description",
      undefined,
      "Theatrical Performances: Broadway runs, off-Broadway limited engagements, regional residencies, gala productions. Cast and crew scheduling, cue notes, understudy tracking, per-house advancing, and compliance-ready audit trails.",
    ),
    hero: {
      eyebrow: t(
        "marketing.industriesContent.theatrical-performances.hero.eyebrow",
        undefined,
        "Theatrical Performances",
      ),
      title: t(
        "marketing.industriesContent.theatrical-performances.hero.title",
        undefined,
        "Eight Shows a Week. Zero Drift.",
      ),
      body: t(
        "marketing.industriesContent.theatrical-performances.hero.body",
        undefined,
        "Long-running productions live or die by consistency. Cast changes, understudies, rider tweaks, venue quirks: we keep the canonical production in one place and log every deviation.",
      ),
    },
    stats: [
      {
        value: "8",
        label: t("marketing.industriesContent.theatrical-performances.stats.0.label", undefined, "shows / week"),
      },
      {
        value: "0",
        label: t("marketing.industriesContent.theatrical-performances.stats.1.label", undefined, "missed cue logs"),
      },
      {
        value: "1×",
        label: t("marketing.industriesContent.theatrical-performances.stats.2.label", undefined, "rider edit"),
      },
      {
        value: "100%",
        label: t("marketing.industriesContent.theatrical-performances.stats.3.label", undefined, "understudy coverage"),
      },
    ],
    outcomes: [
      t(
        "marketing.industriesContent.theatrical-performances.outcomes.0",
        undefined,
        "Per-show rundown with cue notes, blocking revisions, and understudy tracking",
      ),
      t(
        "marketing.industriesContent.theatrical-performances.outcomes.1",
        undefined,
        "Cast pool with availability and conflict detection across shows",
      ),
      t(
        "marketing.industriesContent.theatrical-performances.outcomes.2",
        undefined,
        "Canonical rider with per-venue overrides for touring productions",
      ),
      t(
        "marketing.industriesContent.theatrical-performances.outcomes.3",
        undefined,
        "Equity and union-compliant scheduling with break enforcement",
      ),
      t(
        "marketing.industriesContent.theatrical-performances.outcomes.4",
        undefined,
        "Front-of-house and back-of-house guides per persona",
      ),
      t(
        "marketing.industriesContent.theatrical-performances.outcomes.5",
        undefined,
        "Full audit trail (who changed what, when) for legal and compliance",
      ),
    ],
    modules: [
      {
        name: t("marketing.industriesContent.theatrical-performances.modules.0.name", undefined, "Rundown"),
        body: t(
          "marketing.industriesContent.theatrical-performances.modules.0.body",
          undefined,
          "Per-show cue list, blocking revisions, understudy assignments, version history.",
        ),
      },
      {
        name: t("marketing.industriesContent.theatrical-performances.modules.1.name", undefined, "Cast Pool"),
        body: t(
          "marketing.industriesContent.theatrical-performances.modules.1.body",
          undefined,
          "Availability grid, conflict detection, union-compliant scheduling, day rates.",
        ),
      },
      {
        name: t("marketing.industriesContent.theatrical-performances.modules.2.name", undefined, "Advancing"),
        body: t(
          "marketing.industriesContent.theatrical-performances.modules.2.body",
          undefined,
          "Canonical production scope. Per-venue overrides for touring.",
        ),
      },
      {
        name: t("marketing.industriesContent.theatrical-performances.modules.3.name", undefined, "Compliance"),
        body: t(
          "marketing.industriesContent.theatrical-performances.modules.3.body",
          undefined,
          "Audit log on every change. Union break enforcement. Safety incident reporting.",
        ),
      },
    ],
    faqs: [
      {
        q: t(
          "marketing.industriesContent.theatrical-performances.faqs.0.q",
          undefined,
          "Does the platform support Equity-compliant scheduling?",
        ),
        a: t(
          "marketing.industriesContent.theatrical-performances.faqs.0.a",
          undefined,
          "Yes. Break rules, 10-out-of-12 limitations, and overtime thresholds are configurable per production. The scheduler refuses assignments that would violate the rules.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.theatrical-performances.faqs.1.q",
          undefined,
          "Can I track understudy coverage?",
        ),
        a: t(
          "marketing.industriesContent.theatrical-performances.faqs.1.a",
          undefined,
          "Yes. Each role has a primary and understudy chain. Availability conflicts surface as the schedule is built. Historical coverage is preserved for payroll.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.theatrical-performances.faqs.2.q",
          undefined,
          "How is cue-note revision history handled?",
        ),
        a: t(
          "marketing.industriesContent.theatrical-performances.faqs.2.a",
          undefined,
          "Every rundown edit is versioned: who, when, before, after. The stage manager can roll back a bad revision in one click, and the audit log satisfies legal review.",
        ),
      },
    ],
  }),
  "broadcast-tv-film": (e, t) => ({
    ...e,
    name: t("marketing.industriesContent.broadcast-tv-film.name", undefined, "Broadcast, TV & Film"),
    tagline: t(
      "marketing.industriesContent.broadcast-tv-film.tagline",
      undefined,
      "Studio, remote, location-based production",
    ),
    description: t(
      "marketing.industriesContent.broadcast-tv-film.description",
      undefined,
      "Broadcast, TV & Film: multi-camera studio broadcasts, remote productions, location shoots, episodic series. Call sheets, day-of logistics, vendor management, union-compliant time tracking, and per-production financial reporting.",
    ),
    hero: {
      eyebrow: t("marketing.industriesContent.broadcast-tv-film.hero.eyebrow", undefined, "Broadcast, TV & Film"),
      title: t("marketing.industriesContent.broadcast-tv-film.hero.title", undefined, "Prep to Wrap. One Platform."),
      body: t(
        "marketing.industriesContent.broadcast-tv-film.hero.body",
        undefined,
        "Film and television production carry more moving pieces than any other live format. We run call sheets, day-of logistics, vendor COIs, union payroll, and per-production P&L on one record, so the line producer stays on set, not behind a desk.",
      ),
    },
    stats: [
      {
        value: "120+",
        label: t("marketing.industriesContent.broadcast-tv-film.stats.0.label", undefined, "crew per shoot day"),
      },
      {
        value: "6 a.m.",
        label: t("marketing.industriesContent.broadcast-tv-film.stats.1.label", undefined, "call-sheet delivery"),
      },
      {
        value: "100%",
        label: t("marketing.industriesContent.broadcast-tv-film.stats.2.label", undefined, "COI tracking"),
      },
      {
        value: "0",
        label: t("marketing.industriesContent.broadcast-tv-film.stats.3.label", undefined, "missed meal penalties"),
      },
    ],
    outcomes: [
      t(
        "marketing.industriesContent.broadcast-tv-film.outcomes.0",
        undefined,
        "Call sheets auto-drafted and delivered to cast and crew by 6 a.m.",
      ),
      t(
        "marketing.industriesContent.broadcast-tv-film.outcomes.1",
        undefined,
        "Union-compliant time tracking with meal penalty enforcement",
      ),
      t(
        "marketing.industriesContent.broadcast-tv-film.outcomes.2",
        undefined,
        "Vendor COI and W-9 tracking with expiry alerts before they lapse",
      ),
      t(
        "marketing.industriesContent.broadcast-tv-film.outcomes.3",
        undefined,
        "Per-production P&L, petty cash envelopes, and per-department budgets",
      ),
      t(
        "marketing.industriesContent.broadcast-tv-film.outcomes.4",
        undefined,
        "Location agreements and clearances tracked with rights windows",
      ),
      t(
        "marketing.industriesContent.broadcast-tv-film.outcomes.5",
        undefined,
        "Offline time cards work when location has zero bars",
      ),
    ],
    modules: [
      {
        name: t("marketing.industriesContent.broadcast-tv-film.modules.0.name", undefined, "Call Sheets"),
        body: t(
          "marketing.industriesContent.broadcast-tv-film.modules.0.body",
          undefined,
          "Daily call sheets auto-drafted from schedule and crew pool. Delivered via email and portal.",
        ),
      },
      {
        name: t("marketing.industriesContent.broadcast-tv-film.modules.1.name", undefined, "Time Tracking"),
        body: t(
          "marketing.industriesContent.broadcast-tv-film.modules.1.body",
          undefined,
          "Union-compliant clock with meal penalty logic. DGA, IATSE, SAG rules configurable.",
        ),
      },
      {
        name: t("marketing.industriesContent.broadcast-tv-film.modules.2.name", undefined, "Locations"),
        body: t(
          "marketing.industriesContent.broadcast-tv-film.modules.2.body",
          undefined,
          "Location library with agreements, rights windows, and contact rolodex.",
        ),
      },
      {
        name: t("marketing.industriesContent.broadcast-tv-film.modules.3.name", undefined, "Procurement"),
        body: t(
          "marketing.industriesContent.broadcast-tv-film.modules.3.body",
          undefined,
          "Purchase orders with receiving. Vendor COI and W-9 on every vendor. Petty cash per department.",
        ),
      },
    ],
    faqs: [
      {
        q: t(
          "marketing.industriesContent.broadcast-tv-film.faqs.0.q",
          undefined,
          "Can the platform handle union-specific rules (DGA, IATSE, SAG, AEA)?",
        ),
        a: t(
          "marketing.industriesContent.broadcast-tv-film.faqs.0.a",
          undefined,
          "Yes. Each production configures its union rule set per department. Time cards validate against the rules at submission. Meal penalties and overtime enforce automatically.",
        ),
      },
      {
        q: t("marketing.industriesContent.broadcast-tv-film.faqs.1.q", undefined, "How does location clearance work?"),
        a: t(
          "marketing.industriesContent.broadcast-tv-film.faqs.1.a",
          undefined,
          "Each location has a clearance record with rights-holder contact, granted window, and linked agreement. The system warns when a shoot date falls outside a cleared window.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.broadcast-tv-film.faqs.2.q",
          undefined,
          "Can we integrate with our payroll provider (Cast & Crew, Entertainment Partners)?",
        ),
        a: t(
          "marketing.industriesContent.broadcast-tv-film.faqs.2.a",
          undefined,
          "Yes. Time card exports in the standard formats those providers consume. Two-way sync is Enterprise. Export-only is available on every tier.",
        ),
      },
    ],
  }),
  "sports-events": (e, t) => ({
    ...e,
    name: t("marketing.industriesContent.sports-events.name", undefined, "Sports Events"),
    tagline: t(
      "marketing.industriesContent.sports-events.tagline",
      undefined,
      "Game days, tournaments, championship weekends",
    ),
    description: t(
      "marketing.industriesContent.sports-events.description",
      undefined,
      "Game day runs on COMPVSS, the field app your event staff carries today. Crew scheduling by gate and section, credential scans at every checkpoint, one-tap incident reports that reach command in seconds, and a daily log that holds up in the post-game debrief.",
    ),
    hero: {
      eyebrow: t("marketing.industriesContent.sports-events.hero.eyebrow", undefined, "Sports Events"),
      title: t("marketing.industriesContent.sports-events.hero.title", undefined, "Game Day Lives on the Field App."),
      body: t(
        "marketing.industriesContent.sports-events.hero.body",
        undefined,
        "A stadium event day is hundreds of staff across dozens of positions with a kickoff that will not wait. COMPVSS puts the schedule, the gate scans, and the incident channel on every worker's phone, and it keeps working when the concourse kills the signal.",
      ),
    },
    stats: [
      {
        value: "< 100ms",
        label: t("marketing.industriesContent.sports-events.stats.0.label", undefined, "credential scan"),
      },
      {
        value: "1 tap",
        label: t("marketing.industriesContent.sports-events.stats.1.label", undefined, "incident filed"),
      },
      {
        value: "GPS",
        label: t("marketing.industriesContent.sports-events.stats.2.label", undefined, "verified clock-in"),
      },
      {
        value: "0",
        label: t("marketing.industriesContent.sports-events.stats.3.label", undefined, "paper sign-in sheets"),
      },
    ],
    outcomes: [
      t(
        "marketing.industriesContent.sports-events.outcomes.0",
        undefined,
        "Post the game-day schedule by position and gate; crews confirm from their phones",
      ),
      t(
        "marketing.industriesContent.sports-events.outcomes.1",
        undefined,
        "Scan staff credentials at every checkpoint, offline included",
      ),
      t(
        "marketing.industriesContent.sports-events.outcomes.2",
        undefined,
        "File incidents from the stands with photo and GPS attached automatically",
      ),
      t(
        "marketing.industriesContent.sports-events.outcomes.3",
        undefined,
        "Clock in with geo-verification at the employee gate",
      ),
      t(
        "marketing.industriesContent.sports-events.outcomes.4",
        undefined,
        "Check radios and scanners out to workers and back in at wrap",
      ),
      t(
        "marketing.industriesContent.sports-events.outcomes.5",
        undefined,
        "Box-office and settlement reporting arrive with the ATLVS console (coming soon)",
      ),
    ],
    modules: [
      {
        name: t("marketing.industriesContent.sports-events.modules.0.name", undefined, "Crew Scheduling"),
        body: t(
          "marketing.industriesContent.sports-events.modules.0.body",
          undefined,
          "Shifts by position, gate, and section. Coverage view shows the holes before doors.",
        ),
      },
      {
        name: t("marketing.industriesContent.sports-events.modules.1.name", undefined, "Gate & Credential Scan"),
        body: t(
          "marketing.industriesContent.sports-events.modules.1.body",
          undefined,
          "Staff credentials scan on any phone. Offline queue reconciles when the device reconnects.",
        ),
      },
      {
        name: t("marketing.industriesContent.sports-events.modules.2.name", undefined, "Incidents"),
        body: t(
          "marketing.industriesContent.sports-events.modules.2.body",
          undefined,
          "One-tap filing from anywhere in the bowl. Reports route to command with location and photo.",
        ),
      },
      {
        name: t("marketing.industriesContent.sports-events.modules.3.name", undefined, "Asset Custody"),
        body: t(
          "marketing.industriesContent.sports-events.modules.3.body",
          undefined,
          "Radios, scanners, and keys checked out per worker. The wrap report shows what is still out.",
        ),
      },
    ],
    faqs: [
      {
        q: t(
          "marketing.industriesContent.sports-events.faqs.0.q",
          undefined,
          "Does the app work inside a concrete stadium bowl?",
        ),
        a: t(
          "marketing.industriesContent.sports-events.faqs.0.a",
          undefined,
          "Yes. COMPVSS is offline-first. Scans, incident reports, and clock punches queue on the device and sync when the phone finds signal again. Nothing is lost in a dead zone.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.sports-events.faqs.1.q",
          undefined,
          "Can staffing agencies and third-party vendors work off the same schedule?",
        ),
        a: t(
          "marketing.industriesContent.sports-events.faqs.1.a",
          undefined,
          "Yes. External crews join the project with their own scoped access. They see their shifts and check-in points, and their scans and time punches land in the same record as your house staff.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.sports-events.faqs.2.q",
          undefined,
          "Can we reuse a setup across a whole home season?",
        ),
        a: t(
          "marketing.industriesContent.sports-events.faqs.2.a",
          undefined,
          "Yes. Build the event-day template once, then clone it per game and change only what differs. Schedules, checkpoints, and incident routing carry over.",
        ),
      },
    ],
  }),
  "venues-arenas": (e, t) => ({
    ...e,
    name: t("marketing.industriesContent.venues-arenas.name", undefined, "Venues & Arenas"),
    tagline: t(
      "marketing.industriesContent.venues-arenas.tagline",
      undefined,
      "House teams running hundreds of shows a year",
    ),
    description: t(
      "marketing.industriesContent.venues-arenas.description",
      undefined,
      "Built for the house team that turns the building over night after night. COMPVSS runs the crew schedule across a heavy calendar, changeover punch lists, recurring inspections, and an incident log scoped per event, all from the phones your staff already carry.",
    ),
    hero: {
      eyebrow: t("marketing.industriesContent.venues-arenas.hero.eyebrow", undefined, "Venues & Arenas"),
      title: t(
        "marketing.industriesContent.venues-arenas.hero.title",
        undefined,
        "Two Hundred Event Days. One House System.",
      ),
      body: t(
        "marketing.industriesContent.venues-arenas.hero.body",
        undefined,
        "A busy building hosts a concert, a game, and a corporate buyout in the same week. COMPVSS keeps the house crew scheduled across all of it and logs every changeover, inspection, and incident against the right event.",
      ),
    },
    stats: [
      {
        value: "24/7",
        label: t("marketing.industriesContent.venues-arenas.stats.0.label", undefined, "building coverage"),
      },
      {
        value: "1 tap",
        label: t("marketing.industriesContent.venues-arenas.stats.1.label", undefined, "punch item logged"),
      },
      {
        value: "Offline",
        label: t("marketing.industriesContent.venues-arenas.stats.2.label", undefined, "back-of-house ready"),
      },
      {
        value: "0",
        label: t("marketing.industriesContent.venues-arenas.stats.3.label", undefined, "paper checklists"),
      },
    ],
    outcomes: [
      t(
        "marketing.industriesContent.venues-arenas.outcomes.0",
        undefined,
        "Schedule the house crew across the full event calendar with coverage gaps visible",
      ),
      t(
        "marketing.industriesContent.venues-arenas.outcomes.1",
        undefined,
        "Run changeover punch lists with photos; items close before doors",
      ),
      t(
        "marketing.industriesContent.venues-arenas.outcomes.2",
        undefined,
        "Recurring inspections per room and per system, with a record of every pass",
      ),
      t(
        "marketing.industriesContent.venues-arenas.outcomes.3",
        undefined,
        "Incident and lost-and-found logs scoped to the event they happened at",
      ),
      t(
        "marketing.industriesContent.venues-arenas.outcomes.4",
        undefined,
        "Shift handover notes so the night crew knows what the day crew left open",
      ),
      t(
        "marketing.industriesContent.venues-arenas.outcomes.5",
        undefined,
        "House inventory custody: who has the lift key, and since when",
      ),
    ],
    modules: [
      {
        name: t("marketing.industriesContent.venues-arenas.modules.0.name", undefined, "Scheduling & Coverage"),
        body: t(
          "marketing.industriesContent.venues-arenas.modules.0.body",
          undefined,
          "Calendar-wide crew scheduling with a coverage view per event day. Swaps and confirmations from the phone.",
        ),
      },
      {
        name: t("marketing.industriesContent.venues-arenas.modules.1.name", undefined, "Punch Lists"),
        body: t(
          "marketing.industriesContent.venues-arenas.modules.1.body",
          undefined,
          "Changeover and maintenance punches with photo evidence, assignment, and closure tracking.",
        ),
      },
      {
        name: t("marketing.industriesContent.venues-arenas.modules.2.name", undefined, "Inspections"),
        body: t(
          "marketing.industriesContent.venues-arenas.modules.2.body",
          undefined,
          "Recurring checklists per space. Every completed inspection is timestamped and attributable.",
        ),
      },
      {
        name: t("marketing.industriesContent.venues-arenas.modules.3.name", undefined, "Incidents & Lost and Found"),
        body: t(
          "marketing.industriesContent.venues-arenas.modules.3.body",
          undefined,
          "One log for the building, filtered per event. Lost items tracked from intake to return.",
        ),
      },
    ],
    faqs: [
      {
        q: t(
          "marketing.industriesContent.venues-arenas.faqs.0.q",
          undefined,
          "Can we run multiple events in the building on the same day?",
        ),
        a: t(
          "marketing.industriesContent.venues-arenas.faqs.0.a",
          undefined,
          "Yes. Each event is its own project with its own schedule, checklists, and incident log. The house crew works across all of them from one app, and reports stay separated per event.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.venues-arenas.faqs.1.q",
          undefined,
          "Can a touring production see our house schedule?",
        ),
        a: t(
          "marketing.industriesContent.venues-arenas.faqs.1.a",
          undefined,
          "Only what you share. Touring and promoter reps can be invited into a single event with scoped access. They never see the rest of your calendar or another promoter's event.",
        ),
      },
      {
        q: t("marketing.industriesContent.venues-arenas.faqs.2.q", undefined, "How does shift handover work?"),
        a: t(
          "marketing.industriesContent.venues-arenas.faqs.2.a",
          undefined,
          "The outgoing lead logs a handover note against the shift, with open punch items attached. The incoming crew opens the app and sees exactly what is unresolved. No whiteboard required.",
        ),
      },
    ],
  }),
  "trade-shows-exhibitions": (e, t) => ({
    ...e,
    name: t("marketing.industriesContent.trade-shows-exhibitions.name", undefined, "Trade Shows & Exhibitions"),
    tagline: t(
      "marketing.industriesContent.trade-shows-exhibitions.tagline",
      undefined,
      "Exhibit halls, booth builds, show-floor operations",
    ),
    description: t(
      "marketing.industriesContent.trade-shows-exhibitions.description",
      undefined,
      "Move-in to move-out on one field app. COMPVSS schedules labor calls per hall, runs booth punch lists to zero before show open, scans crew at the dock, and tracks every cart and lift checked out on the floor.",
    ),
    hero: {
      eyebrow: t(
        "marketing.industriesContent.trade-shows-exhibitions.hero.eyebrow",
        undefined,
        "Trade Shows & Exhibitions",
      ),
      title: t(
        "marketing.industriesContent.trade-shows-exhibitions.hero.title",
        undefined,
        "Move-In to Move-Out, On the Floor.",
      ),
      body: t(
        "marketing.industriesContent.trade-shows-exhibitions.hero.body",
        undefined,
        "An exhibit hall build is dozens of crews from different companies working the same floor against the same deadline. COMPVSS gives every crew its call time, its punch list, and its dock access from a phone, and gives you the whole floor in one view.",
      ),
    },
    stats: [
      {
        value: "1 tap",
        label: t("marketing.industriesContent.trade-shows-exhibitions.stats.0.label", undefined, "booth punch filed"),
      },
      {
        value: "< 100ms",
        label: t(
          "marketing.industriesContent.trade-shows-exhibitions.stats.1.label",
          undefined,
          "dock credential scan",
        ),
      },
      {
        value: "Offline",
        label: t(
          "marketing.industriesContent.trade-shows-exhibitions.stats.2.label",
          undefined,
          "in the hall, by design",
        ),
      },
      {
        value: "0",
        label: t(
          "marketing.industriesContent.trade-shows-exhibitions.stats.3.label",
          undefined,
          "clipboard walk-throughs",
        ),
      },
    ],
    outcomes: [
      t(
        "marketing.industriesContent.trade-shows-exhibitions.outcomes.0",
        undefined,
        "Schedule labor calls per hall and per booth block; crews confirm from their phones",
      ),
      t(
        "marketing.industriesContent.trade-shows-exhibitions.outcomes.1",
        undefined,
        "Booth punch lists with photos, assigned and closed before show open",
      ),
      t(
        "marketing.industriesContent.trade-shows-exhibitions.outcomes.2",
        undefined,
        "Scan crew credentials at the dock and the floor entrance",
      ),
      t(
        "marketing.industriesContent.trade-shows-exhibitions.outcomes.3",
        undefined,
        "Track carts, lifts, and tools checked out to each crew",
      ),
      t(
        "marketing.industriesContent.trade-shows-exhibitions.outcomes.4",
        undefined,
        "Daily log per hall for the general contractor record",
      ),
      t(
        "marketing.industriesContent.trade-shows-exhibitions.outcomes.5",
        undefined,
        "Exhibitor billing lands with the ATLVS console (coming soon)",
      ),
    ],
    modules: [
      {
        name: t("marketing.industriesContent.trade-shows-exhibitions.modules.0.name", undefined, "Labor Scheduling"),
        body: t(
          "marketing.industriesContent.trade-shows-exhibitions.modules.0.body",
          undefined,
          "Calls per hall, per day, per crew. Confirmations and no-shows visible before the shift starts.",
        ),
      },
      {
        name: t("marketing.industriesContent.trade-shows-exhibitions.modules.1.name", undefined, "Punch Lists"),
        body: t(
          "marketing.industriesContent.trade-shows-exhibitions.modules.1.body",
          undefined,
          "Per-booth punches with photo evidence. Filter by hall, aisle, or contractor and drive to zero.",
        ),
      },
      {
        name: t("marketing.industriesContent.trade-shows-exhibitions.modules.2.name", undefined, "Dock & Floor Access"),
        body: t(
          "marketing.industriesContent.trade-shows-exhibitions.modules.2.body",
          undefined,
          "Credential scan at the dock and the hall doors. Offline queue for the loading bays.",
        ),
      },
      {
        name: t("marketing.industriesContent.trade-shows-exhibitions.modules.3.name", undefined, "Asset Custody"),
        body: t(
          "marketing.industriesContent.trade-shows-exhibitions.modules.3.body",
          undefined,
          "Every lift, cart, and tool checked out per crew. Move-out shows what has not come back.",
        ),
      },
    ],
    faqs: [
      {
        q: t(
          "marketing.industriesContent.trade-shows-exhibitions.faqs.0.q",
          undefined,
          "We are a general contractor with subs from six companies. Can they all work in one system?",
        ),
        a: t(
          "marketing.industriesContent.trade-shows-exhibitions.faqs.0.a",
          undefined,
          "Yes. Each subcontractor joins the project with scoped access. They see their own calls, punches, and dock windows. You see the whole floor rolled up by hall and by company.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.trade-shows-exhibitions.faqs.1.q",
          undefined,
          "Does the app work in the middle of a convention hall?",
        ),
        a: t(
          "marketing.industriesContent.trade-shows-exhibitions.faqs.1.a",
          undefined,
          "Yes. COMPVSS is offline-first. Punches, scans, and time punches queue on the device and sync when signal returns, which matters when ten thousand exhibitors are sharing one access point.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.trade-shows-exhibitions.faqs.2.q",
          undefined,
          "Can we run union labor calls through the platform?",
        ),
        a: t(
          "marketing.industriesContent.trade-shows-exhibitions.faqs.2.a",
          undefined,
          "Yes. Calls are scheduled per crew with call times, positions, and confirmations. Time punches are geo-verified and export for payroll, and the daily log preserves who worked which hall.",
        ),
      },
    ],
  }),
  conferences: (e, t) => ({
    ...e,
    name: t("marketing.industriesContent.conferences.name", undefined, "Conferences"),
    tagline: t(
      "marketing.industriesContent.conferences.tagline",
      undefined,
      "Summits, multi-track programs, general sessions",
    ),
    description: t(
      "marketing.industriesContent.conferences.description",
      undefined,
      "For the production teams behind multi-track conferences: room turnovers on punch lists, AV crews scheduled per session block, check-in scanning at registration and session doors, and briefings that reach every crew phone before the first keynote.",
    ),
    hero: {
      eyebrow: t("marketing.industriesContent.conferences.hero.eyebrow", undefined, "Conferences"),
      title: t(
        "marketing.industriesContent.conferences.hero.title",
        undefined,
        "Forty Sessions a Day. Every Room Turn Logged.",
      ),
      body: t(
        "marketing.industriesContent.conferences.hero.body",
        undefined,
        "A conference is a production that resets itself every ninety minutes. COMPVSS runs the turn schedule, the room-set punch lists, and the door scans from the phones your crew already carries, so the 2 p.m. breakout looks as sharp as the opening keynote.",
      ),
    },
    stats: [
      {
        value: "1 tap",
        label: t("marketing.industriesContent.conferences.stats.0.label", undefined, "room punch closed"),
      },
      {
        value: "< 100ms",
        label: t("marketing.industriesContent.conferences.stats.1.label", undefined, "badge scan at doors"),
      },
      {
        value: "GPS",
        label: t("marketing.industriesContent.conferences.stats.2.label", undefined, "verified crew clock-in"),
      },
      {
        value: "0",
        label: t("marketing.industriesContent.conferences.stats.3.label", undefined, "printed run sheets"),
      },
    ],
    outcomes: [
      t(
        "marketing.industriesContent.conferences.outcomes.0",
        undefined,
        "Schedule AV and room crews per session block across every track",
      ),
      t(
        "marketing.industriesContent.conferences.outcomes.1",
        undefined,
        "Room-set punch lists per turnover, with photos, closed before doors open",
      ),
      t(
        "marketing.industriesContent.conferences.outcomes.2",
        undefined,
        "Scan attendee check-ins at registration and at session doors",
      ),
      t(
        "marketing.industriesContent.conferences.outcomes.3",
        undefined,
        "Session briefings and day-of guides delivered to every crew phone",
      ),
      t(
        "marketing.industriesContent.conferences.outcomes.4",
        undefined,
        "Mid-day schedule changes push to affected crews instantly",
      ),
      t(
        "marketing.industriesContent.conferences.outcomes.5",
        undefined,
        "Incidents filed from any room route straight to the floor manager",
      ),
    ],
    modules: [
      {
        name: t("marketing.industriesContent.conferences.modules.0.name", undefined, "Room Turnovers"),
        body: t(
          "marketing.industriesContent.conferences.modules.0.body",
          undefined,
          "Punch list per turn: set, AV check, signage, reset. Photo evidence and closure tracking per room.",
        ),
      },
      {
        name: t("marketing.industriesContent.conferences.modules.1.name", undefined, "Crew Scheduling"),
        body: t(
          "marketing.industriesContent.conferences.modules.1.body",
          undefined,
          "AV, rigging, and floor crews scheduled per session block. Changes reach the right phones immediately.",
        ),
      },
      {
        name: t("marketing.industriesContent.conferences.modules.2.name", undefined, "Check-In Scan"),
        body: t(
          "marketing.industriesContent.conferences.modules.2.body",
          undefined,
          "Registration and session-door scanning on any phone, with offline queue for crowded ballroom corridors.",
        ),
      },
      {
        name: t("marketing.industriesContent.conferences.modules.3.name", undefined, "Briefings & Guides"),
        body: t(
          "marketing.industriesContent.conferences.modules.3.body",
          undefined,
          "Per-persona day-of guides: crew sees run notes and escalations, staff sees the attendee-facing script.",
        ),
      },
    ],
    faqs: [
      {
        q: t(
          "marketing.industriesContent.conferences.faqs.0.q",
          undefined,
          "How is this different from your Corporate Events coverage?",
        ),
        a: t(
          "marketing.industriesContent.conferences.faqs.0.a",
          undefined,
          "Corporate Events covers the broader client-side program: proposals, stakeholder portals, compliance. Conferences is the production floor itself: session turns, AV crews, door scans, briefings. Many teams use both angles on the same project.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.conferences.faqs.1.q",
          undefined,
          "Can we handle a campus spread across three hotels?",
        ),
        a: t(
          "marketing.industriesContent.conferences.faqs.1.a",
          undefined,
          "Yes. Locations and rooms are modeled per venue, crews are scheduled per building, and the schedule view shows travel gaps between properties so a crew is never booked in two hotels at once.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.conferences.faqs.2.q",
          undefined,
          "What happens when the program changes at 11 a.m.?",
        ),
        a: t(
          "marketing.industriesContent.conferences.faqs.2.a",
          undefined,
          "Update the session block once and the change pushes to every affected crew phone. The old time disappears from their schedule, the new one appears, and the turn punch list moves with it.",
        ),
      },
    ],
  }),
  "weddings-private-events": (e, t) => ({
    ...e,
    name: t("marketing.industriesContent.weddings-private-events.name", undefined, "Weddings & Private Events"),
    tagline: t(
      "marketing.industriesContent.weddings-private-events.tagline",
      undefined,
      "High-end private productions, estates, destination builds",
    ),
    description: t(
      "marketing.industriesContent.weddings-private-events.description",
      undefined,
      "For private-event production companies building tented estates and destination weekends. COMPVSS schedules the build crew day by day, checks vendors in at the gate, walks the punch list before the client walk-through, and keeps a daily log of every build day.",
    ),
    hero: {
      eyebrow: t(
        "marketing.industriesContent.weddings-private-events.hero.eyebrow",
        undefined,
        "Weddings & Private Events",
      ),
      title: t(
        "marketing.industriesContent.weddings-private-events.hero.title",
        undefined,
        "The Client Sees the Room. You See the Punch List.",
      ),
      body: t(
        "marketing.industriesContent.weddings-private-events.hero.body",
        undefined,
        "A high-end private build is a week of load-ins on a site with no loading dock and a client walk-through that cannot slip. COMPVSS runs the build schedule, the vendor arrivals, and the final punch from your crew's phones, even where the estate has no signal.",
      ),
    },
    stats: [
      {
        value: "1 tap",
        label: t("marketing.industriesContent.weddings-private-events.stats.0.label", undefined, "punch item filed"),
      },
      {
        value: "GPS",
        label: t(
          "marketing.industriesContent.weddings-private-events.stats.1.label",
          undefined,
          "verified crew clock-in",
        ),
      },
      {
        value: "Offline",
        label: t(
          "marketing.industriesContent.weddings-private-events.stats.2.label",
          undefined,
          "works at remote estates",
        ),
      },
      {
        value: "0",
        label: t("marketing.industriesContent.weddings-private-events.stats.3.label", undefined, "binder run sheets"),
      },
    ],
    outcomes: [
      t(
        "marketing.industriesContent.weddings-private-events.outcomes.0",
        undefined,
        "Build-week crew schedules per day and per zone, confirmed from the phone",
      ),
      t(
        "marketing.industriesContent.weddings-private-events.outcomes.1",
        undefined,
        "Vendor arrival check-in at the gate, timestamped against the delivery window",
      ),
      t(
        "marketing.industriesContent.weddings-private-events.outcomes.2",
        undefined,
        "Punch list walk with photos before every client walk-through",
      ),
      t(
        "marketing.industriesContent.weddings-private-events.outcomes.3",
        undefined,
        "Rental custody: what arrived, who has it, what goes back on which truck",
      ),
      t(
        "marketing.industriesContent.weddings-private-events.outcomes.4",
        undefined,
        "Daily log per build day, from first truck to last light focus",
      ),
      t(
        "marketing.industriesContent.weddings-private-events.outcomes.5",
        undefined,
        "Client proposals and invoicing arrive with the ATLVS console (coming soon)",
      ),
    ],
    modules: [
      {
        name: t("marketing.industriesContent.weddings-private-events.modules.0.name", undefined, "Build Schedule"),
        body: t(
          "marketing.industriesContent.weddings-private-events.modules.0.body",
          undefined,
          "Crew calls per build day and zone. The week view shows every trade's window on the site.",
        ),
      },
      {
        name: t("marketing.industriesContent.weddings-private-events.modules.1.name", undefined, "Vendor Check-In"),
        body: t(
          "marketing.industriesContent.weddings-private-events.modules.1.body",
          undefined,
          "Every arrival scanned at the gate. Late deliveries are visible the moment the window passes.",
        ),
      },
      {
        name: t("marketing.industriesContent.weddings-private-events.modules.2.name", undefined, "Punch Lists"),
        body: t(
          "marketing.industriesContent.weddings-private-events.modules.2.body",
          undefined,
          "Photo punches per zone, assigned to a crew, closed before the client walks the room.",
        ),
      },
      {
        name: t("marketing.industriesContent.weddings-private-events.modules.3.name", undefined, "Daily Logs"),
        body: t(
          "marketing.industriesContent.weddings-private-events.modules.3.body",
          undefined,
          "One log per build day: weather, arrivals, progress, issues. The record your team wishes it had kept.",
        ),
      },
    ],
    faqs: [
      {
        q: t(
          "marketing.industriesContent.weddings-private-events.faqs.0.q",
          undefined,
          "Our clients expect discretion. Who can see event data?",
        ),
        a: t(
          "marketing.industriesContent.weddings-private-events.faqs.0.a",
          undefined,
          "Only the people you invite, at the access level you give them. Each event is walled off, external vendors see only their own scope, and the audit log records every view and change.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.weddings-private-events.faqs.1.q",
          undefined,
          "Does this work at a remote estate with no cell coverage?",
        ),
        a: t(
          "marketing.industriesContent.weddings-private-events.faqs.1.a",
          undefined,
          "Yes. COMPVSS is offline-first. Check-ins, punches, and time punches queue on the device and sync when crews get back into coverage. The build does not pause for the signal.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.weddings-private-events.faqs.2.q",
          undefined,
          "We are a twelve-person company. Is this built for teams our size?",
        ),
        a: t(
          "marketing.industriesContent.weddings-private-events.faqs.2.a",
          undefined,
          "Yes. Most private-event production companies run lean and hire in per build. The core team lives in the app, and per-event crew and vendors join with scoped access for just that project.",
        ),
      },
    ],
  }),
  "government-municipal": (e, t) => ({
    ...e,
    name: t("marketing.industriesContent.government-municipal.name", undefined, "Government & Municipal"),
    tagline: t(
      "marketing.industriesContent.government-municipal.tagline",
      undefined,
      "Civic events, public festivals, emergency coordination",
    ),
    description: t(
      "marketing.industriesContent.government-municipal.description",
      undefined,
      "For city event offices, parks departments, and the agencies behind public festivals. COMPVSS schedules staff and volunteers per zone, tracks permits against the event record, files incidents with time and location for the after-action report, and puts emergency procedures on every worker's phone.",
    ),
    hero: {
      eyebrow: t("marketing.industriesContent.government-municipal.hero.eyebrow", undefined, "Government & Municipal"),
      title: t(
        "marketing.industriesContent.government-municipal.hero.title",
        undefined,
        "A Public Event Is a Public Record.",
      ),
      body: t(
        "marketing.industriesContent.government-municipal.hero.body",
        undefined,
        "A street festival answers to more agencies than any private show: permits, public safety, after-action review. COMPVSS documents the operation as it happens, from volunteer check-in to the last incident report, so the record writes itself.",
      ),
    },
    stats: [
      {
        value: "1 tap",
        label: t("marketing.industriesContent.government-municipal.stats.0.label", undefined, "incident documented"),
      },
      {
        value: "GPS",
        label: t("marketing.industriesContent.government-municipal.stats.1.label", undefined, "on every field report"),
      },
      {
        value: "Offline",
        label: t(
          "marketing.industriesContent.government-municipal.stats.2.label",
          undefined,
          "works on the parade route",
        ),
      },
      {
        value: "100%",
        label: t(
          "marketing.industriesContent.government-municipal.stats.3.label",
          undefined,
          "of changes in the audit log",
        ),
      },
    ],
    outcomes: [
      t(
        "marketing.industriesContent.government-municipal.outcomes.0",
        undefined,
        "Schedule staff and volunteers per zone with check-in at the perimeter",
      ),
      t(
        "marketing.industriesContent.government-municipal.outcomes.1",
        undefined,
        "Permit records tracked against the event, visible to every lead",
      ),
      t(
        "marketing.industriesContent.government-municipal.outcomes.2",
        undefined,
        "Incident reports carry timestamp, GPS, photo, and reporter for the after-action file",
      ),
      t(
        "marketing.industriesContent.government-municipal.outcomes.3",
        undefined,
        "Emergency procedures published to every worker's phone before gates",
      ),
      t(
        "marketing.industriesContent.government-municipal.outcomes.4",
        undefined,
        "Daily logs that stand up as the operational record",
      ),
      t(
        "marketing.industriesContent.government-municipal.outcomes.5",
        undefined,
        "Every change lands in an immutable audit log, exportable for records requests",
      ),
    ],
    modules: [
      {
        name: t(
          "marketing.industriesContent.government-municipal.modules.0.name",
          undefined,
          "Staff & Volunteer Scheduling",
        ),
        body: t(
          "marketing.industriesContent.government-municipal.modules.0.body",
          undefined,
          "Zone-based shifts for employees and volunteers alike, with confirmations and coverage view.",
        ),
      },
      {
        name: t("marketing.industriesContent.government-municipal.modules.1.name", undefined, "Permits"),
        body: t(
          "marketing.industriesContent.government-municipal.modules.1.body",
          undefined,
          "Permit register tied to the event: issuer, window, conditions, and expiry visible to every lead.",
        ),
      },
      {
        name: t("marketing.industriesContent.government-municipal.modules.2.name", undefined, "Incidents"),
        body: t(
          "marketing.industriesContent.government-municipal.modules.2.body",
          undefined,
          "Field reports with automatic time, location, and photo capture. Routing per severity and zone.",
        ),
      },
      {
        name: t("marketing.industriesContent.government-municipal.modules.3.name", undefined, "Emergency Guides"),
        body: t(
          "marketing.industriesContent.government-municipal.modules.3.body",
          undefined,
          "Evacuation routes, contact trees, and procedures delivered per role. Updated once, current everywhere.",
        ),
      },
    ],
    faqs: [
      {
        q: t(
          "marketing.industriesContent.government-municipal.faqs.0.q",
          undefined,
          "Can volunteers who are not city employees use the app?",
        ),
        a: t(
          "marketing.industriesContent.government-municipal.faqs.0.a",
          undefined,
          "Yes. Volunteers join the event with scoped access: their shift, their zone, their check-in, and the emergency guide. They never touch staff scheduling or internal records.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.government-municipal.faqs.1.q",
          undefined,
          "Will the records satisfy an after-action review or a records request?",
        ),
        a: t(
          "marketing.industriesContent.government-municipal.faqs.1.a",
          undefined,
          "The operational record is built for exactly that. Incident reports carry timestamp, GPS, photo, and reporter. Every change is in an immutable audit log, and logs export cleanly.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.government-municipal.faqs.2.q",
          undefined,
          "Can we pilot this on a single event before a wider procurement?",
        ),
        a: t(
          "marketing.industriesContent.government-municipal.faqs.2.a",
          undefined,
          "Yes. Most agencies start with one festival or one season. A single-event pilot exercises the full system, and the data carries forward if you expand. Contact us about procurement paperwork; we have done it before.",
        ),
      },
    ],
  }),
  "education-campus": (e, t) => ({
    ...e,
    name: t("marketing.industriesContent.education-campus.name", undefined, "Education & Campus"),
    tagline: t(
      "marketing.industriesContent.education-campus.tagline",
      undefined,
      "University events, campus productions, student crews",
    ),
    description: t(
      "marketing.industriesContent.education-campus.description",
      undefined,
      "For campus events offices and student production crews: commencement, orientation week, athletics support, performing arts. COMPVSS schedules student workers around class blocks, verifies clock-ins at venues across campus, and turns the day-of guide into training a first-timer can follow.",
    ),
    hero: {
      eyebrow: t("marketing.industriesContent.education-campus.hero.eyebrow", undefined, "Education & Campus"),
      title: t(
        "marketing.industriesContent.education-campus.hero.title",
        undefined,
        "Your Crew Graduates Every Four Years.",
      ),
      body: t(
        "marketing.industriesContent.education-campus.hero.body",
        undefined,
        "A campus events office rebuilds its workforce every semester. COMPVSS gives student crews a schedule on their phone, a guide that teaches the job, and a clock-in that proves they showed up, so institutional knowledge stops walking out at commencement.",
      ),
    },
    stats: [
      {
        value: "GPS",
        label: t(
          "marketing.industriesContent.education-campus.stats.0.label",
          undefined,
          "verified clock-in, campus-wide",
        ),
      },
      {
        value: "1 tap",
        label: t("marketing.industriesContent.education-campus.stats.1.label", undefined, "incident to campus safety"),
      },
      {
        value: "Offline",
        label: t("marketing.industriesContent.education-campus.stats.2.label", undefined, "works in the field house"),
      },
      {
        value: "0",
        label: t("marketing.industriesContent.education-campus.stats.3.label", undefined, "paper timesheets"),
      },
    ],
    outcomes: [
      t(
        "marketing.industriesContent.education-campus.outcomes.0",
        undefined,
        "Schedule student crews around class blocks, with swaps handled in the app",
      ),
      t(
        "marketing.industriesContent.education-campus.outcomes.1",
        undefined,
        "Geo-verified clock-in at venues across campus",
      ),
      t(
        "marketing.industriesContent.education-campus.outcomes.2",
        undefined,
        "Day-of guides double as training for first-time crew members",
      ),
      t(
        "marketing.industriesContent.education-campus.outcomes.3",
        undefined,
        "Incident reports route to campus safety with location attached",
      ),
      t(
        "marketing.industriesContent.education-campus.outcomes.4",
        undefined,
        "Equipment checkout from the campus inventory, tracked per student",
      ),
      t(
        "marketing.industriesContent.education-campus.outcomes.5",
        undefined,
        "Room-turn punch lists for the spaces that host four events a day",
      ),
    ],
    modules: [
      {
        name: t("marketing.industriesContent.education-campus.modules.0.name", undefined, "Student Crew Scheduling"),
        body: t(
          "marketing.industriesContent.education-campus.modules.0.body",
          undefined,
          "Shifts that respect class schedules. Swap requests and confirmations happen in the app.",
        ),
      },
      {
        name: t("marketing.industriesContent.education-campus.modules.1.name", undefined, "Time & Attendance"),
        body: t(
          "marketing.industriesContent.education-campus.modules.1.body",
          undefined,
          "Geo-verified punches at every campus venue. Timesheets export for student payroll.",
        ),
      },
      {
        name: t("marketing.industriesContent.education-campus.modules.2.name", undefined, "Asset Checkout"),
        body: t(
          "marketing.industriesContent.education-campus.modules.2.body",
          undefined,
          "Cameras, radios, and AV gear checked out per student. End of semester shows what is still out.",
        ),
      },
      {
        name: t("marketing.industriesContent.education-campus.modules.3.name", undefined, "Guides"),
        body: t(
          "marketing.industriesContent.education-campus.modules.3.body",
          undefined,
          "Per-role day-of guides written once, reused every semester. The training is in the pocket.",
        ),
      },
    ],
    faqs: [
      {
        q: t(
          "marketing.industriesContent.education-campus.faqs.0.q",
          undefined,
          "Half our crew is new every semester. How fast can they start?",
        ),
        a: t(
          "marketing.industriesContent.education-campus.faqs.0.a",
          undefined,
          "A student joins from an invite, sees their shifts, and reads the role guide on their phone. Most crews are working their first event the same week. The guide carries the training load a veteran used to.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.education-campus.faqs.1.q",
          undefined,
          "Can we run many small events at once across campus?",
        ),
        a: t(
          "marketing.industriesContent.education-campus.faqs.1.a",
          undefined,
          "Yes. Each event is its own project with its own schedule and log. One office view rolls up coverage across every venue, from the black box theater to the field house.",
        ),
      },
      {
        q: t(
          "marketing.industriesContent.education-campus.faqs.2.q",
          undefined,
          "How do student hours get to payroll?",
        ),
        a: t(
          "marketing.industriesContent.education-campus.faqs.2.a",
          undefined,
          "Punches are geo-verified per venue, supervisors approve timesheets in the app, and approved hours export in formats campus payroll systems accept. No paper cards to chase down at month end.",
        ),
      },
    ],
  }),
};

/**
 * Localized view of INDUSTRIES[slug]. Structure (slugs, related lists, stat
 * figures) rides through from the data file; prose resolves through the
 * catalog and falls back to the verbatim English copy.
 */
export function localizeIndustry(slug: string, t: Translator): IndustryConfig | undefined {
  const e = INDUSTRIES[slug];
  if (!e) return undefined;
  const loc = LOCALIZERS[slug];
  return loc ? loc(e, t) : e;
}
