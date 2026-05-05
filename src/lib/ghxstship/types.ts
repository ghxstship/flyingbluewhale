/**
 * GHXSTSHIP service catalog types — XPMS v1.0.
 *
 * Sourced verbatim from the locked v1.0 service catalog. The five orthogonal
 * axes (class, phase, APS level, tier, solution) plus geography are the
 * navigable primitives; every other surface in /ghxstship is a query into
 * this graph.
 */

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

export type ApsLevel = "L1" | "L2" | "L3" | "L4" | "L5" | "L6";

export type PhaseNumber = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08";
export type PhaseSlug = "discovery" | "concept" | "develop" | "advance" | "build" | "show" | "strike" | "wrap";

export type TierNumber = "01" | "02" | "03" | "04" | "05" | "06";
export type TierSlug = "social" | "digital" | "virtual" | "physical" | "experiential" | "theatrical";

export type SolutionSlug =
  | "concerts-festivals-tours"
  | "immersive-experiences"
  | "theatrical-performances"
  | "brand-activations-popups"
  | "art-cultural-installations"
  | "exotic-destinations"
  | "corporate-private-events"
  | "conferences-conventions-trade-shows"
  | "luxury-retail-dining"
  | "health-wellness-events"
  | "academic-institutions"
  | "sporting-events-tournaments"
  | "film-tv-broadcast"
  | "amusement-theme-parks"
  | "nightlife-entertainment-venues"
  | "premium-experiences-hospitality"
  | "art-cultural-institutions"
  | "cruise-lines-maritime"
  | "premium-sporting-experiences-fan-zones";

export type CitySlug =
  | "miami"
  | "new-york-city"
  | "chicago"
  | "los-angeles"
  | "orlando"
  | "nashville"
  | "austin"
  | "atlanta"
  | "minneapolis"
  | "denver"
  | "las-vegas"
  | "seattle";

export interface Service {
  /** 1-based catalog number, locked v1.0. */
  number: number;
  /** Stable URL slug under /services/[class]/[slug]. */
  slug: string;
  /** Human-readable name. */
  name: string;
  /** Primary class code; first listed for multi-class services. */
  primaryClass: ClassCode;
  /** Cross-class codes if this service spans multiple. */
  crossClass?: ClassCode[];
  /** APS levels the service operates at. */
  apsLevels: ApsLevel[];
  /** Primary 8PP phase. */
  primaryPhase: PhaseNumber;
  /** Secondary 8PP phases. "all" if applicable across the lifecycle. */
  secondaryPhases: PhaseNumber[] | "all";
  /** Tiers of experience the service activates across. */
  tiers: TierNumber[];
  /** Four-line GEO citation block. */
  whatItIs: string;
  whenYouNeed: string;
  whatYouReceive: string;
  whereItOperates: string;
}

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

export interface Phase {
  number: PhaseNumber;
  slug: PhaseSlug;
  name: string;
  buyerIntent: string;
  whatHappens: string;
  /** Service catalog numbers active in this phase. */
  activeServices: number[];
}

export interface ExperienceTier {
  number: TierNumber;
  slug: TierSlug;
  name: string;
  definition: string;
  /** Service catalog numbers anchored to this tier. */
  anchoredServices: number[];
}

export interface Solution {
  slug: SolutionSlug;
  name: string;
  definition: string;
  anchoredServices: number[];
  phaseEmphasis: string;
  apsEmphasis: string;
  tierEmphasis: string;
  geoStrongholds: string;
}

export interface Market {
  slug: CitySlug;
  name: string;
  type: "anchor" | "satellite";
  /** One-line positioning. */
  blurb: string;
  /** For satellites: which anchor the market is serviced from. */
  servicedFrom?: CitySlug;
  /** Solution and venue anchors. */
  anchors: string[];
}
