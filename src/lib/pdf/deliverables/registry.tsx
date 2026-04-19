import "server-only";

import React from "react";
import type { ZodSchema } from "zod";
import {
  TechnicalRiderSchema,
  HospitalityRiderSchema,
  InputListSchema,
  StagePlotSchema,
  CrewListSchema,
  GuestListSchema,
  EquipmentPullListSchema,
  PowerPlanSchema,
  RiggingPlanSchema,
  SitePlanSchema,
  BuildScheduleSchema,
  VendorPackageSchema,
  SafetyComplianceSchema,
  CommsPlanSchema,
  SignageGridSchema,
  CustomSchema,
} from "../schemas/deliverables";
import {
  TechnicalRiderView,
  HospitalityRiderView,
  InputListView,
  StagePlotView,
  CrewListView,
  GuestListView,
  EquipmentPullListView,
  PowerPlanView,
  RiggingPlanView,
  SitePlanView,
  BuildScheduleView,
  VendorPackageView,
  SafetyComplianceView,
  CommsPlanView,
  SignageGridView,
  CustomView,
  GenericDeliverableView,
} from "./views";

/**
 * Registry — Opportunity #2.
 *
 * Maps the `deliverable_type` enum to its schema + React-PDF view. The
 * single source of truth iterated by `<DeliverablePdf>` (per-type) and
 * `<AdvanceBook>` (#1) to compose a multi-deliverable document.
 */

export type DeliverableType =
  | "technical_rider"
  | "hospitality_rider"
  | "input_list"
  | "stage_plot"
  | "crew_list"
  | "guest_list"
  | "equipment_pull_list"
  | "power_plan"
  | "rigging_plan"
  | "site_plan"
  | "build_schedule"
  | "vendor_package"
  | "safety_compliance"
  | "comms_plan"
  | "signage_grid"
  | "custom";

type Entry<T> = {
  label: string;
  schema: ZodSchema<T>;
  render: (data: T) => React.ReactElement;
};

// `any` at the registry boundary — each entry's narrower schema re-types
// the data on the way in via `renderDeliverable()` below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DELIVERABLE_REGISTRY: Record<DeliverableType, Entry<any>> = {
  technical_rider:    { label: "Technical rider",      schema: TechnicalRiderSchema,    render: (d) => <TechnicalRiderView data={d} /> },
  hospitality_rider:  { label: "Hospitality rider",    schema: HospitalityRiderSchema,  render: (d) => <HospitalityRiderView data={d} /> },
  input_list:         { label: "Input list",           schema: InputListSchema,         render: (d) => <InputListView data={d} /> },
  stage_plot:         { label: "Stage plot",           schema: StagePlotSchema,         render: (d) => <StagePlotView data={d} /> },
  crew_list:          { label: "Crew list",            schema: CrewListSchema,          render: (d) => <CrewListView data={d} /> },
  guest_list:         { label: "Guest list",           schema: GuestListSchema,         render: (d) => <GuestListView data={d} /> },
  equipment_pull_list:{ label: "Equipment pull list",  schema: EquipmentPullListSchema, render: (d) => <EquipmentPullListView data={d} /> },
  power_plan:         { label: "Power plan",           schema: PowerPlanSchema,         render: (d) => <PowerPlanView data={d} /> },
  rigging_plan:       { label: "Rigging plan",         schema: RiggingPlanSchema,       render: (d) => <RiggingPlanView data={d} /> },
  site_plan:          { label: "Site plan",            schema: SitePlanSchema,          render: (d) => <SitePlanView data={d} /> },
  build_schedule:     { label: "Build schedule",       schema: BuildScheduleSchema,     render: (d) => <BuildScheduleView data={d} /> },
  vendor_package:     { label: "Vendor package",       schema: VendorPackageSchema,     render: (d) => <VendorPackageView data={d} /> },
  safety_compliance:  { label: "Safety + compliance",  schema: SafetyComplianceSchema,  render: (d) => <SafetyComplianceView data={d} /> },
  comms_plan:         { label: "Comms plan",           schema: CommsPlanSchema,         render: (d) => <CommsPlanView data={d} /> },
  signage_grid:       { label: "Signage grid",         schema: SignageGridSchema,       render: (d) => <SignageGridView data={d} /> },
  custom:             { label: "Custom",               schema: CustomSchema,            render: (d) => <CustomView data={d} /> },
};

/**
 * Validate + render a single deliverable's body. Falls back to a
 * generic JSON dump if validation fails so a bad row never breaks an
 * Advance Book compile.
 */
export function renderDeliverable(type: string, data: unknown): React.ReactElement {
  const entry = DELIVERABLE_REGISTRY[type as DeliverableType];
  if (!entry) return <GenericDeliverableView data={data} />;
  const parsed = entry.schema.safeParse(data);
  if (!parsed.success) return <GenericDeliverableView data={data} />;
  return entry.render(parsed.data);
}

export function labelFor(type: string): string {
  const e = DELIVERABLE_REGISTRY[type as DeliverableType];
  return e?.label ?? type;
}
