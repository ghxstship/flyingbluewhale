import type { ExperienceTier } from "./types";

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
      "Physical-tier experiences are in-person, real-environment, real-object — the default tier for the majority of GHXSTSHIP work. Essentially every service except those exclusively serving Digital, Virtual, or Theatrical.",
    anchoredServices: [],
  },
  {
    number: "05",
    slug: "experiential",
    name: "Experiential",
    definition:
      "Experiential-tier experiences are designed for transformative engagement — multi-sensory, narrative-rich, participatory, or otherwise designed to create memory and emotion beyond what physical-tier delivers. Most GHXSTSHIP brand activations, festivals, and immersive work operate here.",
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
