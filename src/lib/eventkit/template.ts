/**
 * Event Kit Template — the parameterized "house frame" (Layer B).
 *
 * One canonical kit structure with explicit plug-and-play slots
 * ({org, event, artist, mood_board, tier, venue, budget_band}). Every kit the
 * generator emits is a `KitBlueprint`: the nine zero-context sections from the
 * framework spec §5. Extends the repo's TemplateBlueprint so a kit can also be
 * applied through the existing project-template path.
 */
import type { TemplateBlueprint } from "@/lib/templates/types";
import { KIT_PHASE_DEFS, type KitScale, type KitPhase, type KitLine, type Sense, type GateState } from "./index";

// ── Plug-and-play slots ─────────────────────────────────────────────────────
export type KitParams = {
  org: string;
  event: string;
  artist?: string; // plug slot
  moodBoard?: string; // plug slot (URL or descriptor)
  tier: KitScale; // S/M/L/XL event scale
  venue: string;
  budgetBand: string; // human label e.g. "<$50K"
  year?: number;
  venueCode?: string; // VEN segment for atom ids
};

// ── §5.1 Cover / meta block ─────────────────────────────────────────────────
export type KitMeta = {
  org: string;
  event: string;
  venue: string;
  venueAddress?: string;
  scale: KitScale;
  xpmsTierDefault?: string; // 01–06
  budgetBand: string;
  atomNamespace: string; // {ORG}-{EVT}{YY}{VEN}
  kitVersion: string;
  generatedFromParams: KitParams;
};

// ── §5.2 Venue map + XYZ spatial addressing ────────────────────────────────
export type KitZone = {
  zoneCode: string; // addressable e.g. ZON-LOBBY
  name: string;
  dimensions?: string;
  capacity?: number;
  powerNotes?: string;
  avNotes?: string;
  loadinNotes?: string;
};

// ── §5.3 5 Senses touchpoint matrix ────────────────────────────────────────
export type KitTouchpoint = {
  zoneCode: string;
  sense: Sense;
  designIntent: string;
  deliveringElement?: string; // the FF&E/AV/F&B/decor element that delivers it
};

// ── §5.4 8 gated phase plan ────────────────────────────────────────────────
export type KitPhaseGate = {
  phase: KitPhase;
  objective: string;
  exitChecklist: { item: string; doneWhen: string }[];
  ownerRole: string;
  keyDeliverables: string[];
  gateState: GateState;
};

// ── §5.5 Role-based Run of Show (one cue per role beat) ─────────────────────
export type KitRosCue = {
  scheduledAt: string; // ISO or clock label
  lane: "show" | "lights" | "audio" | "video" | "talent" | "safety" | "transport";
  ownerRole: string; // maps to a ROS_ROLE / org_roles JD
  label: string;
  description?: string;
  phase?: KitPhase;
  durationSeconds?: number;
  doneWhen?: string;
  dependsOn?: string; // label of predecessor cue
};

// ── §5.8 Tech / requirements rider (by zone × phase) ───────────────────────
export type KitRiderItem = {
  zoneCode: string;
  phase: KitPhase;
  category: "logistics" | "power" | "structural" | "electrical" | "av" | "acoustic" | "rigging" | "network" | "rf";
  requirement: string;
};

// ── The full blueprint (nine §5 sections) ──────────────────────────────────
export type KitBlueprint = TemplateBlueprint & {
  eventKit: {
    meta: KitMeta; // §5.1
    zones: KitZone[]; // §5.2
    touchpoints: KitTouchpoint[]; // §5.3
    phaseGates: KitPhaseGate[]; // §5.4
    ros: KitRosCue[]; // §5.5
    lines: KitLine[]; // §5.6 (Advance BOM)
    reserves: { feeCents: number; contingencyCents: number; allowanceCents: number; markupCents: number }; // §5.7
    rider: KitRiderItem[]; // §5.8
    plugSlots: { artist?: string; moodBoard?: string }; // §5.9
  };
};

// ── Canonical ROS role catalog (operational, drives §5.5) ──────────────────
// Derived from the repo's org_roles JDs + the XPMS Registry team backbone.
// Each role names the XPMS department it belongs to so ROS reconciles to BOM.
export type RosRole = { role: string; department: string; lane: KitRosCue["lane"] };
export const ROS_ROLES: RosRole[] = [
  { role: "Producer / GM", department: "Production", lane: "show" },
  { role: "Production Manager", department: "Production", lane: "show" },
  { role: "Stage Manager", department: "Production", lane: "show" },
  { role: "Technical Director", department: "Production", lane: "show" },
  { role: "Audio (A1/A2)", department: "Production", lane: "audio" },
  { role: "Lighting Designer", department: "Production", lane: "lights" },
  { role: "Video / LED", department: "Production", lane: "video" },
  { role: "Rigging", department: "Production", lane: "show" },
  { role: "Talent / Artist Liaison", department: "Talent", lane: "talent" },
  { role: "Hospitality / F&B Lead", department: "Hospitality", lane: "show" },
  { role: "Front of House", department: "Operations", lane: "show" },
  { role: "Guest Experience", department: "Experience", lane: "show" },
  { role: "Security Lead", department: "Operations", lane: "safety" },
  { role: "Medical / Safety", department: "Operations", lane: "safety" },
  { role: "Logistics", department: "Operations", lane: "transport" },
  { role: "Install / Strike Lead", department: "Build", lane: "show" },
];

// ── Build the empty structural frame (pre-populated 8-gate plan) ────────────
export function buildAtomNamespace(p: KitParams): string {
  const org = p.org
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);
  const evt = p.event
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5);
  const yy = String((p.year ?? new Date().getUTCFullYear()) % 100).padStart(2, "0");
  const ven = (p.venueCode ?? p.venue)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5);
  return `${org}-${evt}${yy}${ven}`;
}

/** The canonical house frame: meta + the 8 gated phases pre-seeded, empty sections. */
export function emptyKitFrame(params: KitParams): KitBlueprint {
  const phaseGates: KitPhaseGate[] = KIT_PHASE_DEFS.map((d) => ({
    phase: d.id,
    objective: `${d.id} — ${d.absorbs}`,
    exitChecklist: [{ item: d.exitGate, doneWhen: d.exitGate }],
    ownerRole: d.id === "Operate" ? "Producer / GM" : "Production Manager",
    keyDeliverables: [],
    gateState: "pending",
  }));

  return {
    project: { kind: "event_kit", modules: ["advancing", "schedule", "budget", "guides"] },
    eventKit: {
      meta: {
        org: params.org,
        event: params.event,
        venue: params.venue,
        scale: params.tier,
        budgetBand: params.budgetBand,
        atomNamespace: buildAtomNamespace(params),
        kitVersion: "v1.0",
        generatedFromParams: params,
      },
      zones: [],
      touchpoints: [],
      phaseGates,
      ros: [],
      lines: [],
      reserves: { feeCents: 0, contingencyCents: 0, allowanceCents: 0, markupCents: 0 },
      rider: [],
      plugSlots: { artist: params.artist, moodBoard: params.moodBoard },
    },
  };
}
