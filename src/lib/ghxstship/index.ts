/**
 * GHXSTSHIP service catalog — XPMS v1.0 data layer.
 *
 * Single import surface for the marketing site at /ghxstship. The five
 * orthogonal axes plus geography are already cross-referenced via the
 * service.number → axis.activeServices / anchoredServices links; helpers
 * below resolve those references into typed objects.
 */

export * from "./types";
export * from "./classes";
export * from "./phases";
export * from "./tiers";
export * from "./markets";
export * from "./solutions";
export * from "./services";
export * from "./pricing";

import { SERVICES, SERVICE_BY_NUMBER, servicesByClass, servicesByPhase } from "./services";
import { CLASSES, CLASS_BY_CODE, CLASS_BY_SLUG } from "./classes";
import { PHASES, PHASE_BY_NUMBER, PHASE_BY_SLUG } from "./phases";
import { TIERS, TIER_BY_NUMBER, TIER_BY_SLUG } from "./tiers";
import { SOLUTIONS, SOLUTION_BY_SLUG } from "./solutions";
import { MARKETS, MARKET_BY_SLUG, ANCHOR_MARKETS } from "./markets";
import type { Service, Solution } from "./types";

/** Resolve a list of catalog numbers into Service objects, drop unknowns. */
export function resolveServices(numbers: number[]): Service[] {
  return numbers.map((n) => SERVICE_BY_NUMBER[n]).filter(Boolean);
}

/** Path helpers — single source of truth for /ghxstship URLs. */
export const paths = {
  root: () => "/ghxstship",
  about: () => "/ghxstship/about",
  contact: () => "/ghxstship/contact",
  pricing: () => "/ghxstship/pricing",

  servicesRoot: () => "/ghxstship/services",
  classDetail: (classSlug: string) => `/ghxstship/services/${classSlug}`,
  serviceDetail: (classSlug: string, serviceSlug: string) => `/ghxstship/services/${classSlug}/${serviceSlug}`,

  solutionsRoot: () => "/ghxstship/solutions",
  solutionDetail: (slug: string) => `/ghxstship/solutions/${slug}`,

  phasesRoot: () => "/ghxstship/phases",
  phaseDetail: (slug: string) => `/ghxstship/phases/${slug}`,

  tiersRoot: () => "/ghxstship/tiers",
  tierDetail: (slug: string) => `/ghxstship/tiers/${slug}`,

  marketsRoot: () => "/ghxstship/markets",
  marketDetail: (slug: string) => `/ghxstship/markets/${slug}`,
};

/** Catalog-level totals for hero / proof points. */
export const CATALOG_STATS = {
  serviceCount: SERVICES.length,
  classCount: CLASSES.length,
  phaseCount: PHASES.length,
  tierCount: TIERS.length,
  solutionCount: SOLUTIONS.length,
  marketCount: MARKETS.length,
  anchorMarketCount: ANCHOR_MARKETS.length,
};

/** Find the canonical class slug for a service (used to construct URLs). */
export function classSlugForService(service: Service): string {
  return CLASS_BY_CODE[service.primaryClass].slug;
}

/** Resolved record for the solution detail page. */
export function expandSolution(solution: Solution) {
  return {
    ...solution,
    services: resolveServices(solution.anchoredServices),
  };
}

export {
  SERVICES,
  SERVICE_BY_NUMBER,
  servicesByClass,
  servicesByPhase,
  CLASSES,
  CLASS_BY_CODE,
  CLASS_BY_SLUG,
  PHASES,
  PHASE_BY_NUMBER,
  PHASE_BY_SLUG,
  TIERS,
  TIER_BY_NUMBER,
  TIER_BY_SLUG,
  SOLUTIONS,
  SOLUTION_BY_SLUG,
  MARKETS,
  MARKET_BY_SLUG,
  ANCHOR_MARKETS,
};
