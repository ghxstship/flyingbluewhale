/**
 * Demo splinter personas — tuned variants of /demo for paid-traffic landing.
 * Each persona tightens hero copy, social proof, and form framing to a
 * specific buyer. Used by /demo and /demo/[persona].
 */

export type DemoPersona = {
  slug: string;
  buyer: string;
  hero: string;
  subhero: string;
  outcomes: string[];
  modules: string[];
  faqs: Array<{ q: string; a: string }>;
};

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    slug: "festival",
    buyer: "Festival Operators",
    hero: "Run Your Festival On One Platform.",
    subhero:
      "Advancing, gate scan, finance, procurement, KBYG guides — for festival operators running 15k+ guest gates with multi-stage advancing.",
    outcomes: [
      "Sub-100ms offline gate scan across multiple gates simultaneously",
      "Per-stage advancing with set times, riders, hospitality",
      "Direct vendor payouts on PO fulfillment",
      "Per-persona KBYG — guest, crew, artist, vendor",
      "Per-org pricing — every stakeholder beyond your team is free",
    ],
    modules: ["ticketing", "advancing", "schedule", "guides", "procurement", "safety"],
    faqs: [
      {
        q: "How many gates can the scanner handle?",
        a: "We've run 15k-guest festivals across multiple gates with concurrent scanning, sub-100ms, offline-queued. The bottleneck is your network, not us.",
      },
      {
        q: "Do artists need a seat?",
        a: "No. Artists open a portal link scoped to their advancing. They never count against your seat math.",
      },
    ],
  },
  {
    slug: "touring",
    buyer: "Touring Production",
    hero: "Touring, On Modern Rails.",
    subhero:
      "Per-stop advancing, day sheets, hotel blocks, ground transport, ROS, per-diem — touring ops in one platform with portals for venues, vendors, drivers.",
    outcomes: [
      "Per-stop advancing with 16 typed deliverable types",
      "Day sheets that publish to the portal — no PDF chains",
      "Hotel blocks reconcile against live crew roster",
      "Per-diem auto-calculates per city × day, flows into payroll",
      "Driver portal with run manifest + POD upload",
    ],
    modules: ["advancing", "logistics", "schedule", "finance", "portals"],
    faqs: [
      {
        q: "How is this different from Master Tour?",
        a: "Cloud-native, real portals, offline mobile, AI assistant, per-org pricing. Master Tour's muscle memory is real; if you're picking fresh, picking modern matters.",
      },
      {
        q: "Can our drivers use it?",
        a: "Yes. Each driver gets a portal link scoped to their runs — view manifest, upload POD, mark complete. No account creation.",
      },
    ],
  },
  {
    slug: "fabrication",
    buyer: "Fabrication + Scenic",
    hero: "Build Shop, Show Calls.",
    subhero:
      "RFIs, submittals, punch lists, change orders, equipment tracking — construction-grade workflow primitives, tuned for event-production velocity.",
    outcomes: [
      "Ball-in-court RFIs with show-day clock speed",
      "Submittal log with reviewer routing and version history",
      "Punch list with photo evidence and show-ready gate",
      "Change orders that write to budget on approval",
      "Equipment + fabrication order tracking across the season",
    ],
    modules: ["procore-parity", "inspections", "production", "procurement", "photos"],
    faqs: [
      {
        q: "Are you a Procore replacement?",
        a: "For event-production timelines, yes. For permanent construction with BIM and 12+ month timelines, no — Procore is right for that.",
      },
      {
        q: "Can subs use it?",
        a: "Yes. Subs onboard through the vendor portal with COI and W-9. POs route through approval, payouts go direct.",
      },
    ],
  },
  {
    slug: "corporate",
    buyer: "Brand + Corporate Activations",
    hero: "Activations, Same Day Closing.",
    subhero:
      "Proposals signed in place, deposits invoiced on accept, advancing through one portal — brand activations from RFP to recap.",
    outcomes: [
      "Interactive proposals — scroll, accept, sign in place",
      "Stripe checkout fires the deposit on accept",
      "Client portal with branded proposal + advancing",
      "Vendor portal with COIs, POs, payouts",
      "Recap PDF auto-bundles photos + budget on wrap",
    ],
    modules: ["proposals", "portals", "finance", "procurement", "photos"],
    faqs: [
      {
        q: "Is the accept signature binding?",
        a: "It captures IP, timestamp, typed name, version. Consistent with US ESIGN Act standards. Talk to your counsel on specifics.",
      },
      {
        q: "Can clients see only their proposal?",
        a: "Yes. Per-project branded portal scoped by RLS. Your other clients never appear.",
      },
    ],
  },
];

export const DEMO_PERSONAS_BY_SLUG = Object.fromEntries(DEMO_PERSONAS.map((p) => [p.slug, p]));
