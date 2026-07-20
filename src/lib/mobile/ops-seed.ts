/**
 * COMPVSS Operations ledgers — canonical seed (kit 33 v3.0).
 *
 * The five Tier-1/2 Operations surfaces (Reports · Inspections · Logistics ·
 * Permits & Compliance · Travel & Lodging) ship as in-app field ledgers so
 * records live on-device (offline-first SSOT). Until dedicated backing tables
 * land, these render the kit's canonical seed VERBATIM — the `OPS_*` consts
 * from `design_handoff_compvss_field/runtime/app.jsx:948` (governance: "seed
 * exactly from the OPS_* consts"). The Pirates-of-the-Caribbean demo values are
 * the fixture the repo's screenshots / E2E match.
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
export const OPS_REPORTS: OpsReport[] = [
  { id: "rp1", t: "Barricade Gap · FOS Line", type: "Incident", sev: "High", by: "Joshamee Gibbs", area: "Stage L", time: "18:42", status: "Open", icon: "TriangleAlert" },
  { id: "rp2", t: "Gate 3 Daily Ops Summary", type: "Daily Report", by: "Joshamee Gibbs", area: "Gate 3", time: "17:00", status: "Filed", icon: "ClipboardList" },
  { id: "rp3", t: "Minor Slip · Dock B · No Injury", type: "Incident", sev: "Low", by: "Cotton", area: "Dock B", time: "14:20", status: "Under Review", icon: "TriangleAlert" },
  { id: "rp4", t: "Weather Hold Log · 13:00–16:00", type: "Ops Log", by: "Ops Desk", area: "Site-wide", time: "13:00", status: "Closed", icon: "Cloud" },
];

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
export const OPS_INSPECTIONS: OpsInspection[] = [
  { id: "in1", t: "Site Safety Walk · AM", cat: "security", area: "Gate 3", done: 18, checks: 18, by: "Joshamee Gibbs", time: "09:12", status: "Passed", icon: "ClipboardCheck" },
  { id: "in2", t: "Barricade Load Check", cat: "foh", area: "Stage L", done: 9, checks: 12, by: "Scrum", time: "18:30", status: "In Progress", icon: "Construction" },
  { id: "in3", t: "Egress & Exit Sweep", cat: "fire", area: "Fort Charles", done: 20, checks: 20, by: "James Norrington", time: "16:40", status: "Passed", icon: "DoorOpen" },
  { id: "in4", t: "Rigging Pre-Flight", cat: "rigging", area: "Stage L", done: 11, checks: 15, by: "Will Turner", time: "12:05", status: "Flagged", icon: "Anchor" },
];

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
export const OPS_LOGISTICS: OpsLogistics[] = [
  { id: "lg1", t: "Headliner Backline · Inbound", carrier: "Rock-It Cargo", dock: "Dock B", when: "Today · 14:00", dir: "in", status: "Arrived" },
  { id: "lg2", t: "LED Wall · Inbound", carrier: "Clair Global", dock: "Dock A", when: "Today · 19:30", dir: "in", status: "En Route" },
  { id: "lg3", t: "Empty Cases · Outbound", carrier: "Rock-It Cargo", dock: "Dock B", when: "Tomorrow · 07:00", dir: "out", status: "Scheduled" },
  { id: "lg4", t: "Catering Resupply", carrier: "Tortuga F&B", dock: "BOH", when: "Today · 20:00", dir: "in", status: "Delayed" },
];

export type OpsTravel = {
  id: string;
  t: string;
  detail: string;
  when: string;
  status: string;
  icon: string;
};
export const OPS_TRAVEL: OpsTravel[] = [
  { id: "tv1", t: "Flight · MIA → SJU", detail: "AA 1442 · Seat 14C", when: "Jun 22 · 08:10", status: "Confirmed", icon: "Plane" },
  { id: "tv2", t: "Hotel · Port Royal Inn", detail: "2 nights · King · #PR8842", when: "Jun 22–24", status: "Confirmed", icon: "BedDouble" },
  { id: "tv3", t: "Ground · Airport Pickup", detail: "Crew shuttle · Bay 3", when: "Jun 22 · 11:30", status: "Pending", icon: "Car" },
  { id: "tv4", t: "Per Diem · $65/day", detail: "3 days · loaded to pass", when: "Jun 22–24", status: "Loaded", icon: "Wallet" },
];

export type OpsPermit = {
  id: string;
  t: string;
  auth: string;
  exp: string;
  status: string;
  icon: string;
};
export const OPS_PERMITS: OpsPermit[] = [
  { id: "pm1", t: "Pyrotechnics · Restricted Zone", auth: "Fire Marshal", exp: "Exp Jun 24", status: "Active", icon: "Flame" },
  { id: "pm2", t: "Temporary Structure · Stage L", auth: "City Building Dept", exp: "Exp Jun 30", status: "Active", icon: "Building2" },
  { id: "pm3", t: "COI · Black Pearl Co.", auth: "Insurer", exp: "On file · exp Dec 31", status: "Active", icon: "ShieldCheck" },
  { id: "pm4", t: "Noise Variance · After 23:00", auth: "City", exp: "Pending renewal", status: "Expiring", icon: "Volume2" },
  { id: "pm5", t: "Rigging Cert · Will Turner", auth: "IATSE", exp: "Exp Jul 2 · renew soon", status: "Expiring", icon: "BadgeCheck" },
];

// ── Logistics hub members — Docks · Gate · Delivery (kit 34 v3.4). The
// marshaling board (dock slots), the gate/vehicle check-in queue, and on-site
// delivery/chain-of-custody tickets. Shipments live in OPS_LOGISTICS above.
export type DockSlot = {
  id: string;
  dock: string;
  time: string;
  dur: string;
  label: string;
  dir: "in" | "out";
  status: string;
};
export const DOCK_SLOTS: DockSlot[] = [
  { id: "ds1", dock: "Dock B", time: "14:00", dur: "90m", label: "Headliner Backline", dir: "in", status: "Arrived" },
  { id: "ds2", dock: "Dock B", time: "16:30", dur: "30m", label: "SFX Consumables", dir: "in", status: "En Route" },
  { id: "ds3", dock: "Dock B", time: "23:45", dur: "60m", label: "Load-Out · Count Pallets", dir: "out", status: "Scheduled" },
  { id: "ds4", dock: "Dock A", time: "19:30", dur: "90m", label: "LED Wall", dir: "in", status: "En Route" },
  { id: "ds5", dock: "BOH", time: "20:00", dur: "45m", label: "Catering Resupply", dir: "in", status: "Delayed" },
];

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
export const GATE_QUEUE: GateEntry[] = [
  { id: "gt1", vehicle: "53' Reefer · FL-88 4471", carrier: "Rock-It Cargo", driver: "Bootstrap Bill", dock: "Dock B", cred: "COI on file · verified", status: "At Dock", eta: "Arrived 13:52" },
  { id: "gt2", vehicle: "48' Dry Van · GA-20 8830", carrier: "Clair Global", driver: "Marty Brace", dock: "Dock A", cred: "COI on file · verified", status: "Waiting", eta: "ETA 19:20" },
  { id: "gt3", vehicle: "Sprinter · FL-90 1188", carrier: "Dutchman Freight", driver: "Cotton", dock: "Dock B", cred: "Day pass · verified", status: "Cleared", eta: "On site 16:05" },
  { id: "gt4", vehicle: "Box Truck · FL-14 2201", carrier: "Tortuga F&B", driver: "Scarlett", dock: "BOH", cred: "COI expired · flag", status: "Held", eta: "Delayed" },
];

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
export const DELIVERIES: DeliveryTicket[] = [
  { id: "dl1", ref: "MOV-318", t: "Amp Racks → Stage L", from: "Dock B", to: "Stage L · SR Wing", pieces: 4, runner: "Cotton", need: "Forklift", status: "In Transit", eta: "~5 min" },
  { id: "dl2", ref: "MOV-317", t: "Comms Kits → VIP", from: "Comms Cage · Dock B", to: "VIP · Crow's Nest", pieces: 6, runner: "Anamaria", need: "Cart", status: "Delivered", eta: "Confirmed 15:20" },
  { id: "dl3", ref: "MOV-319", t: "Catering Resupply → BOH Kitchen", from: "BOH", to: "Catering Tent", pieces: 9, runner: "Marty", need: "Pallet jack", status: "Staged", eta: "Awaiting dock" },
  { id: "dl4", ref: "MOV-316", t: "LED Panels → Stage L Deck", from: "Dock A", to: "Stage L · Deck", pieces: 24, runner: "Ragetti", need: "4 pax + carts", status: "Requested", eta: "On truck arrival" },
];

// ── Daily Report (kit 34 v3.7) — the end-of-day rollup aggregates shift notes
// from across the day into one filable/exportable record, alongside a summary
// derived from the ops ledgers (open incidents · deliveries · task progress).
export type ShiftNote = {
  id: string;
  by: string;
  role: string;
  shift: string;
  time: string;
  txt: string;
  tone: OpsTone;
};
export const SHIFT_NOTES: ShiftNote[] = [
  { id: "sn1", by: "Joshamee Gibbs", role: "Rigger", shift: "Day · Stage L", time: "15:31", txt: "Perimeter clear. Barricade gap at NE corner flagged to ops, temp fix in place.", tone: "warn" },
  { id: "sn2", by: "Scrum", role: "Site Lead", shift: "Day · FOS", time: "18:40", txt: "Front-of-stage line needs two more barricade sections before doors.", tone: "warn" },
  { id: "sn3", by: "Will Turner", role: "Audio Lead", shift: "Day · Stage L", time: "16:10", txt: "PA rung out, house-left array phase-aligned. Ready for soundcheck.", tone: "ok" },
  { id: "sn4", by: "Cotton", role: "Dock Crew", shift: "Night · Dock B", time: "23:58", txt: "Load-out staged. Missing meal break — noted on my timesheet.", tone: "info" },
  { id: "sn5", by: "Scarlett", role: "Catering", shift: "Day · BOH", time: "18:05", txt: "Crew dinner served 320 covers, no shortfalls.", tone: "ok" },
];
