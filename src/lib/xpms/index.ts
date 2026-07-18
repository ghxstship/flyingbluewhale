/**
 * XPMS — Experiential Project Management System
 *
 * Canonical, in-process constants and helpers for the XTC Protocol™
 * codebook, the Six Tiers of Experience, the Eight Production Phases,
 * and the APS identifier convention.
 *
 * The database is the SSOT for line items; this module re-states the
 * spine (classes, tiers, phases) and offers the formatting helpers
 * the UI needs.
 */

export type XtcFace = "org" | "finance" | "both";
export type XpmsState = "uac" | "tpc";

export type XpmsClassCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type XpmsClass = {
  code: XpmsClassCode;
  name: string;
  domain: string;
  oneLine: string;
  /** Brand accent — used by UI surfaces to colour the class. */
  accent: string;
};

/** Whitepaper §5 — the ten classes. Order is the published order. */
export const XPMS_CLASSES: XpmsClass[] = [
  {
    code: 0,
    name: "EXECUTIVE",
    domain: "Leadership · Finance · Legal · HR · Strategy · BD · Compliance · Insurance",
    oneLine: "Org-level command and control.",
    accent: "#7c3aed",
  },
  {
    code: 1,
    name: "CREATIVE",
    domain: "Design · Art Direction · Brand · Digital Assets · Source Files · Renders · Content · IP",
    oneLine: "Authoring class. The work itself.",
    accent: "#ec4899",
  },
  {
    code: 2,
    name: "TALENT",
    domain: "Bookings · Programming · Curation · Talent Ops · Agency · Riders",
    oneLine: "Anyone who appears in front of the audience.",
    accent: "#f97316",
  },
  {
    code: 3,
    name: "MARKETING",
    domain: "Strategy · Social · PR · Press · Sponsorship Sales · Partnerships · CRM · Analytics",
    oneLine: "Audience acquisition and revenue partnerships.",
    accent: "#eab308",
  },
  {
    code: 4,
    name: "BUILD",
    domain: "Site Ops · Scenic · Construction · Installation · Wayfinding · Tents · Structures",
    oneLine: "Everything physically erected on site.",
    accent: "#a16207",
  },
  {
    code: 5,
    name: "PRODUCTION",
    domain: "Audio · Lighting · Video · Staging · Rigging · Power · SFX",
    oneLine: "Show systems — the technical envelope.",
    accent: "#dc2626",
  },
  {
    code: 6,
    name: "OPERATIONS",
    domain: "Event Ops · Labor · Logistics · Transport · Security · Medical · Permits · Workplace",
    oneLine: "People + flow. Labor and human-org unified.",
    accent: "#16a34a",
  },
  {
    code: 7,
    name: "EXPERIENCE",
    domain: "Guest Experience · Activations · Retail · Accessibility · Sponsor Fulfillment",
    oneLine: "Audience-facing surface.",
    accent: "#0891b2",
  },
  {
    code: 8,
    name: "HOSPITALITY",
    domain: "F&B · Bar · Catering · Lodging · VIP · Artist Hospitality",
    oneLine: "Care of body.",
    accent: "#be185d",
  },
  {
    code: 9,
    name: "TECHNOLOGY",
    domain: "Networking · IT · RF · Ticketing · Data · AR/VR/XR · Cybersecurity · AI",
    oneLine: "Bits and signals.",
    accent: "#0ea5e9",
  },
];

export const XPMS_CLASS_BY_CODE: Record<number, XpmsClass> = Object.fromEntries(XPMS_CLASSES.map((c) => [c.code, c]));

export type XpmsTier = "social" | "digital" | "virtual" | "physical" | "experiential" | "theatrical";

/** Whitepaper §6 — Six Tiers of Experience. */
export const XPMS_TIERS: { id: XpmsTier; num: string; label: string; pair: XpmsTier }[] = [
  { id: "social", num: "01", label: "Social", pair: "digital" },
  { id: "digital", num: "02", label: "Digital", pair: "social" },
  { id: "virtual", num: "03", label: "Virtual", pair: "physical" },
  { id: "physical", num: "04", label: "Physical", pair: "virtual" },
  { id: "experiential", num: "05", label: "Experiential", pair: "theatrical" },
  { id: "theatrical", num: "06", label: "Theatrical", pair: "experiential" },
];

/**
 * XPMS v08 8-Gate Lifecycle (locked Jun 2026) — the project macro-phase axis.
 * Mirrors the `public.xpms_phase` enum (`projects.xpms_phase`) and
 * `budgets.xpms_phase` (migration 0070). Order is the sequential macro arc.
 *
 * Distinct from the atom-level Eight Production Phases (`XPMS_ATOM_PHASES`
 * below / `public.xpms_atom_phase`) — see migration
 * 20260605170000_xpms_phase_v08_alignment.
 */
// XPMS 2.5: verb-consistent nine gates (Discovery→Discover, Procurement→Procure,
// + Amplify at gate 8, before Close). Mirrors the reconciled `xpms_phase` enum.
export type XpmsPhase =
  | "Discover"
  | "Design"
  | "Advance"
  | "Procure"
  | "Build"
  | "Install"
  | "Operate"
  | "Amplify"
  | "Close";

/** XPMS 2.5 nine-gate lifecycle — the project macro-phase. */
export const XPMS_PHASES: { id: XpmsPhase; num: number; label: string; platform: string }[] = [
  { id: "Discover", num: 1, label: "Discover", platform: "ATLVS" },
  { id: "Design", num: 2, label: "Design", platform: "ATLVS" },
  { id: "Advance", num: 3, label: "Advance", platform: "ATLVS · COMPVSS" },
  { id: "Procure", num: 4, label: "Procure", platform: "ATLVS" },
  { id: "Build", num: 5, label: "Build", platform: "COMPVSS" },
  { id: "Install", num: 6, label: "Install", platform: "COMPVSS" },
  { id: "Operate", num: 7, label: "Operate", platform: "COMPVSS · GVTEWAY" },
  { id: "Amplify", num: 8, label: "Amplify", platform: "ATLVS · GVTEWAY" },
  { id: "Close", num: 9, label: "Close", platform: "ATLVS" },
];

/**
 * Whitepaper §9 — Eight Production Phases. The atom-level temporal axis,
 * mirroring the `public.xpms_atom_phase` enum (`xpms_atoms.phase`). Every XTC
 * atom carries one of these. Kept distinct from the v08 project macro-phase
 * (`XPMS_PHASES`) per migration 20260605170000.
 */
export type XpmsAtomPhase =
  | "discovery"
  | "design"
  | "advance"
  | "procurement"
  | "build"
  | "install"
  | "operate"
  | "close";

/** Eight Production Phases (atom-level axis) — canonical XPMS lifecycle,
 *  aligned with the project macro-phase (XPMS_PHASES). */
export const XPMS_ATOM_PHASES: { id: XpmsAtomPhase; num: number; label: string; platform: string }[] = [
  { id: "discovery", num: 1, label: "Discovery", platform: "ATLVS" },
  { id: "design", num: 2, label: "Design", platform: "ATLVS" },
  { id: "advance", num: 3, label: "Advance", platform: "ATLVS · COMPVSS" },
  { id: "procurement", num: 4, label: "Procurement", platform: "ATLVS" },
  { id: "build", num: 5, label: "Build", platform: "COMPVSS" },
  { id: "install", num: 6, label: "Install", platform: "COMPVSS" },
  { id: "operate", num: 7, label: "Operate", platform: "COMPVSS · GVTEWAY" },
  { id: "close", num: 8, label: "Close", platform: "ATLVS" },
];

/** Whitepaper §8 — build the canonical APS identifier string. */
export function buildAtomIdentifier(parts: {
  org: string;
  evt?: string;
  yy?: number;
  ven?: string;
  classCode: number;
  divisionDigit: number;
  sectionDigit: number;
  zone: string;
  seq: number;
  rev?: string;
}): string {
  const evt = (parts.evt ?? "").toUpperCase();
  const yy = parts.yy != null ? String(parts.yy).padStart(2, "0") : "";
  const ven = (parts.ven ?? "").toUpperCase();
  const evtBlock = `${evt}${yy}${ven}`;
  const seq = String(parts.seq).padStart(4, "0");
  const rev = (parts.rev ?? "A").toUpperCase();
  return `${parts.org.toUpperCase()}-${evtBlock}-${parts.classCode}.${parts.divisionDigit}.${parts.sectionDigit}-${parts.zone.toUpperCase()}-${seq}${rev}`;
}

/** Format a five-digit XTC code for display: 53100 → "5.3.1.00". */
export function formatXtcCode(code: number): string {
  const s = String(code).padStart(5, "0");
  return `${s[0]}.${s[1]}.${s[2]}.${s.slice(3)}`;
}

/** Split a five-digit XTC code into its components. */
export function decomposeXtcCode(code: number): {
  classCode: number;
  divisionCode: number;
  sectionCode: number;
  lineDigit: number;
} {
  const s = String(code).padStart(5, "0");
  const classCode = Number(s[0]);
  const divisionDigit = Number(s[1]);
  const sectionDigit = Number(s[2]);
  return {
    classCode,
    divisionCode: classCode * 10 + divisionDigit,
    sectionCode: classCode * 100 + divisionDigit * 10 + sectionDigit,
    lineDigit: Number(s.slice(3)),
  };
}

/** Whitepaper §12 — geographic scope, tour structure, production style. */
export const GEO_SCOPES = ["local", "regional", "national", "international"] as const;
export type GeoScope = (typeof GEO_SCOPES)[number];

export const TOUR_STRUCTURES = ["single_stop", "multi_stop_sequential", "simultaneous_multi_city"] as const;
export type TourStructure = (typeof TOUR_STRUCTURES)[number];

export const PRODUCTION_STYLES = [
  "editorial",
  "documentary",
  "narrative",
  "spectacle",
  "intimate",
  "brutalist",
] as const;
export type ProductionStyle = (typeof PRODUCTION_STYLES)[number];

export const VARIANCE_REASONS = [
  "no_show",
  "substitution",
  "quantity_delta",
  "spec_change",
  "damage",
  "loss",
  "overtime",
  "weather",
  "client_change",
  "vendor_change",
  "other",
] as const;
export type VarianceReason = (typeof VARIANCE_REASONS)[number];
