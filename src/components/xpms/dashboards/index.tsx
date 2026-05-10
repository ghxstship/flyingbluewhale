/**
 * 10 XPMS-class dashboard templates — one per class, per ADR-0004.
 *
 * Each is a thin wrapper that sets the class code (which drives the
 * accent color + class chip in BaseDashboard) and delegates the
 * actual layout. Six of the ten currently have populated sub-personas
 * (EXECUTIVE, TALENT, MARKETING, OPERATIONS, EXPERIENCE — and
 * HOSPITALITY when the sub-persona is reframed as recipient rather
 * than host); the other four are forward-looking slots that match
 * the spine 1:1 so future external partners (external designer,
 * scenic shop, lighting designer, ticketing integrator) drop in
 * without inventing new taxonomy.
 *
 * The dashboardForClass(code) helper is the canonical entry point —
 * portal pages call it with `classOfPersona(persona)` to pick the
 * right template.
 */

import type { DashboardProps } from "./types";
import { BaseDashboard } from "./BaseDashboard";
import type { XpmsClassCode } from "@/lib/xpms";

type Slot = Omit<DashboardProps, "classCode">;

export function ExecutiveDashboard(props: Slot) {
  return <BaseDashboard classCode={0} {...props} />;
}
export function CreativeDashboard(props: Slot) {
  return <BaseDashboard classCode={1} {...props} />;
}
export function TalentDashboard(props: Slot) {
  return <BaseDashboard classCode={2} {...props} />;
}
export function MarketingDashboard(props: Slot) {
  return <BaseDashboard classCode={3} {...props} />;
}
export function BuildDashboard(props: Slot) {
  return <BaseDashboard classCode={4} {...props} />;
}
export function ProductionDashboard(props: Slot) {
  return <BaseDashboard classCode={5} {...props} />;
}
export function OperationsDashboard(props: Slot) {
  return <BaseDashboard classCode={6} {...props} />;
}
export function ExperienceDashboard(props: Slot) {
  return <BaseDashboard classCode={7} {...props} />;
}
export function HospitalityDashboard(props: Slot) {
  return <BaseDashboard classCode={8} {...props} />;
}
export function TechnologyDashboard(props: Slot) {
  return <BaseDashboard classCode={9} {...props} />;
}

const COMPONENTS: Record<XpmsClassCode, (p: Slot) => React.ReactElement> = {
  0: ExecutiveDashboard,
  1: CreativeDashboard,
  2: TalentDashboard,
  3: MarketingDashboard,
  4: BuildDashboard,
  5: ProductionDashboard,
  6: OperationsDashboard,
  7: ExperienceDashboard,
  8: HospitalityDashboard,
  9: TechnologyDashboard,
};

/**
 * Resolve the dashboard component for an XPMS class code. Used by the
 * portal /p/[slug]/[persona] mount point in conjunction with
 * `classOfPersona()` from `@/lib/nav`.
 */
export function dashboardForClass(code: XpmsClassCode) {
  return COMPONENTS[code];
}

export { BaseDashboard } from "./BaseDashboard";
export type { DashboardProps, DashboardSection, DashboardBranding } from "./types";
