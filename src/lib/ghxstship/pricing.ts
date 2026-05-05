/**
 * GHXSTSHIP commercial framework — two engagement models, both layered.
 *
 * **Per-Project**: a fee schedule attached to a single brief, locked at SOW.
 * Five tiers correlated to the APS level the work bottoms out at.
 *
 * **Retainer**: a continuous engagement with monthly capacity. Four tiers
 * correlated to how embedded the team is — from fractional advisory to
 * agency-of-record.
 *
 * **Add-ons** apply to either model. Sold a la carte at SOW or change-order.
 *
 * Numbers are starting fees, not ceilings — every engagement is bid against
 * the locked XPMS atom set. Production costs (gear, labor, travel, fab) pass
 * through at cost plus an agreed admin rate.
 */

export interface ProjectTier {
  slug: "pop" | "run" | "mainstage" | "marquee" | "federation";
  name: string;
  positioning: string;
  startingFee: string;
  apsBottom: string;
  scopeBand: string;
  /** What the fee covers — pre-pro through wrap, where applicable. */
  includes: string[];
  /** Featured solutions where this tier typically lands. */
  bestFor: string[];
  /** Service-catalog numbers that anchor this tier. */
  anchoredServices: number[];
  /** Voice line for the card. */
  bestLine: string;
  highlight?: boolean;
  cta: { label: string; href: string };
}

export const PROJECT_TIERS: ProjectTier[] = [
  {
    slug: "pop",
    name: "The Pop",
    positioning: "One-night activation. One zone. One brief.",
    startingFee: "$25K",
    apsBottom: "L4 Activation",
    scopeBand: "Single event, single zone, sub-200 guest count.",
    includes: [
      "Producer-led brief intake",
      "Site survey + technical recce",
      "Concept package + budget envelope",
      "Vendor curation + contracting",
      "On-site production lead, day-of",
      "Wrap report + asset library",
    ],
    bestFor: ["Brand Activations & Pop-ups", "Luxury Retail & Dining", "Corporate & Private Events"],
    anchoredServices: [1, 2, 16, 22, 23, 28, 30, 49, 84],
    bestLine: "Pitch on Friday. Doors on Tuesday. We've done worse timelines.",
    cta: { label: "Brief the Studio", href: "/ghxstship/contact" },
  },
  {
    slug: "run",
    name: "The Run",
    positioning: "Multi-day or multi-zone. Engineering, not just decor.",
    startingFee: "$75K",
    apsBottom: "L4 Activation across multiple L3 Zones",
    scopeBand: "Two-to-five-day event, mid-size build, 200–2,500 guest count.",
    includes: [
      "Everything in The Pop",
      "Stamped engineering where required",
      "MOT + crowd flow modeling",
      "Talent travel + hospitality logistics",
      "Show-call + cue programming",
      "Phase-gated SOW with change-order framework",
    ],
    bestFor: ["Conferences, Conventions & Trade Shows", "Theatrical Performances", "Health & Wellness Events"],
    anchoredServices: [4, 6, 8, 9, 10, 14, 22, 24, 50, 60, 71],
    bestLine: "Stamped drawings, signed MOT, real call sheets. The boring middle, fully owned.",
    highlight: true,
    cta: { label: "Brief the Studio", href: "/ghxstship/contact" },
  },
  {
    slug: "mainstage",
    name: "The Mainstage",
    positioning: "Festival, immersive build, heavyweight brand activation.",
    startingFee: "$250K",
    apsBottom: "L3 Zone master plan with L4 Activations and L5 Components",
    scopeBand: "Multi-stage festival, immersive build, 2,500–25,000 guest count.",
    includes: [
      "Everything in The Run",
      "Festival or multi-stage site master plan",
      "Custom fabrication + scenic build",
      "Projection mapping / AR / VR integration where briefed",
      "RFID credentialing + access control",
      "Sustainability brief + ESG measurement",
      "Dedicated production office on site",
    ],
    bestFor: ["Concerts, Festivals & Tours", "Immersive Experiences", "Amusement & Theme Parks"],
    anchoredServices: [17, 32, 51, 56, 65, 70, 71, 72, 96, 104, 110],
    bestLine: "The build that headlines the case study. Same XPMS atoms — turned all the way up.",
    cta: { label: "Brief the Studio", href: "/ghxstship/contact" },
  },
  {
    slug: "marquee",
    name: "The Marquee",
    positioning: "Multi-city tour. Mega-event spine. Recurring presence.",
    startingFee: "$750K",
    apsBottom: "L1 Project across L2 Events in multiple markets",
    scopeBand: "Tour, residency, or multi-city deployment with shared scenic + tech spine.",
    includes: [
      "Everything in The Mainstage",
      "Touring site adaptation + multi-city routing",
      "Modular touring scenic systems + asset storage",
      "Touring & mobile production office",
      "Tour bus / crew coach coordination",
      "Federation or host-city liaison where briefed",
      "Visa, immigration, ATA carnet management",
    ],
    bestFor: ["Concerts, Festivals & Tours", "Premium Sporting Experiences & Fan Zones", "Cruise Lines & Maritime"],
    anchoredServices: [40, 54, 55, 67, 87, 88, 99, 108, 112],
    bestLine: "One spine. Twelve cities. Every load-in inside the same plan.",
    cta: { label: "Brief the Studio", href: "/ghxstship/contact" },
  },
  {
    slug: "federation",
    name: "The Federation",
    positioning: "Mega-event, OCOG-scale, sanctioning-body posture.",
    startingFee: "Custom",
    apsBottom: "Multi-year L1 Project rolling through every phase, every class.",
    scopeBand: "Olympic House, Super Bowl rotation, FIFA WC, F1 GP, World Expo. Full XPMS deployment.",
    includes: [
      "Everything in The Marquee",
      "Federation + host-city accreditation",
      "Clean-zone enforcement + brand rights compliance",
      "Multi-year SOW with phase-gated escalation",
      "Embedded GHXSTSHIP producers + ATLVS deployment",
      "Source-available license option",
      "99.9% delivery SLA with on-call command",
    ],
    bestFor: [
      "Premium Sporting Experiences & Fan Zones",
      "Premium Experiences & Hospitality",
      "Cruise Lines & Maritime",
    ],
    anchoredServices: [62, 99, 100, 101, 111, 112, 113, 114],
    bestLine: "When the federation calls, the playbook is already on their desk.",
    cta: { label: "Talk to a Partner", href: "/ghxstship/contact" },
  },
];

export interface RetainerTier {
  slug: "coordinator" | "crew" | "studio" | "bureau";
  name: string;
  positioning: string;
  monthlyFee: string;
  team: string[];
  cadence: string;
  includes: string[];
  bestFor: string[];
  bestLine: string;
  highlight?: boolean;
  cta: { label: string; href: string };
}

/**
 * Retainer tiers — bundles built around team composition. Each step up adds
 * a senior role and a new layer of always-on support.
 *
 *   Coordinator  — Project Manager + Project Coordinator
 *   Crew         — adds Producer + Account Manager
 *   Studio       — adds Senior Producer + on-site Success
 *   Bureau       — adds 24/7 off-site Success / show-call command
 */
export const RETAINER_TIERS: RetainerTier[] = [
  {
    slug: "coordinator",
    name: "Coordinator",
    positioning: "Project Manager + Project Coordinator. Production hygiene, on a monthly cadence.",
    monthlyFee: "$3K / mo",
    team: ["Project Manager", "Project Coordinator"],
    cadence: "Weekly stand-up. Slack channel during business hours.",
    includes: [
      "Run-sheets, call sheets, and run-of-show maintenance",
      "Vendor follow-ups, COIs, and document control",
      "Budget tracking and spend reconciliation",
      "Permit feasibility checks and submissions",
      "RFP / proposal review and pushback",
    ],
    bestFor: ["Internal teams already producing in-house who need senior coordination overhead off the team"],
    bestLine: "The discipline behind the calendar. Nothing slips, nothing repeats.",
    cta: { label: "Start the Conversation", href: "/ghxstship/contact" },
  },
  {
    slug: "crew",
    name: "Crew",
    positioning: "Producer + Project Manager + Coordinator + Account Manager. Real ownership, end-to-end.",
    monthlyFee: "$5K / mo",
    team: ["Producer", "Project Manager", "Project Coordinator", "Account Manager"],
    cadence: "Weekly production stand-up. Account-level review monthly.",
    includes: [
      "Everything in Coordinator",
      "Producer-owned engagement, briefing through wrap",
      "Account Manager as your single point of contact",
      "Concept-to-build creative direction on smaller activations",
      "Vendor MSAs negotiated on your behalf",
      "Crew sourcing — stagehand, AV, hospitality, security",
    ],
    bestFor: [
      "Brand and event teams running four to eight activations per year",
      "Foundations and institutions in seasonal cycles",
    ],
    bestLine: "A producer with the calendar memorized and an account manager with your goals on a sticky note.",
    highlight: true,
    cta: { label: "Start the Conversation", href: "/ghxstship/contact" },
  },
  {
    slug: "studio",
    name: "Studio",
    positioning: "Senior Producer leading. On-site Success on every show day.",
    monthlyFee: "$8K / mo",
    team: ["Senior Producer", "Project Manager", "Project Coordinator", "Account Manager", "On-Site Success"],
    cadence: "Weekly stand-up. Daily during build week. On-site command on every show day.",
    includes: [
      "Everything in Crew",
      "Senior Producer leading multi-stakeholder engagements",
      "On-Site Success representative present every show day",
      "Touring or multi-city adaptation included",
      "Sustainability and ESG measurement built into every project",
      "Priority access to GHXSTSHIP fabrication and roster",
    ],
    bestFor: [
      "Brands running ongoing experiential programs",
      "Festivals running year-round on multiple stages",
      "Cultural institutions in capital-campaign mode",
    ],
    bestLine: "Senior producer at the briefing table. On-site lead under the tent.",
    cta: { label: "Talk to a Partner", href: "/ghxstship/contact" },
  },
  {
    slug: "bureau",
    name: "Bureau",
    positioning: "Senior team plus 24/7 off-site Success. Show-call command, federation posture, mega-event ready.",
    monthlyFee: "$13K / mo",
    team: [
      "Senior Producer",
      "Project Manager",
      "Project Coordinator",
      "Account Manager",
      "On-Site Success",
      "Off-Site Success (24/7)",
    ],
    cadence: "Daily during build. 24/7 command during show. Always-on Slack and phone.",
    includes: [
      "Everything in Studio",
      "Off-Site Success on call 24 / 7 — escalations, weather pivots, vendor failures",
      "Federation, host-city, and sanctioning-body liaison",
      "Show-call command with redundant comms and redundant cue stack",
      "Dedicated account success lead with a 99.9% delivery commitment",
      "ATLVS deployment with custom roles, SSO, and signed DPA",
    ],
    bestFor: [
      "Mega-event organizers and host-city committees",
      "Cruise lines and maritime operators",
      "Sanctioning-body and rights-holder engagements",
      "Multi-property hospitality groups",
    ],
    bestLine: "When the call comes at 3am, somebody picks up. With your run-of-show already open.",
    cta: { label: "Talk to a Partner", href: "/ghxstship/contact" },
  },
];

export interface AddOn {
  slug: string;
  name: string;
  description: string;
  /** "+ $X" or "+ X% / event" — keep short. */
  priceLine: string;
  /** Service-catalog references this add-on activates. */
  anchoredServices: number[];
}

export const ADD_ONS: AddOn[] = [
  {
    slug: "stamped-engineering",
    name: "Stamped Engineering",
    description: "PE-stamped structural, rigging, MOT, or pyro engineering signed in jurisdiction.",
    priceLine: "+ $8K – $35K / package",
    anchoredServices: [50, 60, 4, 6],
  },
  {
    slug: "federation-host-city-liaison",
    name: "Federation & Host-City Liaison",
    description:
      "FIFA, IOC, FIA, USOPC, NFL, NBA, MLB, NCAA accreditation. Clean-zone enforcement and brand-rights compliance.",
    priceLine: "+ $25K / event",
    anchoredServices: [112, 101, 100],
  },
  {
    slug: "maritime-uscg-imo",
    name: "Maritime / USCG / IMO Compliance",
    description: "Vessel safety drills, crew certs, SOLAS adherence, environmental compliance.",
    priceLine: "+ $20K base + $5K / sailing",
    anchoredServices: [111, 108],
  },
  {
    slug: "ar-vr-mapping-module",
    name: "AR / VR / Projection Mapping Module",
    description: "Spatial computing layer — mapping content, AR overlays, headset integration, on-site programming.",
    priceLine: "+ $30K – $250K / scope",
    anchoredServices: [72, 75],
  },
  {
    slug: "esg-sustainability-reporting",
    name: "ESG & Sustainability Reporting",
    description:
      "Pre-event impact study, on-site measurement, post-event ESG report ready for brand and sponsor circulation.",
    priceLine: "+ $12K / event",
    anchoredServices: [7, 65],
  },
  {
    slug: "touring-adaptation-package",
    name: "Touring Adaptation Package",
    description: "Multi-city venue adaptation matrix, modular scenic systems, advance schedule.",
    priceLine: "+ $40K base + per-stop",
    anchoredServices: [54, 67, 87],
  },
  {
    slug: "atlvs-deployment",
    name: "ATLVS Deployment",
    description: "The SaaS that runs us, deployed against your engagement. Custom roles, SSO, signed DPA.",
    priceLine: "+ $2K / mo / org",
    anchoredServices: [34, 61, 62],
  },
  {
    slug: "show-call-command",
    name: "Show-Call Command",
    description: "Calling-the-show producer with redundant comms, cue stack, and incident reporting protocol.",
    priceLine: "+ $4K / show day",
    anchoredServices: [14, 91, 63],
  },
  {
    slug: "asset-storage-refurbishment",
    name: "Asset Storage & Refurbishment",
    description: "Climate-controlled storage, condition tracking, refurbishment cycles for repeat deployment.",
    priceLine: "+ $1.50 / cu-ft / mo",
    anchoredServices: [55],
  },
  {
    slug: "source-available-license",
    name: "Source-Available License Mirror",
    description: "Source-available license to the XPMS-aligned ATLVS instance running your engagement.",
    priceLine: "+ Custom",
    anchoredServices: [],
  },
];
