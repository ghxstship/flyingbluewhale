import type { ProposalBlock } from "@/lib/proposals/types";

export const SAMPLE_PROPOSAL_BLOCKS: ProposalBlock[] = [
  {
    type: "hero",
    eyebrow: "Production proposal",
    title: "Open Air — Hialeah",
    subtitle: "Miami Music Week 2026 · Partnership proposal",
    partners: ["Black Coffee", "Hialeah Park", "flyingbluewhale"],
    narrative: "A turnkey production engagement to deliver Open Air at the Racetrack — 15,000 guests, three stages, and full advancing support.",
    meta: [
      { label: "Document", value: "FBW-2026-001" },
      { label: "Location", value: "Hialeah Park Casino" },
      { label: "Dates", value: "Mar 28, 2026" },
      { label: "Version", value: "v1.0" },
    ],
  },
  { type: "section_eyebrow", label: "Engagement overview" },
  {
    type: "overview_cards",
    cards: [
      { tag: "Phase 1", title: "Discovery & design", details: [{ label: "Duration", value: "2 weeks" }, { label: "Cost", value: "$18,000" }] },
      { tag: "Phase 2", title: "Advance & build", details: [{ label: "Duration", value: "6 weeks" }, { label: "Cost", value: "$122,000" }] },
      { tag: "Phase 3", title: "Show & wrap", details: [{ label: "Duration", value: "2 weeks" }, { label: "Cost", value: "$64,000" }] },
    ],
  },
  { type: "section_eyebrow", label: "Scope of work" },
  {
    type: "phase",
    num: 1,
    name: "Discovery & creative direction",
    tag: "Phase 1",
    narrative: "Align on the creative brief, venue constraints, and programming. Deliverables shipped via the flyingbluewhale advancing portal.",
    core: [
      { name: "Creative direction workshop", desc: "Two-day workshop, 6 stakeholders", price: { cents: 800000 } },
      { name: "Site walkthrough & venue docs", desc: "Photo survey, dims, power map", price: { cents: 400000 } },
      { name: "Program treatment", desc: "Artist flow, transitions, moments", price: { cents: 600000 } },
    ],
    addons: [
      { id: "discovery-brand", name: "Brand refresh for the run-of-show", price: { cents: 250000 } },
      { id: "discovery-teaser", name: "Teaser capture for marketing", price: { cents: 180000 } },
    ],
    gate: {
      title: "Gate · approval to advance",
      items: ["Creative brief signed", "Venue scope confirmed", "Budget envelope acknowledged"],
      unlocks: "Phase 2 — Advancing",
    },
    contractRefs: ["S2", "S6.2"],
  },
  {
    type: "phase",
    num: 2,
    name: "Advance & build",
    tag: "Phase 2",
    narrative: "All artist advancing, equipment pull lists, and vendor onboarding. Technical package wired through the GVTEWAY portal.",
    core: [
      { name: "Artist advancing", desc: "Riders, input lists, stage plots, catering, travel", price: { cents: 1800000 } },
      { name: "Vendor onboarding", desc: "COIs, W-9s, Stripe Connect payouts", price: { cents: 800000 } },
      { name: "Equipment pull + logistics", desc: "Rentals, trucking, staging", price: { cents: 6200000 } },
    ],
    addons: [
      { id: "advance-rehearsal", name: "Off-site rehearsal day", price: { cents: 600000 } },
      { id: "advance-broadcast", name: "Broadcast capture rigging", price: { cents: 1400000 } },
    ],
    gate: {
      title: "Gate · approved to pull",
      items: ["Signed vendor contracts", "Advancing deliverables approved", "Ship-to-site confirmed"],
      unlocks: "Phase 3 — Show week",
    },
    contractRefs: ["S3", "S7"],
  },
  {
    type: "phase",
    num: 3,
    name: "Show week & wrap",
    tag: "Phase 3",
    narrative: "Run-of-show execution, real-time comms via flyingbluewhale mobile, post-show reconciliation.",
    core: [
      { name: "Show-week production", desc: "Load-in through curfew", price: { cents: 5200000 } },
      { name: "Guest check-in & ticketing", desc: "Mobile PWA, geo-verified crew clock", price: { cents: 400000 } },
      { name: "Post-show wrap", desc: "Reconciliation, recap, invoicing", price: { cents: 800000 } },
    ],
    gate: {
      title: "Gate · final acceptance",
      items: ["Load-out complete", "Invoices reconciled", "Recap delivered"],
    },
    contractRefs: ["S9", "S12"],
  },
  { type: "section_eyebrow", label: "Journey" },
  {
    type: "journey",
    steps: [
      { num: 1, title: "Kickoff", status: "Week 0", description: "Creative workshop + venue walkthrough" },
      { num: 2, title: "Creative lock", status: "Week 2", description: "Brief signed; approved to advance" },
      { num: 3, title: "Advancing", status: "Week 4", description: "Riders, pull lists, onboarding" },
      { num: 4, title: "Rehearsal", status: "Week 6", description: "Off-site run-through" },
      { num: 5, title: "Load-in", status: "Week 8", description: "On-site build + tech" },
      { num: 6, title: "Show", status: "Week 8", description: "Doors + program" },
      { num: 7, title: "Wrap", status: "Week 9", description: "Recon + recap" },
      { num: 8, title: "Closeout", status: "Week 10", description: "Final invoicing, retrospective" },
    ],
  },
  { type: "section_eyebrow", label: "Investment" },
  {
    type: "investment_table",
    groups: [
      {
        label: "Phase 1 · Discovery",
        items: [
          { name: "Creative direction workshop", price: { cents: 800000 } },
          { name: "Site walkthrough & venue docs", price: { cents: 400000 } },
          { name: "Program treatment", price: { cents: 600000 } },
        ],
      },
      {
        label: "Phase 2 · Advance & build",
        items: [
          { name: "Artist advancing", price: { cents: 1800000 } },
          { name: "Vendor onboarding", price: { cents: 800000 } },
          { name: "Equipment pull + logistics", price: { cents: 6200000 } },
        ],
      },
      {
        label: "Phase 3 · Show & wrap",
        items: [
          { name: "Show-week production", price: { cents: 5200000 } },
          { name: "Guest check-in & ticketing", price: { cents: 400000 } },
          { name: "Post-show wrap", price: { cents: 800000 } },
        ],
      },
    ],
    total: { cents: 17000000 },
    taxNote: "Plus applicable taxes. Add-ons priced separately on approval.",
  },
  { type: "total_block", label: "Total engagement", amount: { cents: 17000000 }, note: "All figures in USD." },
  { type: "engagement_split", depositPercent: 25, balancePercent: 75, depositLabel: "Due on signature", balanceLabel: "Due 30 days before show" },
  {
    type: "payment_method",
    method: "ach",
    details: {
      "Beneficiary": "flyingbluewhale Inc.",
      "Bank": "Mercury",
      "Routing (ACH)": "084106768",
      "Account": "wire on request",
      "Reference": "FBW-2026-001",
    },
  },
  { type: "section_eyebrow", label: "Technical production" },
  {
    type: "equipment_manifest",
    items: [
      { name: "Pioneer DJM-A9 mixer", quantity: 2, vendor: "Pioneer DJ" },
      { name: "Pioneer CDJ-3000 player", quantity: 4, vendor: "Pioneer DJ" },
      { name: "Chauvet Rogue R2 Wash", quantity: 48, vendor: "Chauvet Professional" },
      { name: "ETC Ion Xe console", quantity: 1, vendor: "ETC" },
      { name: "Shure AD4Q RF receivers", quantity: 4, vendor: "Shure" },
      { name: "L-Acoustics K2 line array", quantity: 24, vendor: "L-Acoustics" },
    ],
  },
  { type: "section_eyebrow", label: "Change orders" },
  {
    type: "change_orders",
    items: [
      { name: "Broadcast capture", description: "5-camera multi-cam capture, livestream feed.", price: { cents: 1400000 } },
      { name: "VIP cabana activation", description: "Additional VIP build on the apron level.", price: { cents: 900000 } },
    ],
  },
  { type: "section_eyebrow", label: "Exclusions" },
  {
    type: "exclusions",
    items: [
      { term: "Travel", body: "Travel and lodging are billed at cost with receipts." },
      { term: "Permits", body: "Venue permits, noise variances, and alcohol licensing are client-direct." },
      { term: "Weather contingencies", body: "Rain-plan infrastructure sized on approval." },
    ],
  },
  { type: "section_eyebrow", label: "Terms" },
  {
    type: "terms_grid",
    items: [
      { section: "S2", title: "Scope", body: "Work as set forth in this proposal; change orders on approval." },
      { section: "S6", title: "Payment", body: `${25}% deposit on signature, balance 30 days before the event.` },
      { section: "S9", title: "Cancellation", body: "Sliding refund schedule by milestone; deposit non-refundable after creative lock." },
      { section: "S12", title: "Indemnification", body: "Mutual indemnification per the MSA." },
    ],
  },
  {
    type: "legal_panel",
    panels: [
      { slug: "msa", label: "Master Services Agreement", body: "MSA placeholder — replace with full text or a signed link." },
      { slug: "terms", label: "Terms & conditions", body: "Standard terms placeholder." },
      { slug: "privacy", label: "Privacy", body: "Privacy policy placeholder." },
    ],
  },
  {
    type: "signature_block",
    parties: [
      { role: "Client", name: "— to be completed —" },
      { role: "Producer", name: "flyingbluewhale Inc.", email: "producer@flyingbluewhale.app" },
    ],
    instructions: "Sign below to accept this engagement. An e-sign receipt with reference hash is emailed on completion.",
  },
];
