/**
 * Event Kit taxonomy — the canonical, brand-agnostic class + tier vocabulary.
 *
 * Relocated from the retired `src/lib/ghxstship/` cosmic-marketing namespace
 * (kit v4 legacy purge); the data is core own-brand IP consumed by the Event
 * Kit Framework (`./index.ts`). Append-only: codes/numbers never change.
 */

// ── Class codebook (ten append-only classes) ───────────────────────────────
export type ClassCode = "0000" | "1000" | "2000" | "3000" | "4000" | "5000" | "6000" | "7000" | "8000" | "9000";

export type ClassSlug =
  | "executive"
  | "creative"
  | "talent"
  | "marketing"
  | "build"
  | "production"
  | "operations"
  | "experience"
  | "hospitality"
  | "technology";

export interface XtcClass {
  code: ClassCode;
  slug: ClassSlug;
  name: string;
  /** Plain-English label used in chrome (e.g. "Executive", "Build"). */
  shortName: string;
  /** Class definition paragraph from the catalog. */
  definition: string;
  /** Optional roadmap note where the catalog flags one. */
  roadmapNote?: string;
}

/**
 * The XTC Class Codebook v1.0 — ten append-only classes locked across both
 * internal Collections and the external XTC Protocol. Codes never change;
 * sustainability and similar emerging dimensions enter as cross-cutting tags.
 */
export const CLASSES: XtcClass[] = [
  {
    code: "0000",
    slug: "executive",
    name: "0000 Executive",
    shortName: "Executive",
    definition:
      "Executive services govern the strategic, financial, legal, HR, and business-development envelope around a project. This is the class that protects the work — permits, insurance, compliance, governance, agreements, and post-event closure.",
  },
  {
    code: "1000",
    slug: "creative",
    name: "1000 Creative",
    shortName: "Creative",
    definition:
      "Creative services govern brand, design, art direction, content, and intellectual property — the imagination layer that gives a production its identity and voice.",
    roadmapNote:
      "Light current population is a roadmap signal. This is where service expansion most increases catalog completeness.",
  },
  {
    code: "2000",
    slug: "talent",
    name: "2000 Talent",
    shortName: "Talent",
    definition:
      "Talent services govern performers, programming, and rider fulfillment — the on-stage and on-camera human resources that draw audiences. Lightweight in current v1.0; talent-handling services like rider fulfillment and travel appear under their primary classes (8000 Hospitality, 6000 Operations) with cross-class tags.",
  },
  {
    code: "3000",
    slug: "marketing",
    name: "3000 Marketing",
    shortName: "Marketing",
    definition:
      "Marketing services govern social, PR, press, sponsorship sales, and CRM — the audience-facing layer that drives demand, builds relationships, and captures stewardship data.",
    roadmapNote: "Underweighted in v1.0. Highest-priority expansion class for a brand-activation-heavy book.",
  },
  {
    code: "4000",
    slug: "build",
    name: "4000 Build",
    shortName: "Build",
    definition:
      "Build services govern site operations, scenic fabrication, and physical installation — the class that makes the experience physically real. Class 4000 absorbs what previous schemas split between Site Ops, Scenic Fab, and Construction.",
  },
  {
    code: "5000",
    slug: "production",
    name: "5000 Production",
    shortName: "Production",
    definition:
      "Production services govern audio, lighting, video, staging, rigging, power, and special effects — the systems that produce the show. Production is the deepest class in unit economics and the one with the most cross-dependencies into 4000 Build and 9000 Technology.",
  },
  {
    code: "6000",
    slug: "operations",
    name: "6000 Operations",
    shortName: "Operations",
    definition:
      "Operations services govern event ops, labor, logistics, transport, security, medical, and workplace — the human and logistical spine of every project. Class 6000 absorbs what previous schemas split between Workplace, Travel & Accommodations, and Labor.",
  },
  {
    code: "7000",
    slug: "experience",
    name: "7000 Experience",
    shortName: "Experience",
    definition:
      "Experience services govern guest experience, activations, retail/merchandise, and sponsorship fulfillment — the moments where the guest meets the brand. Class 7000 is what was previously split between Hospitality (guest-facing) and Retail (transactional).",
  },
  {
    code: "8000",
    slug: "hospitality",
    name: "8000 Hospitality",
    shortName: "Hospitality",
    definition:
      "Hospitality services govern food and beverage, bar programs, catering, lodging, and VIP experience — the human-comfort and culinary layer of every project.",
  },
  {
    code: "9000",
    slug: "technology",
    name: "9000 Technology",
    shortName: "Technology",
    definition:
      "Technology services govern IT, networking, RF, ticketing, and AR/VR — the digital and connectivity infrastructure that increasingly underwrites every modern activation.",
    roadmapNote:
      "Underweighted in v1.0. Expansion class as ticketing platforms, AR overlays, and on-site data capture grow.",
  },
];

export const CLASS_BY_CODE = Object.fromEntries(CLASSES.map((c) => [c.code, c])) as Record<XtcClass["code"], XtcClass>;
export const CLASS_BY_SLUG = Object.fromEntries(CLASSES.map((c) => [c.slug, c])) as Record<XtcClass["slug"], XtcClass>;

// ── Tiers of experience (modality classification) ──────────────────────────
export type TierNumber = "01" | "02" | "03" | "04" | "05" | "06";
export type TierSlug = "social" | "digital" | "virtual" | "physical" | "experiential" | "theatrical";

export interface ExperienceTier {
  number: TierNumber;
  slug: TierSlug;
  name: string;
  definition: string;
  /** Service catalog numbers anchored to this tier. */
  anchoredServices: number[];
}

/**
 * Six Tiers of Experience — modality classification of the deliverable.
 * Theatrical replaced International in v1.0; geographic scope is now a
 * project-level attribute, not a tier.
 */
export const TIERS: ExperienceTier[] = [
  {
    number: "01",
    slug: "social",
    name: "Social",
    definition:
      "Social-tier experiences are content-led — designed primarily to generate, capture, or activate social conversation. The experience is the content, often produced for distribution beyond the in-person audience.",
    anchoredServices: [21, 30, 31, 47, 66, 77, 109, 113],
  },
  {
    number: "02",
    slug: "digital",
    name: "Digital",
    definition:
      "Digital-tier experiences are screen-mediated — broadcast, livestream, IPTV, e-commerce extension, app-driven activations, and digital-first programming.",
    anchoredServices: [10, 12, 13, 17, 29, 31, 36, 66, 72, 74, 75, 94, 100],
  },
  {
    number: "03",
    slug: "virtual",
    name: "Virtual",
    definition:
      "Virtual-tier experiences are immersive computer-generated — VR, AR, headset-driven, metaverse-style, or fully simulated environments.",
    anchoredServices: [12, 72, 75],
  },
  {
    number: "04",
    slug: "physical",
    name: "Physical",
    definition:
      "Physical-tier experiences are in-person, real-environment, real-object — the default tier for the majority of work. Essentially every service except those exclusively serving Digital, Virtual, or Theatrical.",
    anchoredServices: [],
  },
  {
    number: "05",
    slug: "experiential",
    name: "Experiential",
    definition:
      "Experiential-tier experiences are designed for transformative engagement — multi-sensory, narrative-rich, participatory, or otherwise designed to create memory and emotion beyond what physical-tier delivers. Most brand activations, festivals, and immersive work operate here.",
    anchoredServices: [16, 18, 19, 21, 26, 28, 49, 51, 70, 71, 72, 75, 76, 84, 96, 113, 114],
  },
  {
    number: "06",
    slug: "theatrical",
    name: "Theatrical",
    definition:
      "Theatrical-tier experiences follow theatre conventions — narrative arc, defined audience and performer roles, stage and house separation, cued show flow. Theatrical replaced International in v1.0.",
    anchoredServices: [
      8, 9, 10, 11, 13, 14, 20, 37, 43, 44, 48, 50, 51, 52, 56, 60, 71, 73, 74, 91, 94, 95, 96, 100, 104, 108, 112,
    ],
  },
];

export const TIER_BY_NUMBER = Object.fromEntries(TIERS.map((t) => [t.number, t])) as Record<
  ExperienceTier["number"],
  ExperienceTier
>;
export const TIER_BY_SLUG = Object.fromEntries(TIERS.map((t) => [t.slug, t])) as Record<
  ExperienceTier["slug"],
  ExperienceTier
>;
