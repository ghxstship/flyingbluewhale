/**
 * SITEPLAN Preset Library — protocol §10.
 *
 * Each preset defines default zones, default bands, default station counts,
 * a default shell, and a starter UAC pick list. Indexed by `primary_class`.
 * Presets are append-only — new presets enter the library via UWCP, never
 * inline.
 */

import type { SitePlanBandType, SitePlanEdge, SitePlanSheetType, SitePlanShellType } from "./types";

export type PresetRegionDef = {
  code: string;
  label: string;
  class_tag?: number;
};

export type PresetBandDef = {
  band_type: SitePlanBandType;
  edge: SitePlanEdge;
  depth_in: number;
  label?: string;
};

export type PresetStationDef = {
  station_code: string;
  function: string;
  head_count?: number;
  band_index?: number; // index into bands[]
};

export type Preset = {
  code: string;
  label: string;
  primary_class: number;
  default_sheet_type: SitePlanSheetType;
  shell_type: SitePlanShellType;
  shell_dimensions: { length_in: number; width_in: number; height_in: number };
  regions: PresetRegionDef[];
  bands: PresetBandDef[];
  stations: PresetStationDef[];
  description: string;
};

/** §10 Template library — 17 canonical presets. */
export const PRESETS: Preset[] = [
  {
    code: "preset.0000.production_office",
    label: "Production Office",
    primary_class: 0,
    default_sheet_type: "floor_plan",
    shell_type: "container",
    shell_dimensions: { length_in: 480, width_in: 96, height_in: 102 },
    regions: [
      { code: "EXEC", label: "Executive Desk", class_tag: 0 },
      { code: "OPS", label: "Ops Pool", class_tag: 6 },
    ],
    bands: [{ band_type: "bench", edge: "S", depth_in: 24 }],
    stations: [{ station_code: "EXEC-1", function: "exec", head_count: 1, band_index: 0 }],
    description: "Exec / ops command post — container or trailer.",
  },
  {
    code: "preset.1000.creative_studio",
    label: "Creative Studio",
    primary_class: 1,
    default_sheet_type: "floor_plan",
    shell_type: "tent",
    shell_dimensions: { length_in: 240, width_in: 240, height_in: 144 },
    regions: [{ code: "CAPT", label: "Capture", class_tag: 1 }],
    bands: [{ band_type: "tech", edge: "N", depth_in: 36 }],
    stations: [],
    description: "Content capture, DJ booth, photo set.",
  },
  {
    code: "preset.2000.green_room",
    label: "Green Room",
    primary_class: 2,
    default_sheet_type: "floor_plan",
    shell_type: "tent",
    shell_dimensions: { length_in: 240, width_in: 240, height_in: 120 },
    regions: [
      { code: "HOSP", label: "Hospitality", class_tag: 8 },
      { code: "LOUNGE", label: "Lounge", class_tag: 2 },
    ],
    bands: [
      { band_type: "service", edge: "N", depth_in: 30 },
      { band_type: "bench", edge: "S", depth_in: 24 },
    ],
    stations: [],
    description: "Performer hospitality.",
  },
  {
    code: "preset.2000.dressing_room",
    label: "Dressing Room",
    primary_class: 2,
    default_sheet_type: "floor_plan",
    shell_type: "container",
    shell_dimensions: { length_in: 480, width_in: 96, height_in: 102 },
    regions: [{ code: "WARD", label: "Wardrobe", class_tag: 2 }],
    bands: [{ band_type: "service", edge: "W", depth_in: 24 }],
    stations: [],
    description: "Talent prep.",
  },
  {
    code: "preset.3000.press_riser",
    label: "Press Riser",
    primary_class: 3,
    default_sheet_type: "section",
    shell_type: "truss_structure",
    shell_dimensions: { length_in: 192, width_in: 96, height_in: 60 },
    regions: [{ code: "PHOTO", label: "Photo", class_tag: 3 }],
    bands: [{ band_type: "tech", edge: "N", depth_in: 24 }],
    stations: [],
    description: "Photo / video position.",
  },
  {
    code: "preset.4000.fab_yard",
    label: "Fab Yard",
    primary_class: 4,
    default_sheet_type: "site_plan",
    shell_type: "parcel",
    shell_dimensions: { length_in: 2400, width_in: 1200, height_in: 0 },
    regions: [{ code: "FAB", label: "Scenic Fab", class_tag: 4 }],
    bands: [],
    stations: [],
    description: "Scenic fab staging.",
  },
  {
    code: "preset.5000.dimmer_room",
    label: "Dimmer Room",
    primary_class: 5,
    default_sheet_type: "power",
    shell_type: "container",
    shell_dimensions: { length_in: 240, width_in: 96, height_in: 102 },
    regions: [{ code: "DIM", label: "Dimmer", class_tag: 5 }],
    bands: [{ band_type: "tech", edge: "W", depth_in: 24 }],
    stations: [],
    description: "Lighting distro.",
  },
  {
    code: "preset.5000.audio_foh",
    label: "Audio FOH",
    primary_class: 5,
    default_sheet_type: "floor_plan",
    shell_type: "riser",
    shell_dimensions: { length_in: 192, width_in: 96, height_in: 48 },
    regions: [{ code: "FOH", label: "Front of House", class_tag: 5 }],
    bands: [{ band_type: "tech", edge: "S", depth_in: 36 }],
    stations: [{ station_code: "FOH-1", function: "mix", head_count: 1, band_index: 0 }],
    description: "Front of house.",
  },
  {
    code: "preset.5000.boh_tent_40x40",
    label: "BOH Tent 40×40",
    primary_class: 5,
    default_sheet_type: "floor_plan",
    shell_type: "tent",
    shell_dimensions: { length_in: 480, width_in: 480, height_in: 144 },
    regions: [{ code: "BOH", label: "Back of House", class_tag: 5 }],
    bands: [{ band_type: "bench", edge: "S", depth_in: 24 }],
    stations: [],
    description: "Generic BOH.",
  },
  {
    code: "preset.6000.security_checkpoint",
    label: "Security Checkpoint",
    primary_class: 6,
    default_sheet_type: "flow",
    shell_type: "tent",
    shell_dimensions: { length_in: 240, width_in: 120, height_in: 120 },
    regions: [{ code: "SCREEN", label: "Screening", class_tag: 6 }],
    bands: [
      { band_type: "queue", edge: "W", depth_in: 48 },
      { band_type: "barricade", edge: "E", depth_in: 12 },
    ],
    stations: [],
    description: "Wand / bag check.",
  },
  {
    code: "preset.6000.medical_tent",
    label: "Medical Tent",
    primary_class: 6,
    default_sheet_type: "floor_plan",
    shell_type: "tent",
    shell_dimensions: { length_in: 240, width_in: 240, height_in: 120 },
    regions: [
      { code: "TRIAGE", label: "Triage", class_tag: 6 },
      { code: "TREAT", label: "Treatment", class_tag: 6 },
    ],
    bands: [{ band_type: "bench", edge: "N", depth_in: 30 }],
    stations: [],
    description: "First aid + transport staging.",
  },
  {
    code: "preset.6000.dispatch",
    label: "Dispatch",
    primary_class: 6,
    default_sheet_type: "floor_plan",
    shell_type: "container",
    shell_dimensions: { length_in: 240, width_in: 96, height_in: 102 },
    regions: [{ code: "DISP", label: "Dispatch", class_tag: 6 }],
    bands: [{ band_type: "tech", edge: "S", depth_in: 24 }],
    stations: [],
    description: "Radio / runner dispatch.",
  },
  {
    code: "preset.7000.activation_footprint",
    label: "Activation Footprint",
    primary_class: 7,
    default_sheet_type: "site_plan",
    shell_type: "parcel",
    shell_dimensions: { length_in: 1200, width_in: 1200, height_in: 0 },
    regions: [{ code: "ACT", label: "Activation", class_tag: 7 }],
    bands: [{ band_type: "display", edge: "N", depth_in: 60 }],
    stations: [],
    description: "Brand activation.",
  },
  {
    code: "preset.7000.guest_queue_line",
    label: "Guest Queue Line",
    primary_class: 7,
    default_sheet_type: "flow",
    shell_type: "open",
    shell_dimensions: { length_in: 1200, width_in: 240, height_in: 0 },
    regions: [{ code: "Q", label: "Queue", class_tag: 7 }],
    bands: [{ band_type: "queue", edge: "N", depth_in: 48 }],
    stations: [],
    description: "Wayfinding + dwell.",
  },
  {
    code: "preset.8000.kitchen_perp_tent",
    label: "Kitchen — Perpendicular Tent (Salvage City)",
    primary_class: 8,
    default_sheet_type: "floor_plan",
    shell_type: "tent",
    shell_dimensions: { length_in: 480, width_in: 120, height_in: 120 },
    regions: [
      { code: "COLD", label: "Cold Zone", class_tag: 8 },
      { code: "COOK", label: "Cook Zone", class_tag: 8 },
      { code: "FRY", label: "Fry Zone", class_tag: 8 },
      { code: "HOLD", label: "Hot Hold", class_tag: 8 },
      { code: "PASS", label: "Pass", class_tag: 8 },
    ],
    bands: [
      { band_type: "appliance", edge: "N", depth_in: 30, label: "Cook line" },
      { band_type: "service", edge: "S", depth_in: 30, label: "Prep / plate" },
      { band_type: "service", edge: "L_SE", depth_in: 30, label: "Pass (L-return)" },
    ],
    stations: [
      { station_code: "PREP-1", function: "prep", head_count: 1, band_index: 1 },
      { station_code: "PLATE-1", function: "plate", head_count: 1, band_index: 1 },
      { station_code: "EXPO-1", function: "expo", head_count: 1, band_index: 2 },
    ],
    description: "Salvage City canonical kitchen — 10×40 tent, two-cook line, L-return pass.",
  },
  {
    code: "preset.8000.bar_2_well",
    label: "Bar — Two-Well",
    primary_class: 8,
    default_sheet_type: "floor_plan",
    shell_type: "tent",
    shell_dimensions: { length_in: 240, width_in: 120, height_in: 120 },
    regions: [{ code: "BAR", label: "Bar", class_tag: 8 }],
    bands: [
      { band_type: "bar", edge: "N", depth_in: 30 },
      { band_type: "service", edge: "S", depth_in: 30 },
    ],
    stations: [
      { station_code: "BAR-1", function: "tend", head_count: 1, band_index: 0 },
      { station_code: "BAR-2", function: "tend", head_count: 1, band_index: 0 },
    ],
    description: "Two-well bar service.",
  },
  {
    code: "preset.8000.vip_lounge",
    label: "VIP Lounge",
    primary_class: 8,
    default_sheet_type: "floor_plan",
    shell_type: "tent",
    shell_dimensions: { length_in: 480, width_in: 360, height_in: 144 },
    regions: [
      { code: "BAR", label: "Bar", class_tag: 8 },
      { code: "SEAT", label: "Seating", class_tag: 8 },
      { code: "BOT", label: "Bottle Service", class_tag: 8 },
    ],
    bands: [
      { band_type: "bar", edge: "W", depth_in: 30 },
      { band_type: "bench", edge: "E", depth_in: 48 },
    ],
    stations: [],
    description: "F&B + seating + bottle service.",
  },
  {
    code: "preset.9000.it_room",
    label: "IT Room",
    primary_class: 9,
    default_sheet_type: "floor_plan",
    shell_type: "container",
    shell_dimensions: { length_in: 240, width_in: 96, height_in: 102 },
    regions: [{ code: "NET", label: "Networking", class_tag: 9 }],
    bands: [{ band_type: "tech", edge: "W", depth_in: 24 }],
    stations: [],
    description: "Networking, RF, ticketing.",
  },
];

export function getPreset(code: string): Preset | null {
  return PRESETS.find((p) => p.code === code) ?? null;
}

/** Convenience: presets indexed by class for menu rendering. */
export function presetsByClass(): Record<number, Preset[]> {
  const out: Record<number, Preset[]> = {};
  for (const p of PRESETS) {
    (out[p.primary_class] ||= []).push(p);
  }
  return out;
}
