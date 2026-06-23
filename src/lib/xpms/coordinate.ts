import "server-only";

import { createClient } from "@/lib/supabase/server";
import { XPMS_CLASSES, XPMS_ATOM_PHASES, type XpmsAtomPhase } from "@/lib/xpms";

/**
 * §9 Coordinate Lens — roll up metrics per (class × phase) cell from the live
 * XPMS WBS. Atoms (`xpms_atoms`) carry `class_code` 0–9 + `phase`; tasks link
 * to a cell via `xpms_atom_id` and carry `effort` + `assigned_to`. The matrix
 * is an analytical lens over existing records, never a new taxonomy.
 *
 * Pluggable metrics (§9.3), all computed from real rows:
 *   - `open`        — atom count in the cell (default bottleneck signal).
 *   - `value`       — Σ atom cost (dollars) — $ exposure per coordinate.
 *   - `load`        — Σ task effort (hours/pts) resolving to the cell.
 *   - `risk`        — count of overdue, not-done tasks in the cell (gate-slip).
 *   - `utilization` — load ÷ capacity (%), capacity = assignees × the per-person
 *                     phase baseline (`PERSON_PHASE_CAPACITY` — an org-tunable
 *                     default; the roster/time-off-derived capacity is the
 *                     documented next step).
 */
export const COORDINATE_METRICS = ["open", "value", "load", "risk", "utilization"] as const;
export type CoordinateMetric = (typeof COORDINATE_METRICS)[number];

export const COORDINATE_METRIC_LABELS: Record<CoordinateMetric, string> = {
  open: "Open items",
  value: "$ exposure",
  load: "Effort load",
  risk: "At-risk",
  utilization: "Utilization",
};

/** Assumed per-person, per-phase capacity (effort units) until roster-derived. */
export const PERSON_PHASE_CAPACITY = 80;

export type CoordinateRollupCell = { classCode: number; phase: XpmsAtomPhase; value: number };
export type CoordinateRollup = { cells: CoordinateRollupCell[]; total: number; peak: CoordinateRollupCell | null };
export type CoordinateRollups = Record<CoordinateMetric, CoordinateRollup>;

const PHASE_IDS = new Set<string>(XPMS_ATOM_PHASES.map((p) => p.id));
const CLASS_CODES = new Set<number>(XPMS_CLASSES.map((c) => c.code));
const cellKey = (c: number, p: string) => `${c}|${p}`;

function toRollup(acc: Map<string, number>): CoordinateRollup {
  let peak: CoordinateRollupCell | null = null;
  let total = 0;
  const cells: CoordinateRollupCell[] = [];
  for (const [key, value] of acc) {
    total += value;
    if (value <= 0) continue;
    const [cc, phase] = key.split("|");
    const cell: CoordinateRollupCell = { classCode: Number(cc), phase: phase as XpmsAtomPhase, value };
    cells.push(cell);
    if (!peak || value > peak.value) peak = cell;
  }
  return { cells, total, peak };
}

/**
 * Compute every metric for the grid in one pass (2 queries: atoms + tasks).
 * Scoped to one project when `projectId` is given, else the whole org
 * (portfolio altitude).
 */
export async function rollupCoordinate(orgId: string, opts?: { projectId?: string }): Promise<CoordinateRollups> {
  const supabase = await createClient();

  let atomQ = supabase.from("xpms_atoms").select("id, class_code, phase, cost_cents").eq("org_id", orgId);
  let taskQ = supabase
    .from("tasks")
    .select("xpms_atom_id, effort, assigned_to, due_at, task_state")
    .eq("org_id", orgId)
    .not("xpms_atom_id", "is", null);
  if (opts?.projectId) {
    atomQ = atomQ.eq("project_id", opts.projectId);
    taskQ = taskQ.eq("project_id", opts.projectId);
  }
  const [{ data: atomData }, { data: taskData }] = await Promise.all([atomQ, taskQ]);

  const atoms = (atomData ?? []) as { id: string; class_code: number; phase: string; cost_cents: number | null }[];
  const tasks = (taskData ?? []) as {
    xpms_atom_id: string | null;
    effort: number | null;
    assigned_to: string | null;
    due_at: string | null;
    task_state: string;
  }[];

  const atomCell = new Map<string, { c: number; p: string }>();
  const open = new Map<string, number>();
  const value = new Map<string, number>();
  for (const a of atoms) {
    if (!CLASS_CODES.has(a.class_code) || !PHASE_IDS.has(a.phase)) continue;
    atomCell.set(a.id, { c: a.class_code, p: a.phase });
    const k = cellKey(a.class_code, a.phase);
    open.set(k, (open.get(k) ?? 0) + 1);
    value.set(k, (value.get(k) ?? 0) + (a.cost_cents ?? 0) / 100);
  }

  const load = new Map<string, number>();
  const risk = new Map<string, number>();
  const assigneesByCell = new Map<string, Set<string>>();
  const now = Date.now();
  const done = new Set(["delivered", "done", "completed", "closed", "redeemed"]);
  for (const t of tasks) {
    const cell = t.xpms_atom_id ? atomCell.get(t.xpms_atom_id) : undefined;
    if (!cell) continue;
    const k = cellKey(cell.c, cell.p);
    load.set(k, (load.get(k) ?? 0) + (t.effort ?? 0));
    if (t.assigned_to) {
      let s = assigneesByCell.get(k);
      if (!s) assigneesByCell.set(k, (s = new Set()));
      s.add(t.assigned_to);
    }
    const overdue = t.due_at && new Date(t.due_at).getTime() < now && !done.has(t.task_state);
    if (overdue) risk.set(k, (risk.get(k) ?? 0) + 1);
  }

  const utilization = new Map<string, number>();
  for (const [k, l] of load) {
    const heads = assigneesByCell.get(k)?.size ?? 0;
    const capacity = heads * PERSON_PHASE_CAPACITY;
    if (capacity > 0) utilization.set(k, Math.round((l / capacity) * 100));
  }

  return {
    open: toRollup(open),
    value: toRollup(value),
    load: toRollup(load),
    risk: toRollup(risk),
    utilization: toRollup(utilization),
  };
}

/** Serializable cells for the client matrix, per metric. */
export function rollupToData(r: CoordinateRollups): Record<CoordinateMetric, CoordinateRollupCell[]> {
  return {
    open: r.open.cells,
    value: r.value.cells,
    load: r.load.cells,
    risk: r.risk.cells,
    utilization: r.utilization.cells,
  };
}

/** The atoms resolving to one cell (the microproject work list). */
export async function listCellAtoms(
  orgId: string,
  projectId: string,
  classCode: number,
  phase: XpmsAtomPhase,
): Promise<{
  atoms: { id: string; identifier: string; name: string; cost_cents: number | null; currency: string; state: string }[];
  costTotal: number;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("xpms_atoms")
    .select("id, identifier, name, cost_cents, currency, state")
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .eq("class_code", classCode)
    .eq("phase", phase)
    .order("sequence_no", { ascending: true });
  const atoms = (data ?? []) as {
    id: string;
    identifier: string;
    name: string;
    cost_cents: number | null;
    currency: string;
    state: string;
  }[];
  const costTotal = atoms.reduce((s, a) => s + (a.cost_cents ?? 0), 0) / 100;
  return { atoms, costTotal };
}

export type ForecastCell = { userId: string; phase: XpmsAtomPhase; load: number };
export type ForecastRow = { userId: string; byPhase: Map<XpmsAtomPhase, number>; total: number };

/**
 * §9.3 workload forecast — person (down) × phase (across) effort load, pivoted
 * from the same task→atom resolution. Capacity per person per phase is the
 * `PERSON_PHASE_CAPACITY` baseline; utilization = load ÷ capacity.
 */
export async function forecastByPerson(
  orgId: string,
  opts?: { projectId?: string },
): Promise<{ rows: ForecastRow[]; phases: XpmsAtomPhase[] }> {
  const supabase = await createClient();
  let atomQ = supabase.from("xpms_atoms").select("id, phase").eq("org_id", orgId);
  let taskQ = supabase
    .from("tasks")
    .select("xpms_atom_id, effort, assigned_to")
    .eq("org_id", orgId)
    .not("xpms_atom_id", "is", null)
    .not("assigned_to", "is", null);
  if (opts?.projectId) {
    atomQ = atomQ.eq("project_id", opts.projectId);
    taskQ = taskQ.eq("project_id", opts.projectId);
  }
  const [{ data: atomData }, { data: taskData }] = await Promise.all([atomQ, taskQ]);
  const atomPhase = new Map<string, string>();
  for (const a of (atomData ?? []) as { id: string; phase: string }[]) {
    if (PHASE_IDS.has(a.phase)) atomPhase.set(a.id, a.phase);
  }
  const byPerson = new Map<string, Map<XpmsAtomPhase, number>>();
  for (const t of (taskData ?? []) as { xpms_atom_id: string | null; effort: number | null; assigned_to: string | null }[]) {
    const phase = t.xpms_atom_id ? atomPhase.get(t.xpms_atom_id) : undefined;
    if (!phase || !t.assigned_to) continue;
    let m = byPerson.get(t.assigned_to);
    if (!m) byPerson.set(t.assigned_to, (m = new Map()));
    const ph = phase as XpmsAtomPhase;
    m.set(ph, (m.get(ph) ?? 0) + (t.effort ?? 0));
  }
  const rows: ForecastRow[] = [...byPerson.entries()]
    .map(([userId, byPhase]) => ({
      userId,
      byPhase,
      total: [...byPhase.values()].reduce((s, v) => s + v, 0),
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);
  return { rows, phases: XPMS_ATOM_PHASES.map((p) => p.id) };
}
