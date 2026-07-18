/**
 * Event Kit Framework — canonical, brand-agnostic axis vocabulary + helpers.
 *
 * The framework is own-brand XPMS/ATLVS IP. It binds to existing canon and
 * introduces NO new budget/department/tier/phase/discipline vocabulary:
 *   • Departments / Tiers  → src/lib/eventkit/taxonomy.ts
 *   • Budget axes          → migration 0070 enums (budget_discipline/tier/xyz/line_type)
 *   • 8-gate phase         → migration 0070 budgets.xpms_phase CHECK + this file
 *   • URID registry        → public.xpms_registry (DEPT.TEAM.SECTION)
 *   • Atom IDs             → src/lib/siteplan/atom-id.ts (buildAtomId)
 *
 * Pattern mirrors src/lib/marketplace.ts + src/lib/workforce.ts:
 * enum tuples `as const` → derived string-literal types → small helpers.
 */
import { CLASSES, TIERS } from "./taxonomy";

// ── Kit scale (the configure-to-order selector) ────────────────────────────
export const KIT_SCALES = ["S", "M", "L", "XL"] as const;
export type KitScale = (typeof KIT_SCALES)[number];

export const KIT_STATES = ["draft", "configured", "advanced", "locked", "archived"] as const;
export type KitState = (typeof KIT_STATES)[number];

// ── XPMS 2.5 nine-gate lifecycle (verb-consistent + Amplify) ────────────────
// Matches budgets.xpms_phase CHECK and the Universal Budget Template exactly.
export const KIT_PHASES = [
  "Discover",
  "Design",
  "Advance",
  "Procure",
  "Build",
  "Install",
  "Operate",
  "Amplify",
  "Close",
] as const;
export type KitPhase = (typeof KIT_PHASES)[number];

export type KitPhaseDef = { id: KitPhase; num: number; absorbs: string; exitGate: string };
export const KIT_PHASE_DEFS: KitPhaseDef[] = [
  { id: "Discover", num: 1, absorbs: "(pre-design / pursuit)", exitGate: "Brief approved, go decision made" },
  { id: "Design", num: 2, absorbs: "Concept, Develop, Engineering", exitGate: "Design package approved, scope locked" },
  { id: "Advance", num: 3, absorbs: "Pre-Production", exitGate: "Contracts & POs issued, budget baselined" },
  {
    id: "Procure",
    num: 4,
    absorbs: "(long-lead purchasing)",
    exitGate: "PO issued / deposit paid (committed cost)",
  },
  { id: "Build", num: 5, absorbs: "Fabrication, Construction", exitGate: "Fab/construction complete, QC passed" },
  {
    id: "Install",
    num: 6,
    absorbs: "Logistics, Installation",
    exitGate: "Installed, commissioned, punch closed, accepted",
  },
  { id: "Operate", num: 7, absorbs: "Show, Strike", exitGate: "Operating acceptance / struck" },
  {
    id: "Amplify",
    num: 8,
    absorbs: "Capture, Media/Press, Broadcast, Post-Event",
    exitGate: "Capture delivered, media distributed, campaigns launched",
  },
  { id: "Close", num: 9, absorbs: "Wrap", exitGate: "Reconciled, final cost report filed" },
];

// ── Budget axes (verbatim from migration 0070 enums) ───────────────────────
export const KIT_DISCIPLINES = [
  "Live Entertainment",
  "Experiential",
  "Fabrication",
  "Construction",
  "Interior Design",
  "Procurement",
  "Broadcast & Content",
  "Corporate & Brand",
  "Hospitality & F&B",
  "Festival & Touring",
] as const;
export type KitDiscipline = (typeof KIT_DISCIPLINES)[number];

export const KIT_TIERS = [
  "01 Social",
  "02 Digital",
  "03 Virtual",
  "04 Physical",
  "05 Experiential",
  "06 Theatrical",
] as const;
export type KitTier = (typeof KIT_TIERS)[number];

export const KIT_XYZ = ["X — Constant", "Y — Variable", "Z — Timeline/Phase"] as const;
export type KitXyz = (typeof KIT_XYZ)[number];

export const KIT_LINE_TYPES = ["Scope", "Fee", "Contingency", "Allowance", "Markup"] as const;
export type KitLineType = (typeof KIT_LINE_TYPES)[number];

// ── Department backbone (re-exported from ghxstship canon) ──────────────────
export const KIT_DEPARTMENTS = CLASSES.map((c) => c.name.replace(/^\d+\s+/, "")) as readonly string[];
export type KitDepartment = (typeof KIT_DEPARTMENTS)[number];
export { CLASSES as KIT_CLASSES, TIERS as KIT_EXPERIENCE_TIERS };

// ── 5 Senses ───────────────────────────────────────────────────────────────
export const SENSES = ["sight", "sound", "scent", "taste", "touch"] as const;
export type Sense = (typeof SENSES)[number];

// ── Configure-to-order option taxonomy ─────────────────────────────────────
export const OPTION_TYPES = ["option", "substitution", "upgrade", "addon"] as const;
export type OptionType = (typeof OPTION_TYPES)[number];

export const GATE_STATES = ["pending", "in_progress", "passed", "blocked"] as const;
export type GateState = (typeof GATE_STATES)[number];

// ── Budget-band ↔ scale mapping (Casa validation bands) ─────────────────────
export type BudgetBand = { low: number; high: number | null }; // cents; high=null means open-ended
export const SCALE_BANDS: Record<KitScale, BudgetBand> = {
  S: { low: 0, high: 50_000_00 },
  M: { low: 50_000_00, high: 150_000_00 },
  L: { low: 150_000_00, high: 250_000_00 },
  XL: { low: 250_000_00, high: null },
};

export function scaleForBudgetCents(cents: number): KitScale {
  if (cents < SCALE_BANDS.S.high!) return "S";
  if (cents < SCALE_BANDS.M.high!) return "M";
  if (cents < SCALE_BANDS.L.high!) return "L";
  return "XL";
}

export function bandForScale(scale: KitScale): BudgetBand {
  return SCALE_BANDS[scale];
}

// ── A kit BOM line, six-axis tagged (mirrors public.kit_lines) ─────────────
export type KitLine = {
  urid?: string; // DEPT.TEAM.SECTION → xpms_registry
  department: KitDepartment | string;
  team?: string;
  item: string;
  description?: string;
  discipline?: KitDiscipline;
  phase?: KitPhase;
  tier?: KitTier;
  xyz?: KitXyz;
  lineType: KitLineType;
  zoneCode?: string;
  sense?: Sense; // links the line to a 5-senses touchpoint
  quantity?: number;
  rateCents?: number;
  vendor?: string;
  catalogCode?: string;
  atomId?: string;
};

export function lineAmountCents(l: KitLine): number {
  if (l.quantity == null || l.rateCents == null) return 0;
  return Math.round(l.quantity * l.rateCents);
}

// ── Rollups (Scope only) — mirror the budget_model.py axis cuts ────────────
const SCOPE = "Scope";
export type AxisKey = "department" | "discipline" | "phase" | "tier" | "xyz";

export function rollupScope(lines: KitLine[], axis: AxisKey): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of lines) {
    if (l.lineType !== SCOPE) continue;
    const k = (l[axis] ?? "—") as string;
    out[k] = (out[k] ?? 0) + lineAmountCents(l);
  }
  return out;
}

export function scopeSubtotalCents(lines: KitLine[]): number {
  return lines.filter((l) => l.lineType === SCOPE).reduce((s, l) => s + lineAmountCents(l), 0);
}

export type Reserves = { feeCents: number; contingencyCents: number; allowanceCents: number; markupCents: number };
export function grandTotalCents(lines: KitLine[], r: Reserves): number {
  return scopeSubtotalCents(lines) + r.feeCents + r.contingencyCents + r.allowanceCents + r.markupCents;
}

/** Assert every Scope rollup cut reconciles to the Scope subtotal. Returns problems (empty = OK). */
export function reconcile(lines: KitLine[]): string[] {
  const scope = scopeSubtotalCents(lines);
  const problems: string[] = [];
  for (const axis of ["department", "discipline", "phase", "tier", "xyz"] as AxisKey[]) {
    const sum = Object.values(rollupScope(lines, axis)).reduce((a, b) => a + b, 0);
    if (sum !== scope) problems.push(`${axis} rollup ${sum} != scope ${scope}`);
  }
  return problems;
}

// ── Configure-to-order validation — surface conflicts, never auto-resolve ───
export type KitOption = {
  code: string;
  optionType: OptionType;
  costDeltaCents: number;
  zoneRef?: string;
  dependsOn?: string[];
};
export type ConfigConflict = { kind: "over_budget" | "missing_dependency" | "zone_absent"; detail: string };

export function validateConfiguration(args: {
  scale: KitScale;
  baseCostCents: number;
  selected: KitOption[];
  zonesPresent: string[];
}): ConfigConflict[] {
  const conflicts: ConfigConflict[] = [];
  const band = bandForScale(args.scale);
  const total = args.baseCostCents + args.selected.reduce((s, o) => s + o.costDeltaCents, 0);
  if (band.high != null && total > band.high) {
    conflicts.push({
      kind: "over_budget",
      detail: `configured total ${total} exceeds ${args.scale} band ceiling ${band.high}`,
    });
  }
  const codes = new Set(args.selected.map((o) => o.code));
  for (const o of args.selected) {
    for (const dep of o.dependsOn ?? []) {
      if (!codes.has(dep)) conflicts.push({ kind: "missing_dependency", detail: `${o.code} requires ${dep}` });
    }
    if (o.zoneRef && !args.zonesPresent.includes(o.zoneRef)) {
      conflicts.push({ kind: "zone_absent", detail: `${o.code} targets zone ${o.zoneRef} not in venue` });
    }
  }
  return conflicts;
}

export function slugifyKit(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
