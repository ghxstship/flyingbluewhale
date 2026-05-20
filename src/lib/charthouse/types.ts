/**
 * CHARTHOUSE TS types — schema-anchored to migration 0057_charthouse_v1.sql.
 *
 * These mirror the protocol §4 data model. Keep enum tuples (CHARTHOUSE_*)
 * as `as const` arrays so they double as runtime values for forms.
 */

export const CHARTHOUSE_SHEET_TYPES = [
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
export type CharthouseSheetType = (typeof CHARTHOUSE_SHEET_TYPES)[number];

/** Protocol §5 — lifecycle states. */
export const CHARTHOUSE_DOCUMENT_STATES = [
  "draft",
  "in_review",
  "approved",
  "issued",
  "superseded",
  "as_built",
] as const;
export type CharthouseDocumentState = (typeof CHARTHOUSE_DOCUMENT_STATES)[number];

export const CHARTHOUSE_SHELL_TYPES = [
  "tent",
  "container",
  "building",
  "parcel",
  "truss_structure",
  "vehicle",
  "riser",
  "open",
] as const;
export type CharthouseShellType = (typeof CHARTHOUSE_SHELL_TYPES)[number];

/** Protocol §6 — closed band-vocabulary enum. */
export const CHARTHOUSE_BAND_TYPES = [
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
export type CharthouseBandType = (typeof CHARTHOUSE_BAND_TYPES)[number];

export const CHARTHOUSE_EDGES = ["N", "S", "E", "W", "L_NE", "L_SE", "L_SW", "L_NW"] as const;
export type CharthouseEdge = (typeof CHARTHOUSE_EDGES)[number];

export const CARDINAL_EDGES = ["N", "S", "E", "W"] as const;
export type CardinalEdge = (typeof CARDINAL_EDGES)[number];

export const CHARTHOUSE_UTILITY_SERVICES = [
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
export type CharthouseUtilityService = (typeof CHARTHOUSE_UTILITY_SERVICES)[number];

export const CHARTHOUSE_ADJACENCY_RELS = [
  "feeds",
  "egress_to",
  "service_from",
  "blocks",
  "noise_buffer",
  "thermal_buffer",
  "public_facing",
  "restricted",
] as const;
export type CharthouseAdjacencyRel = (typeof CHARTHOUSE_ADJACENCY_RELS)[number];

/** Protocol §11 — cross-cutting tags. Never structural. */
export const CHARTHOUSE_SUSTAINABILITY = ["none", "aspirational", "committed", "certified"] as const;
export const CHARTHOUSE_ACCESSIBILITY = ["ada_compliant", "partial", "none"] as const;
export const CHARTHOUSE_WEATHER_EXPOSURE = ["enclosed", "covered", "open"] as const;
export const CHARTHOUSE_SECURITY_LEVELS = ["public", "restricted", "talent_only", "exec"] as const;
export const CHARTHOUSE_SENSITIVITY = ["low", "med", "high"] as const;

/** Shell dimensions JSONB shape stored on site_plans.shell_dimensions. */
export type ShellDimensions = {
  length_in: number;
  width_in: number;
  height_in: number;
};

/** Computed acceptance snapshot — mirrors v_charthouse_sheet_acceptance. */
export type AcceptanceSnapshot = {
  sheet_id: string;
  org_id: string;
  atom_id: string | null;
  document_state: CharthouseDocumentState;
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
export type CharthouseSheet = {
  id: string;
  org_id: string;
  project_id: string | null;
  event_id: string | null;
  venue_id: string | null;
  code: string;
  title: string;
  discipline: string;
  notes: string | null;
  // CHARTHOUSE enrichment
  atom_id: string | null;
  sheet_type: CharthouseSheetType;
  primary_class: number | null;
  secondary_classes: number[] | null;
  tier_primary: number | null;
  tier_secondary: unknown;
  shell_type: CharthouseShellType | null;
  shell_dimensions: ShellDimensions | null;
  orientation_deg: number | null;
  scale: string | null;
  document_state: CharthouseDocumentState;
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

export type CharthouseZoneRegion = {
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

export type CharthouseBand = {
  id: string;
  org_id: string;
  sheet_id: string;
  region_id: string | null;
  band_type: CharthouseBandType;
  edge: CharthouseEdge;
  depth_in: number | null;
  path: unknown;
  color_token: string | null;
  label: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CharthouseStation = {
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

export type CharthousePlacement = {
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

export type CharthouseUtility = {
  id: string;
  org_id: string;
  sheet_id: string;
  drop_code: string;
  service_type: CharthouseUtilityService;
  loads: string[];
  location: { x: number; y: number } | null;
  circuit_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CharthouseAdjacency = {
  id: string;
  org_id: string;
  sheet_id: string;
  edge: CharthouseEdge;
  adjacent_sheet_id: string | null;
  adjacent_label: string | null;
  relationship: CharthouseAdjacencyRel;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Lifecycle transitions accepted by the charthouse_transition_state RPC. */
export const CHARTHOUSE_TRANSITIONS = [
  "submit",
  "approve",
  "reject",
  "revise",
  "issue",
  "supersede",
  "field_change",
] as const;
export type CharthouseTransition = (typeof CHARTHOUSE_TRANSITIONS)[number];
