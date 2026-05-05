// Miami HEAT × Agora — Pop-Up Activation Program
// Standardized proposal template, hydrated for the HEAT pop-up program at the
// East Plaza inside Kaseya Center. Investment model: monthly baseline retainer
// + per-activation tier menu (Small / Medium / Large), each with a base
// execution price and a fully customized ceiling. All ranges are buildout-only.

export type Money = number; // dollars

export type TierId = "small" | "medium" | "large";

export type ActivationTier = {
  id: TierId;
  num: string; // "01"
  name: string; // "Small"
  size: string; // footprint summary
  duration: string; // run-time
  base: Money; // base execution price
  ceiling: Money; // fully customized ceiling
  precedents: string[]; // reference activations (Uber Eats, Abercrombie, etc.)
  narrative: string; // what's in scope at this tier
  included: { name: string; desc: string }[];
  customization: { name: string; desc: string }[];
};

export type ScopeNode = {
  id: string;
  num: string;
  kind: "Components" | "Services";
  name: string;
  sub: string;
  narrative: string;
  appliesTo: ("small" | "medium" | "large")[];
};

export type LifecyclePhase = {
  id: string;
  num: string;
  name: string;
  intent: string;
  milestones: string[];
  deliverables: string[];
  gate: string;
};

export const HEAT_THEME = {
  primary: "#98002E", // Heat Red
  secondary: "#000000", // Heat Black
  accent: "#F9A01B", // Heat Yellow / fire
  paper: "#FAF7F2",
  ink: "#0A0A0A",
};

export const HEAT_DOC = {
  client: "Miami HEAT",
  clientLong: "Miami HEAT Basketball Club, LLC",
  producer: "Agora",
  producerLong: "Agora Visuals",
  contactClient: "Michael",
  contactProducer: "mike@agoravisuals.com",
  venue: "East Plaza · Kaseya Center",
  city: "Miami, FL",
  docNumber: "AGORA-HEAT-001",
  version: "v1.1 — May 4, 2026",
  validity: "Valid for thirty (30) calendar days from the version date.",
  retainerCommitment: "12 months · auto-renewing",
  programWindow: "26–27 NBA season activation cycle",
  paymentDepositPct: 60,
  paymentBalancePct: 40,
};

// ─────────────────────────────────────────────────────────────────────────
// Retainer Tiers — Base / Elevated / Premium
// Benchmarked against fabrication-house, production-house, and print-house
// retainer models. Each tier is a cumulative superset: Elevated includes
// Base, Premium includes Elevated + exclusive access lines.
// ─────────────────────────────────────────────────────────────────────────

export type RetainerTier = {
  id: "base" | "elevated" | "premium";
  num: string;
  name: string;
  price: Money; // monthly
  pitch: string; // one-line positioning
  fitFor: string; // who this tier is for
  features: { name: string; detail: string }[];
  exclusive?: { name: string; detail: string }[]; // not available à la carte
};

export const HEAT_RETAINER_TIERS: RetainerTier[] = [
  {
    id: "base",
    num: "01",
    name: "Base",
    price: 5000,
    pitch: "Studio On Standby.",
    fitFor: "1–4 activations per year · partner-led briefs · single-tier work",
    features: [
      {
        name: "Dedicated Producer",
        detail: "Single point of contact across HEAT marketing, partner brands, and venue ops.",
      },
      {
        name: "Response SLA · 24 Business Hours",
        detail: "Inbound brief or ad-hoc request acknowledged within one business day.",
      },
      { name: "8 Studio Hours / Month", detail: "Pooled concept + project-management hours, rolling over 30 days." },
      {
        name: "Brand Asset Library",
        detail: "HEAT palette + partner-brand color-match library maintained year-round.",
      },
      {
        name: "1 Revision Round Per Activation",
        detail: "One design-intent revision included before lock; further rounds billable.",
      },
      {
        name: "Priority Queue · Tier 3",
        detail: "Retained accounts jump ahead of non-retained work in the shop schedule.",
      },
      {
        name: "Asset Storage · 1 Pallet",
        detail: "Climate-controlled hold for one pallet of reusable structural / signage elements.",
      },
      {
        name: "Activation Buildout Discount · 5%",
        detail: "Five percent off list pricing on every per-activation buildout.",
      },
    ],
  },
  {
    id: "elevated",
    num: "02",
    name: "Elevated",
    price: 8000,
    pitch: "Operating Tempo.",
    fitFor: "5–10 activations per year · multi-partner cadence · homestand rhythm",
    features: [
      { name: "Everything In Base, Plus →", detail: "Cumulative — Elevated inherits the full Base tier." },
      {
        name: "Response SLA · 8 Business Hours",
        detail: "Inbound brief or ad-hoc request acknowledged within one working day window.",
      },
      {
        name: "16 Studio Hours / Month",
        detail: "Pooled concept + PM hours, rolling over 60 days; doubles Base allocation.",
      },
      {
        name: "2 Revision Rounds Per Activation",
        detail: "Two design-intent revisions included; further rounds billable.",
      },
      {
        name: "1 Concept Board / Quarter",
        detail: "Off-cycle ideation board on a HEAT-chosen brief — fully unbilled.",
      },
      { name: "Priority Queue · Tier 2", detail: "Elevated jumps ahead of Base-retained and non-retained work alike." },
      {
        name: "Asset Storage · 4 Pallets",
        detail: "Climate-controlled hold for four pallets; reuse credits stack per deployment.",
      },
      {
        name: "Activation Buildout Discount · 8%",
        detail: "Eight percent off list pricing on every per-activation buildout.",
      },
      {
        name: "Quarterly Business Review",
        detail: "Senior-producer-led QBR with utilization, asset reuse, and forward-look.",
      },
    ],
  },
  {
    id: "premium",
    num: "03",
    name: "Premium",
    price: 10000,
    pitch: "Strategic Partner.",
    fitFor: "11+ activations per year · season-defining program · embedded creative cadence",
    features: [
      { name: "Everything In Elevated, Plus →", detail: "Cumulative — Premium inherits the full Elevated tier." },
      {
        name: "Response SLA · 4 Business Hours",
        detail: "Inbound brief acknowledged within four hours; 24 / 7 on-call during activation windows.",
      },
      { name: "28 Studio Hours / Month", detail: "Pooled concept + PM hours, rolling over the full quarter." },
      {
        name: "Unlimited Design Revisions",
        detail: "Within three working sessions per activation — no per-round billing.",
      },
      {
        name: "2 Concept Boards / Quarter",
        detail: "Off-cycle ideation boards on HEAT-chosen briefs — fully unbilled.",
      },
      {
        name: "Priority Queue · Tier 1",
        detail: "VIP queue — Premium accounts hold first call on shop slots and crew.",
      },
      {
        name: "Asset Storage · 12 Pallets + Dedicated Rack",
        detail: "Climate-controlled hold for twelve pallets plus a labeled HEAT-only rack.",
      },
      {
        name: "Activation Buildout Discount · 12%",
        detail: "Twelve percent off list pricing on every per-activation buildout.",
      },
      {
        name: "Monthly Executive Review",
        detail: "Monthly EBR with senior producer + creative director — agenda set by HEAT.",
      },
    ],
    exclusive: [
      {
        name: "White-Glove On-Site PM",
        detail: "Senior producer on site for every activation install + strike at no surcharge.",
      },
      {
        name: "Embedded Creative Director",
        detail: "4 hours / month of creative-director strategy access — concept, palette, treatment direction.",
      },
      {
        name: "First-Look On New Capabilities",
        detail: "Early access to Agora's signature techniques + R&D builds before they're offered to other accounts.",
      },
      {
        name: "Annual Brand Workshop",
        detail: "Day-long off-site planning workshop at Agora's facility — invited stakeholders only.",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Optional Add-Ons & Upgrades — overlay-able on any retainer tier OR any
// activation buildout. Categorized for legibility.
// ─────────────────────────────────────────────────────────────────────────

export type AddonCategory = "material" | "functional" | "service" | "logistics" | "documentation";

export type Addon = {
  id: string;
  name: string;
  category: AddonCategory;
  body: string;
  price: string; // formatted; ranges, rates, or flat
  appliesTo: "retainer" | "activation" | "both";
  tierMin?: "small" | "medium" | "large"; // minimum activation tier required
};

export const HEAT_ADDONS: Addon[] = [
  // MATERIAL & FINISH UPGRADES (overlay on activation)
  {
    id: "chemetal",
    name: "Brushed-Steel Chemetal Cladding",
    category: "material",
    appliesTo: "activation",
    body: "Architectural brushed-steel surface treatment on hero faces. Adhesive-mounted to substrate, concealed seams. Premium finish that holds up across multi-week runs.",
    price: "$8,000 – $15,000",
  },
  {
    id: "tinted-mirror",
    name: "HEAT-Tinted Mirror Accent",
    category: "material",
    appliesTo: "activation",
    body: "Heat-red tinted mirror across hero accent surfaces — shop-cut, edge-polished, adhesive-mounted.",
    price: "$4,000 – $9,000",
  },
  {
    id: "stone-floor",
    name: "Premium Architectural Floor Insert",
    category: "material",
    appliesTo: "activation",
    tierMin: "medium",
    body: "Stone, terrazzo, or premium-tile insert at the activation footprint — anchors the moment as a destination.",
    price: "$12,000 – $28,000",
  },
  {
    id: "millwork-upgrade",
    name: "Premium Millwork Upgrade",
    category: "material",
    appliesTo: "activation",
    body: "Hardwood, premium laminate, or stained-veneer millwork in place of standard powder-coat / laminate finish.",
    price: "$6,000 – $18,000",
  },
  {
    id: "backlit-plexi",
    name: "Backlit Plexi Feature Wall",
    category: "material",
    appliesTo: "activation",
    tierMin: "small",
    body: "Edge-lit milk plexi feature panel with diffuser and concealed dimmable drivers — Heat-red or partner-brand-color.",
    price: "$7,000 – $14,000",
  },
  {
    id: "led-tower",
    name: "RGBW LED Tube Tower",
    category: "material",
    appliesTo: "activation",
    tierMin: "medium",
    body: "Programmable color-changing tower visible from the plaza approach — DMX-controlled.",
    price: "$9,000 – $16,000",
  },

  // FUNCTIONAL UPGRADES (overlay on activation)
  {
    id: "pos-retail",
    name: "Retail POS + Payment Integration Surrounds",
    category: "functional",
    appliesTo: "activation",
    tierMin: "medium",
    body: "Mounting + structural surrounds for HEAT- or partner-supplied POS hardware, fitting moments, and integrated payment terminals.",
    price: "$15,000 – $35,000",
  },
  {
    id: "customization-bar",
    name: "Customization Station",
    category: "functional",
    appliesTo: "activation",
    tierMin: "medium",
    body: "Engraving, embroidery, jersey customization, or print-on-demand workstation — partner brand-supplied equipment integrated into HEAT-styled millwork.",
    price: "$18,000 – $28,000",
  },
  {
    id: "photo-moment",
    name: "Touchscreen / Photo Capture Moment",
    category: "functional",
    appliesTo: "activation",
    body: "Integrated photo or content-capture moment with share-out QR / AirDrop wall.",
    price: "$12,000 – $22,000",
  },
  {
    id: "av-surround",
    name: "AV / Screen Array Surrounds",
    category: "functional",
    appliesTo: "activation",
    body: "Mounting structure + cable channeling for HEAT-supplied LED wall, projection, or large-format screen array.",
    price: "$8,000 – $18,000",
  },
  {
    id: "vip-lounge",
    name: "Hospitality / VIP Lounge Build",
    category: "functional",
    appliesTo: "activation",
    tierMin: "large",
    body: "Seating, bar surround, drink rail, and VIP curtain partition zone — requires Large activation footprint.",
    price: "$22,000 – $45,000",
  },
  {
    id: "container",
    name: "Container / Modular-Unit Architecture",
    category: "functional",
    appliesTo: "activation",
    tierMin: "large",
    body: "Shipping-container or modular-unit shell, fabricated and clad, freestanding on the plaza — flagship-grade signature pop-up.",
    price: "$45,000 – $85,000",
  },
  {
    id: "aerial",
    name: "Plaza-Canopy Aerial Banner Program",
    category: "functional",
    appliesTo: "activation",
    body: "Aircraft-cable-rigged banner program against the East Plaza canopy — projection-mapping option available.",
    price: "$8,000 – $16,000",
  },

  // SERVICE OVERLAYS (retainer or activation)
  {
    id: "extra-concept",
    name: "Additional Concept Hours",
    category: "service",
    appliesTo: "both",
    body: "Concept and creative-direction time beyond the retainer allocation, billed at studio rate.",
    price: "$250 / hour",
  },
  {
    id: "extra-pm",
    name: "Additional PM Hours",
    category: "service",
    appliesTo: "both",
    body: "Project management and coordination time beyond the retainer allocation.",
    price: "$185 / hour",
  },
  {
    id: "express",
    name: "Express Turnaround Surcharge",
    category: "service",
    appliesTo: "activation",
    body: "Compresses standard production timeline by ~40 %; overrides any tier discount.",
    price: "+20 % on activation",
  },
  {
    id: "standby-crew",
    name: "Dedicated Standby Crew",
    category: "service",
    appliesTo: "activation",
    body: "On-site Agora crew on standby through the activation window for refresh, repair, or partner asks.",
    price: "$4,800 / day",
  },
  {
    id: "concept-leadout",
    name: "Creative Concept Lead-Out",
    category: "service",
    appliesTo: "activation",
    body: "When partner-brand support is light, Agora leads creative concept and design development end-to-end.",
    price: "$12,000 – $28,000",
  },
  {
    id: "asset-buildout",
    name: "Brand Asset Library Buildout",
    category: "service",
    appliesTo: "retainer",
    body: "One-time intake to digitize and catalog HEAT + recurring partner brand assets, palette swatches, and approved creative.",
    price: "$6,000 – $12,000",
  },
  {
    id: "color-match",
    name: "Custom Color-Match Library",
    category: "service",
    appliesTo: "retainer",
    body: "One-time setup of certified color-match library against signed brand-standard references.",
    price: "$2,500 (one-time)",
  },
  {
    id: "lockup",
    name: "Sponsor Co-Branding Lockup Development",
    category: "service",
    appliesTo: "activation",
    body: "Develops a HEAT-x-partner co-branding lockup, including approval routing through both brands.",
    price: "$4,000 – $9,000",
  },

  // LOGISTICS
  {
    id: "out-of-miami",
    name: "Out-Of-Miami Crew Travel",
    category: "logistics",
    appliesTo: "activation",
    body: "Travel and lodging billed at cost with receipts as a single pass-through line if non-Miami crew is required.",
    price: "At cost",
  },
  {
    id: "extra-storage",
    name: "Asset Storage Expansion",
    category: "logistics",
    appliesTo: "retainer",
    body: "Climate-controlled storage beyond the retainer allocation, billed monthly.",
    price: "$400 / pallet / month",
  },

  // DOCUMENTATION
  {
    id: "photo-doc",
    name: "Install Photo / Video Documentation",
    category: "documentation",
    appliesTo: "activation",
    body: "Time-lapse and finished-state photo / video capture of every install, edited deliverables within five business days.",
    price: "$3,500 / activation",
  },
  {
    id: "recap-deck",
    name: "Post-Activation Analytics + Recap Deck",
    category: "documentation",
    appliesTo: "activation",
    body: "Foot-traffic, dwell, and engagement-flag report plus a finished recap deck for sponsor reporting.",
    price: "$4,500 / activation",
  },
];

export const ADDON_CATEGORY_LABELS: Record<AddonCategory, string> = {
  material: "Material & Finish",
  functional: "Functional Upgrades",
  service: "Service Overlays",
  logistics: "Logistics",
  documentation: "Documentation & Reporting",
};

// ─────────────────────────────────────────────────────────────────────────
// 8-Phase Production Lifecycle — universal across all proposals.
// ─────────────────────────────────────────────────────────────────────────

export const HEAT_LIFECYCLE: LifecyclePhase[] = [
  {
    id: "discovery",
    num: "01",
    name: "Discovery & Brief",
    intent: "Activation kickoff, brand intake, plaza walkthrough, and stakeholder roster.",
    milestones: [
      "Activation brief intake from HEAT marketing partnerships",
      "Sponsor / partner brand asset request issued",
      "East Plaza walkthrough with HEAT operations + venue ops",
      "Stakeholder roster locked (HEAT, partner brand, venue, Agora)",
    ],
    deliverables: ["Signed Activation Brief", "Working Production Timeline", "Approval Routing"],
    gate: "Brief Approved → advance to Concept & Design",
  },
  {
    id: "concept",
    num: "02",
    name: "Concept & Design",
    intent: "Creative direction, material sampling, and HEAT / partner palette match.",
    milestones: [
      "Creative direction workshop with HEAT marketing + partner brand",
      "Material sampling — paint, plexi, chemetal, mirror, print substrates",
      "HEAT palette colour-matching against signed brand standards",
      "Design intent boards reviewed and signed off",
    ],
    deliverables: ["Design Intent Boards", "Material Sample Pack (signed off)", "Palette Match Approved"],
    gate: "Design Intent Approved → advance to Engineering & Documentation",
  },
  {
    id: "engineering",
    num: "03",
    name: "Engineering & Documentation",
    intent: "CAD shop drawings, structural calcs, electrical schematics, venue compliance package.",
    milestones: [
      'CAD shop drawings to .25" tolerance issued for review',
      "Structural calculations stamped",
      "Electrical schematics for plexi / LED / screen integration drafted",
      "Venue compliance package — fire-marshal, COIs, plaza load",
    ],
    deliverables: ["Full Engineering Package", "Permit-Ready Drawing Set", "Certificate of Insurance"],
    gate: "Drawings Signed Off → advance to Pre-Production & Procurement",
  },
  {
    id: "preprod",
    num: "04",
    name: "Pre-Production & Procurement",
    intent: "Material POs, vendor onboarding, print proofs, and deposit clearance.",
    milestones: [
      "Material purchase orders issued",
      "Print pre-press proofs colour-managed and approved",
      "Vendor onboarding complete (W-9, COI, payment terms)",
      "60% deposit invoiced and received",
    ],
    deliverables: ["Approved Print Proofs", "Confirmed Material POs", "Deposit Cleared Receipt"],
    gate: "Print Proofs Approved + Deposit Cleared → advance to Fabrication & Print",
  },
  {
    id: "fabrication",
    num: "05",
    name: "Fabrication & Print",
    intent: "Shop build of every fabricated element plus large-format print and in-shop QC.",
    milestones: [
      "Shop build start — millwork, plexi, mirror, signage, structure",
      "Large-format print production — SEG, vinyl, banners, panels",
      "Sub-assembly fit-up and finish review in shop",
      "In-shop QC against signed proofs and material samples",
    ],
    deliverables: ["All Fabricated Elements Complete", "All Printed Elements Complete", "QC Sign-Off Report"],
    gate: "Final QC Sign-Off → advance to Logistics & Transport",
  },
  {
    id: "logistics",
    num: "06",
    name: "Logistics & Transport",
    intent: "Crating, freight to Kaseya Center, climate-controlled hold, and on-site delivery.",
    milestones: [
      "Crating and dunnage complete; manifest issued",
      "Freight dispatched to East Plaza loading dock with GPS tracking",
      "Inbound at venue — receiving inventory check against manifest",
      "40% balance invoiced — due 5 business days prior to load-in",
    ],
    deliverables: ["All Elements Received At Venue", "Inventory Reconciliation Report", "Damage / Exception Log"],
    gate: "All Elements Received & Inventoried → advance to Install & Activation",
  },
  {
    id: "install",
    num: "07",
    name: "Install & Activation",
    intent: "Plaza load-in, install crew on-site, final dressing, walkthrough, run-of-show coverage.",
    milestones: [
      "Plaza load-in begins (overnight window — non-game-day default)",
      "Structure framing, panel mount, SEG install, dimensional signage, vinyl",
      "Final dressing pass and electrical commissioning",
      "HEAT / partner walkthrough and punch-list close",
      "Activation window opens — PM coverage active",
    ],
    deliverables: ["Fully Installed Activation", "Punch List Closed", "Walkthrough Sign-Off", "Active PM Coverage"],
    gate: "HEAT / Partner Walkthrough Sign-Off → activation window opens",
  },
  {
    id: "strike",
    num: "08",
    name: "Strike & Closeout",
    intent: "Post-activation de-install, return freight, asset reconciliation, and final invoicing.",
    milestones: [
      "Strike triggered on activation window close",
      "De-mount structure, panel removal, vinyl strip, plaza restoration",
      "Outbound freight to shop with manifest and condition report",
      "Asset hold / re-deployment decision in coordination with HEAT",
      "Final invoice and post-event reconciliation",
    ],
    deliverables: ["Plaza Restored", "Assets Returned to Shop or Designated Storage", "Final Invoice & Reconciliation"],
    gate: "Final Reconciliation → activation closed",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// 11-Node Scope Taxonomy — applies across all activation tiers; tier defines
// breadth and finish level, not which nodes are touched.
// ─────────────────────────────────────────────────────────────────────────

export const HEAT_TAXONOMY: ScopeNode[] = [
  // FABRICATION & PRINT
  {
    id: "structure",
    num: "01",
    kind: "Components",
    name: "Environmental Structure & Millwork",
    sub: "Modular Walls · Custom Millwork · Display Fixtures · Structural Engineering",
    narrative:
      "Structural backbone of every HEAT activation — modular wall systems, custom millwork in HEAT palette, retail-grade display fixtures, and the engineering package that clears Kaseya Center venue ops review.",
    appliesTo: ["small", "medium", "large"],
  },
  {
    id: "lighting",
    num: "02",
    kind: "Components",
    name: "Illuminated & Lighting Features",
    sub: "Backlit Plexi · LED Light Channels · Edge-Lit Signage · Fixture Lighting",
    narrative:
      "Backlit plexi feature panels, programmable LED channels carrying the HEAT red / yellow cue, edge-lit dimensional signage, and retail fixture lighting tuned to the plaza's ambient color temperature.",
    appliesTo: ["small", "medium", "large"],
  },
  {
    id: "print",
    num: "03",
    kind: "Components",
    name: "Large-Format Print & Graphics",
    sub: "SEG · Vinyl · Banners · Window Wraps · Floor Graphics",
    narrative:
      "All large-format print — silicone-edge graphics, applied vinyl, banners, window wraps, floor graphics. HEAT-supplied creative; Agora handles file prep, palette match, proofing, and production.",
    appliesTo: ["small", "medium", "large"],
  },
  {
    id: "signage",
    num: "04",
    kind: "Components",
    name: "Dimensional & Applied Signage",
    sub: "HEAT Crests · Partner Lockups · Vinyl Lettering · Wayfinding",
    narrative:
      "Dimensional HEAT and partner brand crests at .5″–1″ depth, applied vinyl lettering, retail wayfinding, and plaza-specific operational signage.",
    appliesTo: ["small", "medium", "large"],
  },
  {
    id: "finishes",
    num: "05",
    kind: "Components",
    name: "Surface Finishes & Architectural Treatment",
    sub: "Brushed Steel · Tinted Mirror · Paint Program · Soft Goods",
    narrative:
      "Brushed-steel cladding for hero walls, tinted mirror accents in HEAT red, federation-kit paint program tying every fabricated element together, and partner-branded soft goods where called for.",
    appliesTo: ["medium", "large"],
  },
  {
    id: "transport-hw",
    num: "06",
    kind: "Components",
    name: "Transport & Staging Hardware",
    sub: "Custom Road Cases · Crating · Dunnage · Reusable Packing",
    narrative:
      "Custom road cases for plexi, mirror, dimensional crests, and electronics — built once, reused across every install / strike cycle in the activation program.",
    appliesTo: ["small", "medium", "large"],
  },
  // PRODUCTION SERVICES
  {
    id: "design",
    num: "07",
    kind: "Services",
    name: "Design & Engineering",
    sub: "CAD · Shop Drawings · Material Sampling · Pre-Pro PM",
    narrative:
      "Pre-production engineering and creative coordination — CAD shop drawings to .25″ tolerance, palette sampling against the HEAT and partner brand standards, weekly working sessions through Print Proof Approval.",
    appliesTo: ["small", "medium", "large"],
  },
  {
    id: "logistics",
    num: "08",
    kind: "Services",
    name: "Logistics & Transport",
    sub: "Round-Trip Trucking · Rigging Hardware · Climate-Controlled Hold",
    narrative:
      "Dedicated trucking from the Agora fabrication facility to the East Plaza loading dock and back, with climate-controlled hold during the activation window and post-strike asset hold pending re-deployment.",
    appliesTo: ["small", "medium", "large"],
  },
  {
    id: "install",
    num: "09",
    kind: "Services",
    name: "Install Labor",
    sub: "Install Crew · Lead Supervision · Specialty Trades · Commissioning",
    narrative:
      "Sized install crew for each activation — structure framing, panel mounting, SEG install, dimensional signage, vinyl application, final dressing, and a post-handover commissioning pass with HEAT and partner reps.",
    appliesTo: ["small", "medium", "large"],
  },
  {
    id: "strike",
    num: "10",
    kind: "Services",
    name: "Strike & De-Install Labor",
    sub: "Strike Crew · Lead Supervision · Outbound Pack · Plaza Restoration",
    narrative:
      "Strike crew triggered on activation window close — de-mount, panel removal, vinyl strip, plaza restoration, and a clean handover walkthrough with HEAT and venue ops.",
    appliesTo: ["small", "medium", "large"],
  },
  {
    id: "pm",
    num: "11",
    kind: "Services",
    name: "Project Management & Client Services",
    sub: "Senior Producer · Activation-Window Coverage · Change Orders · Reconciliation",
    narrative:
      "Dedicated senior producer from contract execution through closeout — single point of contact for HEAT marketing, partner brand, venue ops, and trades. Activation-window coverage handles ad-hoc requests and any in-window creative refresh.",
    appliesTo: ["small", "medium", "large"],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Activation Tiers — Small / Medium / Large
// Each tier has a base execution price and a fully customized ceiling.
// All ranges are buildout-only per HEAT direction (May 3, 2026 email).
// ─────────────────────────────────────────────────────────────────────────

export const HEAT_TIERS: ActivationTier[] = [
  {
    id: "small",
    num: "01",
    name: "Small",
    size: "10×10 to 15×15 footprint · single-wall vignette or merch alcove",
    duration: "1 day to 1 week run · 24-hr install / 24-hr strike",
    base: 48000,
    ceiling: 58000,
    precedents: ["Uber Eats × 49ers · Sourdough Sam"],
    narrative:
      "A single hero moment — branded back-wall vignette, two display fixtures, integrated SEG, dimensional signage, and lighting. Ideal for a partner unlock, single-night activation, or seasonal merch drop on the East Plaza concourse.",
    included: [
      {
        name: "Modular Hero Wall (10–15 LF)",
        desc: "Self-supporting modular wall in HEAT palette with cleated mounting for inserts. Ballast plates so no plaza penetration is required.",
      },
      {
        name: "SEG Hero Graphic",
        desc: "Silicone-edge graphic on aluminum frame, 9oz tension fabric, partner creative.",
      },
      { name: "Dimensional Signage Set", desc: ".5″ dimensional HEAT or partner crest plus wayfinding." },
      { name: "2 Display Fixtures", desc: "Powder-coated steel + laminate display tables or merch shelves." },
      {
        name: "Integrated Lighting Pack",
        desc: "Fixture spotlighting + perimeter LED accent strip on dimmable driver.",
      },
      { name: "Cut Vinyl & Floor Decals", desc: "Applied environmental graphics, queue-line decals, brand markers." },
      { name: "2-Person Install / Strike", desc: "Overnight install + same-day strike, lead supervisor on site." },
      { name: "Round-Trip Freight & Hold", desc: "Local Miami freight + climate-controlled hold across the run." },
      { name: "PM & Coordination", desc: "Single producer point of contact, brief intake through reconciliation." },
    ],
    customization: [
      {
        name: "Premium Vinyl & Print Substrates",
        desc: "Upgraded film and SEG fabric stock for crisper finish and longer dwell.",
      },
      {
        name: "Dimensional Crest Upgrade (1″ depth)",
        desc: "Heavier-depth signage with edge-painted return for hero presence.",
      },
      { name: "Extended Lighting Run", desc: "Doubles the integrated LED accent footprint with secondary driver." },
    ],
  },
  {
    id: "medium",
    num: "02",
    name: "Medium",
    size: "15×20 to 30×20 footprint · freestanding kiosk with multi-side branding",
    duration: "1 to 4 week run · overnight install / overnight strike",
    base: 115000,
    ceiling: 125000,
    precedents: ["Abercrombie × NFL", "Lululemon × Wimbledon", "Dolphins × New Era Draft Party"],
    narrative:
      "A self-contained brand environment — three- or four-sided kiosk with integrated retail, service counter, and full lighting program. Built for multi-week runs through a homestand or playoff push, with content surfaces on every face.",
    included: [
      {
        name: "Modular Kiosk Structure",
        desc: "Three- or four-sided modular kiosk, 8–10ft tall, HEAT palette powder coat, ballast or floor plates.",
      },
      {
        name: "SEG Hero + Side Graphics",
        desc: "Multiple SEG faces with HEAT and partner creative, replaceable mid-run for refresh moments.",
      },
      {
        name: "Custom Millwork Counter",
        desc: "Branded service / customization counter with concealed storage and integrated lighting.",
      },
      { name: "Backlit Plexi Feature Panel", desc: "Edge-lit milk plexi with diffuser and dimmable drivers." },
      {
        name: "Dimensional Signage Suite",
        desc: "HEAT and partner crests, dimensional logo block, edge-lit secondary signage.",
      },
      {
        name: "Display Fixtures (4–6)",
        desc: "Mix of tables, shelving, garment racks, and product display vignettes.",
      },
      {
        name: "Lighting Package",
        desc: "RGBW LED light rails, fixture spotlighting, dimmable from a single controller.",
      },
      {
        name: "Cut Vinyl, Banners & Floor Graphics",
        desc: "Full environmental treatment across kiosk and adjacent floor plane.",
      },
      {
        name: "4-Person Install Crew (3 days)",
        desc: "Install with lead supervision plus electrician for power drop and LED commissioning.",
      },
      { name: "4-Person Strike (1 day)", desc: "Strike crew with lead supervision and outbound pack." },
      { name: "Round-Trip Freight & Hold", desc: "Trucking + climate-controlled hold across the run." },
      {
        name: "PM & Coordination",
        desc: "Senior producer coverage from brief through reconciliation, including in-window standby.",
      },
    ],
    customization: [
      {
        name: "Premium Powder-Coat & Finish Pack",
        desc: "Two-tone HEAT-palette finish with bespoke clear coat for premium fit-and-finish.",
      },
      {
        name: "Mid-Run Graphic Refresh (1×)",
        desc: "Single in-window SEG / vinyl refresh tied to a milestone game or partner moment.",
      },
      {
        name: "Extended Lighting + DMX Controller",
        desc: "Adds RGBW programmability across the full kiosk perimeter.",
      },
    ],
  },
  {
    id: "large",
    num: "03",
    name: "Large",
    size: "40×40+ footprint · multi-zone activation, full retail buildout, or signature pop-up",
    duration: "2-week to season-long run · 3–5 day install / 2-day strike",
    base: 285000,
    ceiling: 295000,
    precedents: ["Mitchell & Ness × Legacy", "Sol de Janeiro × Sephora", "New Era Container Shop", "Gisou Pop-Up"],
    narrative:
      "A signature plaza takeover — multi-zone retail, immersive brand environment, or full pop-up that anchors the East Plaza across a homestand, playoff window, or season-long sponsorship moment. Architectural backbone with the full lighting and print program; major architectural and retail systems available as Add-Ons.",
    included: [
      {
        name: "Multi-Zone Structural System",
        desc: "40×40+ footprint with 2–4 distinct activation zones, free-standing architecture, integrated structural engineering.",
      },
      {
        name: "Hero Architectural Wall",
        desc: "Brushed-steel chemetal or premium clad hero wall, dimensional logo system, integrated lighting.",
      },
      {
        name: "Backlit Plexi Wall System",
        desc: "Multi-panel illuminated plexi system, programmable LED, dimmable from single controller.",
      },
      {
        name: "Custom Millwork Retail System",
        desc: "Full retail-grade millwork — counters, gondolas, display walls, fitting moments, fixturing.",
      },
      {
        name: "Dimensional Signage Program",
        desc: "Hero dimensional logos, secondary signage, edge-lit treatments, partner brand lockups.",
      },
      { name: "SEG Graphics Suite", desc: "8+ SEG faces across the activation, mid-run refresh capacity built in." },
      {
        name: "Cut Vinyl + Floor Graphics + Banners",
        desc: "Full environmental treatment across walls, floor, and overhead canopy.",
      },
      {
        name: "RGBW Lighting & Fixture Lighting",
        desc: "Programmable color-changing rails, fixture spotlighting, perimeter rope light.",
      },
      {
        name: "Custom Road Cases (full kit)",
        desc: "Foam-lined custom road cases for every fragile element, reusable across program.",
      },
      {
        name: "6-Person Install Crew (5 days)",
        desc: "Full install crew with lead fabricator supervision, licensed electrician, and certified rigger.",
      },
      {
        name: "5-Person Strike Crew (2 days)",
        desc: "Strike with lead supervision, plaza restoration, and outbound pack.",
      },
      {
        name: "Round-Trip Freight & Climate Hold",
        desc: "Two-truck freight + climate-controlled hold, post-strike asset hold.",
      },
      {
        name: "Senior PM & Activation Coverage",
        desc: "Senior producer plus on-call window coverage across the activation window.",
      },
    ],
    customization: [
      {
        name: "Premium Powder-Coat & Architectural Finish Pack",
        desc: "Two-tone HEAT-palette + matte black accent program with edge-painting and clear coat.",
      },
      {
        name: "Mid-Run Graphic Refresh (2×)",
        desc: "Two in-window SEG / vinyl refresh passes tied to milestone games or partner moments.",
      },
      {
        name: "Extended Programmable Lighting",
        desc: "DMX controller with three preset states + perimeter rope light extension.",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Activation Sites — East Plaza zoning at Kaseya Center.
// ─────────────────────────────────────────────────────────────────────────

export const HEAT_SITES = [
  {
    tag: "01",
    name: "East Plaza · Concourse Approach",
    body: "Primary fan-arrival zone with covered canopy and red illuminated discs overhead. Footprint flexes from a single 10×10 vignette to a 40×40+ multi-zone takeover. Power drops along the south column line.",
  },
  {
    tag: "02",
    name: "East Plaza · Bayfront Edge",
    body: "Bayfront-facing strip with railing views and natural light. Ideal for medium kiosks, photo moments, and partner unveils. Limited overhead ceiling — favors freestanding rather than ceiling-suspended elements.",
  },
  {
    tag: "03",
    name: "East Plaza · Center Court Hub",
    body: "Centerline of the plaza, highest dwell density on game days. Best fit for medium-to-large activations, customization stations, or signature pop-up retail. AT&T East Plaza branded surrounds inform palette and clearance.",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Standard Exclusions + Terms — universal.
// ─────────────────────────────────────────────────────────────────────────

export const HEAT_EXCLUSIONS = [
  {
    term: "Talent & Hospitality",
    body: "Brand ambassadors, on-site staffing, hospitality F&B, and giveaway product are HEAT- or partner-direct unless explicitly added as a customization line.",
  },
  {
    term: "AV & Content Screens",
    body: "All TVs, LED walls, content screens, projection hardware, and AV cabling are HEAT- or partner-supplied. This proposal includes mounting, surrounds, and channeling only.",
  },
  {
    term: "Content Production",
    body: "Creative concept, video / motion content, photography, and social media production are not included. Agora produces against approved partner / HEAT creative supplied to spec.",
  },
  {
    term: "Venue Costs & Permits",
    body: "East Plaza access fees, fire-marshal application fees, plaza power use surcharges, and any venue-required deposits are HEAT-direct or pass-through at cost on written authorization.",
  },
  {
    term: "Talent Wardrobe (default)",
    body: "Co-branded uniform runs and giveaway product are not in the base tier price; available as a customization line item with quoted lead time.",
  },
  {
    term: "Travel & Per-Diem",
    body: "If installs require non-Miami crew, travel and lodging billed at cost with receipts as a single Travel Pass-Through change order.",
  },
];

export const HEAT_TERMS = [
  {
    section: "1",
    title: "Acceptance & Execution",
    body: "Execution of this proposal authorizes Agora to commence engineering, material procurement, and shop fabrication for the active activation cycle. Execution may be effected via wet signature or the embedded digital signature interface; each is legally equivalent. This proposal is valid for thirty (30) calendar days from the version date.",
  },
  {
    section: "2",
    title: "Scope & Change Orders",
    body: "Any modification to scope, creative, dimensions, material specification, delivery schedule, or production timeline after written approval requires a formally executed Change Order signed by both parties. Verbal approvals do not constitute binding authorization. Change Orders are invoiced separately and do not alter the base investment unless expressly stated.",
  },
  {
    section: "3",
    title: "Payment Terms",
    body: "Baseline retainer billed monthly, due net-15. Per-activation engagements: 60% deposit due upon written approval of the activation Statement of Work, 40% balance due five (5) business days prior to load-in. Payment via ACH or domestic wire. Late payments accrue interest at 1.5% per month.",
  },
  {
    section: "4",
    title: "Creative Approvals & Brand Assets",
    body: "HEAT and partner brand assets, creative direction, and approved palettes are supplied by HEAT marketing partnerships. Agora fabricates and prints to supplied creative. Final creative must be delivered by the Print Proof Approval milestone in each activation's Workback Schedule. Late asset delivery may shift downstream milestones without relief of payment obligations.",
  },
  {
    section: "5",
    title: "Venue, Permits & Insurance",
    body: "Agora provides general liability and workers' compensation coverage. Certificates of Insurance issued naming Miami HEAT, Kaseya Center, partner brand, and any required additional insureds on request. Venue fees, permits, fire-marshal charges, and any venue-required deposits are passed through at cost.",
  },
  {
    section: "6",
    title: "Cancellation & Force Majeure",
    body: "Cancellation for convenience: HEAT reimburses Agora for all work performed, materials procured, and non-cancellable commitments through the date of cancellation. Retainer covers monthly capacity already allocated and is not refundable on a partial-month basis. Force majeure events suspend the retainer with mutual written acknowledgment.",
  },
];

// Commercial mechanics only — material and service overlays live in HEAT_ADDONS.
export const HEAT_CHANGE_ORDERS = [
  {
    name: "Multi-Activation Discount",
    body: "When 3+ activations are committed within a single 30-day window, integrated production and freight efficiencies reduce per-activation buildout by 8–12%. Stacks on top of the retainer-tier discount.",
    price: "8–12% per activation",
  },
  {
    name: "Asset Re-Deployment Credit",
    body: "Reuse of structural, signage, or millwork elements across activations within the program credits 30–50% of original fabrication cost back against the next deployment.",
    price: "30–50% credit per deployment",
  },
  {
    name: "Volume Print Tier",
    body: "Annual print volume commitment unlocks Bronze / Silver / Gold print tier pricing across SEG, vinyl, banners, and floor graphics — applied to every activation in the program.",
    price: "Up to 15% off list",
  },
  {
    name: "Activation Window Refresh Block",
    body: "Pre-purchased block of mid-window creative refresh passes (SEG / vinyl / applied signage) that can be drawn down across the season at locked unit pricing.",
    price: "Pack of 5 · $18,000",
  },
];

export const HEAT_PHASE_DEADLINES = {
  discovery: "T − 10 weeks",
  concept: "T − 8 weeks",
  engineering: "T − 6 weeks",
  preprod: "T − 4 weeks",
  fabrication: "T − 2 weeks",
  logistics: "T − 5 days",
  install: "T − 1 day (overnight)",
  strike: "T + close (post-window)",
} as const;

export const HEAT_PHASE_DEADLINES_SMALL = {
  discovery: "T − 4 weeks",
  concept: "T − 3 weeks",
  engineering: "T − 2 weeks",
  preprod: "T − 10 days",
  fabrication: "T − 1 week",
  logistics: "T − 2 days",
  install: "T − 1 day (overnight)",
  strike: "T + close",
} as const;

export function fmtMoney(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

export function fmtRange(base: number, ceiling: number): string {
  return `${fmtMoney(base)} – ${fmtMoney(ceiling)}`;
}
