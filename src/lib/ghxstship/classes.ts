import type { XtcClass } from "./types";

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
