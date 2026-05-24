/**
 * SITEPLAN TS types — schema-anchored to migration 0057_siteplan_v1.sql.
 *
 * These mirror the protocol §4 data model. Keep enum tuples (SITEPLAN_*)
 * as `as const` arrays so they double as runtime values for forms.
 */

export const SITEPLAN_SHEET_TYPES = [
  "site_plan",
  "floor_plan",
  "rcp",
  "power",
  "egress",
  "flow",
  "signage",
  "section",
  "as_built",
] as const;
export type SitePlanSheetType = (typeof SITEPLAN_SHEET_TYPES)[number];

/** Protocol §5 — lifecycle states. */
export const SITEPLAN_DOCUMENT_STATES = ["draft", "in_review", "approved", "issued", "superseded", "as_built"] as const;
export type SitePlanDocumentState = (typeof SITEPLAN_DOCUMENT_STATES)[number];

export const SITEPLAN_SHELL_TYPES = [
  "tent",
  "container",
  "building",
  "parcel",
  "truss_structure",
  "vehicle",
  "riser",
  "open",
] as const;
export type SitePlanShellType = (typeof SITEPLAN_SHELL_TYPES)[number];

/** Protocol §6 — closed band-vocabulary enum. */
export const SITEPLAN_BAND_TYPES = [
  "appliance",
  "service",
  "bar",
  "display",
  "cold_rail",
  "hot_rail",
  "queue",
  "bench",
  "tech",
  "barricade",
] as const;
export type SitePlanBandType = (typeof SITEPLAN_BAND_TYPES)[number];

export const SITEPLAN_EDGES = ["N", "S", "E", "W", "L_NE", "L_SE", "L_SW", "L_NW"] as const;
export type SitePlanEdge = (typeof SITEPLAN_EDGES)[number];

export const CARDINAL_EDGES = ["N", "S", "E", "W"] as const;
export type CardinalEdge = (typeof CARDINAL_EDGES)[number];

export const SITEPLAN_UTILITY_SERVICES = [
  "power_120v_20a",
  "power_120v_30a",
  "power_208v_30a",
  "power_208v_50a",
  "power_480v_50a_3ph",
  "gas_propane",
  "gas_natural",
  "water_potable",
  "water_greywater",
  "drain",
  "data_ethernet",
  "data_fiber",
  "comms_rf",
  "comms_intercom",
  "compressed_air",
] as const;
export type SitePlanUtilityService = (typeof SITEPLAN_UTILITY_SERVICES)[number];

export const SITEPLAN_ADJACENCY_RELS = [
  "feeds",
  "egress_to",
  "service_from",
  "blocks",
  "noise_buffer",
  "thermal_buffer",
  "public_facing",
  "restricted",
] as const;
export type SitePlanAdjacencyRel = (typeof SITEPLAN_ADJACENCY_RELS)[number];

/** Protocol §11 — cross-cutting tags. Never structural. */
export const SITEPLAN_SUSTAINABILITY = ["none", "aspirational", "committed", "certified"] as const;
export const SITEPLAN_ACCESSIBILITY = ["ada_compliant", "partial", "none"] as const;
export const SITEPLAN_WEATHER_EXPOSURE = ["enclosed", "covered", "open"] as const;
export const SITEPLAN_SECURITY_LEVELS = ["public", "restricted", "talent_only", "exec"] as const;
export const SITEPLAN_SENSITIVITY = ["low", "med", "high"] as const;

/** Shell dimensions JSONB shape stored on site_plans.shell_dimensions. */
export type ShellDimensions = {
  length_in: number;
  width_in: number;
  height_in: number;
  gross_sqft?: number;
};

/** Computed acceptance snapshot — mirrors v_siteplan_sheet_acceptance. */
export type AcceptanceSnapshot = {
  sheet_id: string;
  org_id: string;
  atom_id: string | null;
  document_state: SitePlanDocumentState;
  has_atom_id: boolean;
  has_sheet_type: boolean;
  has_primary_class: boolean;
  has_tier_primary: boolean;
  has_shell: boolean;
  has_region: boolean;
  has_band: boolean;
  has_placement: boolean;
  has_utility: boolean;
  has_all_four_edges: boolean;
  has_approval_signoff: boolean;
};

/** Sheet row shape after the 0057 enrichment. */
export type SitePlanSheet = {
  id: string;
  org_id: string;
  project_id: string | null;
  event_id: string | null;
  venue_id: string | null;
  code: string;
  title: string;
  discipline: string;
  notes: string | null;
  // SITEPLAN enrichment
  atom_id: string | null;
  sheet_type: SitePlanSheetType;
  primary_class: number | null;
  secondary_classes: number[] | null;
  tier_primary: number | null;
  tier_secondary: unknown;
  shell_type: SitePlanShellType | null;
  shell_dimensions: ShellDimensions | null;
  orientation_deg: number | null;
  scale: string | null;
  document_state: SitePlanDocumentState;
  superseded_by: string | null;
  issued_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  revision_letter: string;
  preset_code: string | null;
  zone_code: string | null;
  sustainability_tag: string | null;
  accessibility_tag: string | null;
  weather_exposure: string | null;
  security_level: string | null;
  sensitivity: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;
};

export type SitePlanZoneRegion = {
  id: string;
  org_id: string;
  sheet_id: string;
  code: string;
  label: string;
  bbox: { x: number; y: number; w: number; h: number } | null;
  class_tag: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SitePlanBand = {
  id: string;
  org_id: string;
  sheet_id: string;
  region_id: string | null;
  band_type: SitePlanBandType;
  edge: SitePlanEdge;
  depth_in: number | null;
  path: unknown;
  color_token: string | null;
  label: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SitePlanStation = {
  id: string;
  org_id: string;
  sheet_id: string;
  band_id: string;
  position_in: number | null;
  station_code: string;
  function: string | null;
  head_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SitePlanPlacement = {
  id: string;
  org_id: string;
  sheet_id: string;
  station_id: string | null;
  band_id: string | null;
  catalog_item_id: string | null;
  uac_atom_id: string | null;
  tpc_atom_id: string | null;
  tag: string;
  footprint: { x: number; y: number; w: number; h: number; rotation_deg: number } | null;
  power_drop_id: string | null;
  qty: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SitePlanUtility = {
  id: string;
  org_id: string;
  sheet_id: string;
  drop_code: string;
  service_type: SitePlanUtilityService;
  loads: string[];
  location: { x: number; y: number } | null;
  circuit_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SitePlanAdjacency = {
  id: string;
  org_id: string;
  sheet_id: string;
  edge: SitePlanEdge;
  adjacent_sheet_id: string | null;
  adjacent_label: string | null;
  relationship: SitePlanAdjacencyRel;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Lifecycle transitions accepted by the siteplan_transition_state RPC. */
export const SITEPLAN_TRANSITIONS = [
  "submit",
  "approve",
  "reject",
  "revise",
  "issue",
  "supersede",
  "field_change",
] as const;
export type SitePlanTransition = (typeof SITEPLAN_TRANSITIONS)[number];
