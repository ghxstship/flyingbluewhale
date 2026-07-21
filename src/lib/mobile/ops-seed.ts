/**
 * COMPVSS Operations ledgers — shared view shapes + presentation vocab.
 *
 * The 8 Operations/Logistics field ledgers (Reports · Inspections · Logistics ·
 * Travel · Permits · Docks · Gate · Delivery) are now backed by real org-scoped
 * `field_*` tables (migration 20260721040956); `src/lib/mobile/ops-ledgers.ts`
 * reads them and maps rows onto the `Ops*` types below, which the surface
 * configs render. This module keeps only the row shapes + the tone/category
 * vocab (no seed data — that lives in the DB now).
 *
 * `tone` values (ok/info/warn/danger/neutral) map straight onto the mobile
 * `.ps-badge--{tone}` classes.
 */

export type OpsTone = "ok" | "info" | "warn" | "danger" | "neutral";

export const OPS_TONE: Record<string, OpsTone> = {
  Open: "warn",
  "Under Review": "info",
  Filed: "info",
  Closed: "neutral",
  Passed: "ok",
  "In Progress": "info",
  Flagged: "warn",
  Pending: "warn",
  Approved: "ok",
  Draft: "neutral",
  "On Hold": "info",
  Reimbursed: "ok",
  Rejected: "neutral",
  Arrived: "ok",
  "En Route": "info",
  Scheduled: "neutral",
  Delayed: "warn",
  Confirmed: "ok",
  Loaded: "info",
  Active: "ok",
  Expiring: "warn",
  // Logistics — Docks · Gate · Delivery (kit 34 v3.4).
  "At Dock": "ok",
  Waiting: "info",
  Cleared: "ok",
  Held: "warn",
  "In Transit": "info",
  Delivered: "ok",
  Staged: "neutral",
  Requested: "warn",
};

export type OpsReport = {
  id: string;
  t: string;
  type: string;
  sev?: string;
  by: string;
  area: string;
  time: string;
  status: string;
  icon: string;
};

export type OpsInspection = {
  id: string;
  t: string;
  /** Inspection domain — a canonical `inspection_templates.category` code
   *  (rigging/fire/electrical/ada/food_safety/security/foh/medical/
   *  sustainability/custom). Stable across venues (unlike `area`); the
   *  quick-pill field, rendered through the console's CATEGORY_LABEL map. */
  cat: string;
  area: string;
  done: number;
  checks: number;
  by: string;
  time: string;
  status: string;
  icon: string;
};

/**
 * Canonical inspection-category vocabulary — mirrors the
 * `inspection_templates.category` CHECK enum (console SSOT:
 * `/studio/inspections/templates`). Field surfaces render the code through this
 * map so the mobile ledger and the console stay one vocabulary.
 */
export const INSPECTION_CATEGORY_LABEL: Record<string, string> = {
  rigging: "Rigging",
  fire: "Fire",
  electrical: "Electrical",
  ada: "ADA",
  food_safety: "Food Safety",
  security: "Security",
  foh: "FOH",
  medical: "Medical",
  sustainability: "Sustainability",
  custom: "Custom",
};
/** Canonical pill order (enum order); present codes surface in this sequence. */
export const INSPECTION_CATEGORY_ORDER: readonly string[] = Object.values(INSPECTION_CATEGORY_LABEL);
export const inspectionCategoryLabel = (code: string): string => INSPECTION_CATEGORY_LABEL[code] ?? code;

export type OpsLogistics = {
  id: string;
  t: string;
  carrier: string;
  dock: string;
  when: string;
  dir: "in" | "out";
  status: string;
};

export type OpsTravel = {
  id: string;
  t: string;
  detail: string;
  when: string;
  status: string;
  icon: string;
};

export type OpsPermit = {
  id: string;
  t: string;
  auth: string;
  exp: string;
  status: string;
  icon: string;
};

// ── Logistics hub members — Docks · Gate · Delivery (kit 34 v3.4). The
// marshaling board (dock slots), the gate/vehicle check-in queue, and on-site
// delivery/chain-of-custody tickets.
export type DockSlot = {
  id: string;
  dock: string;
  time: string;
  dur: string;
  label: string;
  dir: "in" | "out";
  status: string;
};

export type GateEntry = {
  id: string;
  vehicle: string;
  carrier: string;
  driver: string;
  dock: string;
  cred: string;
  status: string;
  eta: string;
};

export type DeliveryTicket = {
  id: string;
  ref: string;
  t: string;
  from: string;
  to: string;
  pieces: number;
  runner: string;
  need: string;
  status: string;
  eta: string;
};
