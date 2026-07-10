/**
 * Event Kit Generator — Layer C (the "sushi menu" engine).
 *
 * Pure, client-agnostic: assembleKit() turns params + a venue frame + selected
 * configure-to-order content into a validated KitBlueprint; kitToRows() turns a
 * blueprint into plain insert payloads for the Layer-A tables. Persistence is
 * left to the caller (app server action, or scripts/seed-casa-kits.mjs) so the
 * engine stays testable and reusable.
 *
 * Configuration is validated against the tier budget band + venue zones, and
 * conflicts are SURFACED (returned), never silently resolved.
 */
import {
  type KitLine,
  type KitScale,
  type KitOption,
  type ConfigConflict,
  type Reserves,
  validateConfiguration,
  reconcile,
  scopeSubtotalCents,
  grandTotalCents,
} from "./index";
import {
  type KitBlueprint,
  type KitParams,
  type KitZone,
  type KitTouchpoint,
  type KitPhaseGate,
  type KitRosCue,
  type KitRiderItem,
  emptyKitFrame,
} from "./template";
import { formatMoney } from "@/lib/i18n/format";

export type VenueFrame = {
  zones: KitZone[];
  touchpoints: KitTouchpoint[];
  phaseGates: KitPhaseGate[];
  ros: KitRosCue[];
  rider: KitRiderItem[];
};

export type AssembleInput = {
  frame: VenueFrame;
  lines: KitLine[];
  reserves: Reserves;
  selectedOptions?: KitOption[];
  venueAddress?: string;
  xpmsTierDefault?: string;
};

export type AssembledKit = {
  blueprint: KitBlueprint;
  conflicts: ConfigConflict[];
  reconciliationProblems: string[];
  scopeCents: number;
  grandCents: number;
};

/** Assemble a complete, validated kit from params + frame + content. */
export function assembleKit(params: KitParams, input: AssembleInput): AssembledKit {
  const blueprint = emptyKitFrame(params);
  const k = blueprint.eventKit;

  k.meta.venueAddress = input.venueAddress;
  k.meta.xpmsTierDefault = input.xpmsTierDefault;
  k.zones = input.frame.zones;
  k.touchpoints = input.frame.touchpoints;
  k.phaseGates = input.frame.phaseGates.length ? input.frame.phaseGates : k.phaseGates;
  k.ros = input.frame.ros;
  k.rider = input.frame.rider;
  k.lines = input.lines;
  k.reserves = input.reserves;

  const scopeCents = scopeSubtotalCents(input.lines);
  const conflicts = validateConfiguration({
    scale: params.tier as KitScale,
    baseCostCents: scopeCents,
    selected: input.selectedOptions ?? [],
    zonesPresent: input.frame.zones.map((z) => z.zoneCode),
  });
  const reconciliationProblems = reconcile(input.lines);

  return {
    blueprint,
    conflicts,
    reconciliationProblems,
    scopeCents,
    grandCents: grandTotalCents(input.lines, input.reserves),
  };
}

// ── Row payloads for the Layer-A tables (pure) ─────────────────────────────
export type KitRowset = {
  event_kit: Record<string, unknown>;
  kit_zones: Record<string, unknown>[];
  kit_touchpoints: (Record<string, unknown> & { _zoneCode: string })[];
  kit_lines: (Record<string, unknown> & { _zoneCode?: string; _sense?: string })[];
  kit_phase_gates: Record<string, unknown>[];
  cues: Record<string, unknown>[];
};

export function kitToRows(
  blueprint: KitBlueprint,
  ctx: { orgId: string; scope: "canonical" | "external_example"; projectId?: string | null },
): KitRowset {
  const k = blueprint.eventKit;
  const base = { org_id: ctx.orgId, scope: ctx.scope };

  return {
    event_kit: {
      ...base,
      project_id: ctx.projectId ?? null,
      name: `${k.meta.event} — ${k.meta.generatedFromParams.artist ?? k.meta.scale}`,
      kit_scale: k.meta.scale,
      xpms_tier_default: k.meta.xpmsTierDefault ?? null,
      venue_name: k.meta.venue,
      venue_address: k.meta.venueAddress ?? null,
      atom_namespace: k.meta.atomNamespace,
      kit_version: k.meta.kitVersion,
      kit_state: "configured",
      params: k.meta.generatedFromParams,
      generated_from: "eventkit.generate",
    },
    kit_zones: k.zones.map((z, i) => ({
      ...base,
      zone_code: z.zoneCode,
      name: z.name,
      dimensions: z.dimensions ?? null,
      capacity: z.capacity ?? null,
      power_notes: z.powerNotes ?? null,
      av_notes: z.avNotes ?? null,
      loadin_notes: z.loadinNotes ?? null,
      sort_order: i,
    })),
    kit_touchpoints: k.touchpoints.map((t, i) => ({
      ...base,
      _zoneCode: t.zoneCode,
      sense: t.sense,
      design_intent: t.designIntent,
      delivering_element: t.deliveringElement ?? null,
      sort_order: i,
    })),
    kit_lines: k.lines.map((l, i) => ({
      ...base,
      _zoneCode: l.zoneCode,
      _sense: l.sense,
      urid: l.urid ?? null,
      department: l.department,
      team: l.team ?? null,
      class: null,
      item: l.item,
      description: l.description ?? null,
      discipline: l.discipline ?? null,
      xpms_phase: l.phase ?? null,
      tier: l.tier ?? null,
      xyz: l.xyz ?? null,
      line_type: l.lineType,
      quantity: l.quantity ?? null,
      rate_cents: l.rateCents ?? null,
      vendor: l.vendor ?? null,
      atom_id: l.atomId ?? null,
      sort_order: i,
    })),
    kit_phase_gates: k.phaseGates.map((g, i) => ({
      ...base,
      xpms_phase: g.phase,
      objective: g.objective,
      exit_checklist: g.exitChecklist,
      owner_role: g.ownerRole,
      key_deliverables: g.keyDeliverables,
      gate_state: g.gateState,
      sort_order: i,
    })),
    cues: k.ros.map((c) => ({
      ...base,
      lane: c.lane,
      label: c.label,
      description: c.description ?? null,
      owner_role: c.ownerRole,
      persona: null,
      xpms_phase: c.phase ?? null,
      done_when: c.doneWhen ?? null,
      duration_seconds: c.durationSeconds ?? null,
      status: "pending",
    })),
  };
}

export function summarize(a: AssembledKit): string {
  const k = a.blueprint.eventKit;
  const fmt = (c: number) => formatMoney(c, { fractionDigits: 0 });
  return [
    `${k.meta.event} (${k.meta.scale}) — ${k.meta.generatedFromParams.artist ?? ""}`.trim(),
    `  zones=${k.zones.length} touchpoints=${k.touchpoints.length} lines=${k.lines.length} ros=${k.ros.length} gates=${k.phaseGates.length} rider=${k.rider.length}`,
    `  scope=${fmt(a.scopeCents)} grand=${fmt(a.grandCents)}`,
    `  conflicts=${a.conflicts.length} reconcileProblems=${a.reconciliationProblems.length}`,
  ].join("\n");
}
