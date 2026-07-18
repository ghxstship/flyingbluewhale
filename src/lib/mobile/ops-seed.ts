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
  area: string;
  done: number;
  checks: number;
  by: string;
  time: string;
  status: string;
  icon: string;
};
export const OPS_INSPECTIONS: OpsInspection[] = [
  { id: "in1", t: "Site Safety Walk · AM", area: "Gate 3", done: 18, checks: 18, by: "Joshamee Gibbs", time: "09:12", status: "Passed", icon: "ClipboardCheck" },
  { id: "in2", t: "Barricade Load Check", area: "Stage L", done: 9, checks: 12, by: "Scrum", time: "18:30", status: "In Progress", icon: "Construction" },
  { id: "in3", t: "Egress & Exit Sweep", area: "Fort Charles", done: 20, checks: 20, by: "James Norrington", time: "16:40", status: "Passed", icon: "DoorOpen" },
  { id: "in4", t: "Rigging Pre-Flight", area: "Stage L", done: 11, checks: 15, by: "Will Turner", time: "12:05", status: "Flagged", icon: "Anchor" },
];

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
