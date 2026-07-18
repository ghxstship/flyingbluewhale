/**
 * XPMS Universal Budget Template v08 (8-Gate Lifecycle) — canonical
 * dropdown sources. Mirrors the `Lists` sheet of
 * XPMS_Universal_Budget_Template.xlsx and the enums declared in
 * migration 0070.
 *
 * Use these tuples to drive form selects so the UI and the database
 * speak the same vocabulary. Any drift here breaks the Summary
 * rollups (SUMIFS in the spreadsheet, group-by in the SQL).
 */

export const XPMS_DEPARTMENTS = [
  "Executive",
  "Creative",
  "Talent",
  "Marketing",
  "Build",
  "Production",
  "Operations",
  "Experience",
  "Hospitality",
  "Technology",
] as const;
export type XpmsDepartment = (typeof XPMS_DEPARTMENTS)[number];

export const XPMS_DISCIPLINES = [
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
export type XpmsDiscipline = (typeof XPMS_DISCIPLINES)[number];

/**
 * XPMS 2.5 nine-gate lifecycle (verb-consistent + Amplify). Order is
 * significant — sequential macro arc per LDP §NAMING DISCIPLINE (`xpms_phase`).
 */
export const XPMS_PHASES = [
  "Discover", // 1 — Brief approved, go decision made
  "Design", // 2 — Design package approved, scope locked
  "Advance", // 3 — Contracts & POs issued, budget baselined
  "Procure", // 4 — PO issued / deposit paid (committed cost)
  "Build", // 5 — Fab/construction complete, QC passed
  "Install", // 6 — Installed, commissioned, punch closed, accepted
  "Operate", // 7 — Operating acceptance / struck
  "Amplify", // 8 — Capture, media/press, broadcast, post-event campaigns
  "Close", // 9 — Reconciled, final cost report filed
] as const;
export type XpmsPhase = (typeof XPMS_PHASES)[number];

/**
 * DIM_PHASE — the XPMS 2.5 phase dimension SSOT: gate ordinal + 3-char code +
 * act (DEPART/SAIL/RETURN). Drives gate-ordered sorting and act-grouping of the
 * phase axis in the UI. Mirrors `XPMS_2.5_SSOT_Bible.xlsx#dim_phase`.
 */
export const DIM_PHASE = [
  { gate: 1, code: "DIS", phase: "Discover", act: "DEPART" },
  { gate: 2, code: "DSN", phase: "Design", act: "DEPART" },
  { gate: 3, code: "ADV", phase: "Advance", act: "DEPART" },
  { gate: 4, code: "PRC", phase: "Procure", act: "SAIL" },
  { gate: 5, code: "BLD", phase: "Build", act: "SAIL" },
  { gate: 6, code: "INS", phase: "Install", act: "SAIL" },
  { gate: 7, code: "OPR", phase: "Operate", act: "RETURN" },
  { gate: 8, code: "AMP", phase: "Amplify", act: "RETURN" },
  { gate: 9, code: "CLS", phase: "Close", act: "RETURN" },
] as const;
export type XpmsAct = (typeof DIM_PHASE)[number]["act"];

export const XPMS_TIERS = [
  "01 Social",
  "02 Digital",
  "03 Virtual",
  "04 Physical",
  "05 Experiential",
  "06 Theatrical",
] as const;
export type XpmsTier = (typeof XPMS_TIERS)[number];

export const XPMS_XYZ = ["X — Constant", "Y — Variable", "Z — Timeline/Phase"] as const;
export type XpmsXyz = (typeof XPMS_XYZ)[number];

/**
 * LINE TYPE classifies a budget row. Scope rolls into the phase curve;
 * the other four types roll up separately so they never inflate a
 * phase total. Fee is collected via the Project Billing / Draw
 * Schedule; Contingency is a reserve outside the work curve.
 */
export const XPMS_LINE_TYPES = ["Scope", "Fee", "Contingency", "Allowance", "Markup"] as const;
export type XpmsLineType = (typeof XPMS_LINE_TYPES)[number];

/**
 * Template default project billing / draw schedule — 50% Mobilization,
 * 30% Progress, 20% Final. Use as the initial population of
 * `project_billing_draws` when a new project is set up.
 */
export const XPMS_DEFAULT_DRAW_SCHEDULE: ReadonlyArray<{
  draw_name: string;
  trigger_label: string;
  trigger_phase: XpmsPhase | null;
  percentage: number;
  sort_order: number;
}> = [
  {
    draw_name: "Mobilization deposit",
    trigger_label: "Phase 1 · Discovery / contract",
    trigger_phase: "Discover",
    percentage: 0.5,
    sort_order: 1,
  },
  {
    draw_name: "Progress draw",
    trigger_label: "Phase 5 · Build start",
    trigger_phase: "Build",
    percentage: 0.3,
    sort_order: 2,
  },
  {
    draw_name: "Final balance",
    trigger_label: "Phase 8 · Close / final acceptance",
    trigger_phase: "Close",
    percentage: 0.2,
    sort_order: 3,
  },
];
