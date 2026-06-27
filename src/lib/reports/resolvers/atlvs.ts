import type { MetricResolver, ResolverMap } from "./types";
import { countWhere, NOT_COMPUTED } from "./types";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * ATLVS KPI resolvers (kit v6.3 Reports engine). Every query is org-scoped via
 * `.eq("org_id", orgId)`. Units follow the formatter contract: currency in MAJOR
 * units (dollars; *_cents / 100), pct in 0–100, days as a day count, int/score/
 * ratio as the raw number. Return `null` when the source signal is absent — the
 * engine renders "—". Never fabricate.
 */

// ---------------------------------------------------------------------------
// Small org-scoped query helpers. Dynamic table names → the typed client's
// `from()` collapses to `never`, so we route through the sanctioned
// `LooseSupabase` escape hatch (RLS stays the authz boundary), same as
// `countWhere`.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

/** Fetch selected columns for an org-scoped table (optional eq/in filters). */
async function rows(
  ctx: { db: unknown; orgId: string },
  table: string,
  columns: string,
  filters: { eq?: Record<string, string | number | boolean>; isNull?: string[]; notNull?: string[] } = {},
): Promise<Row[] | null> {
  let q = (ctx.db as LooseSupabase).from(table).select(columns).eq("org_id", ctx.orgId);
  for (const [k, v] of Object.entries(filters.eq ?? {})) q = q.eq(k, v);
  for (const k of filters.isNull ?? []) q = q.is(k, null);
  for (const k of filters.notNull ?? []) q = q.not(k, "is", null);
  const { data, error } = await q;
  if (error || !data) return null;
  return data as Row[];
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);
const sum = (list: Row[], key: string): number => list.reduce((a, r) => a + num(r[key]), 0);

const DAY_MS = 86_400_000;
const daysBetween = (a: string | number | Date, b: string | number | Date): number =>
  (new Date(b).getTime() - new Date(a).getTime()) / DAY_MS;

// ===========================================================================
// SCHEDULE
// ===========================================================================

/** % of completed activities whose actual/effective finish met the plan.
 *  We lack an actual-finish column, so we proxy "on time" as completed
 *  (percent_complete >= 100) activities that are NOT past their planned finish
 *  with float consumed (non-negative total_float_days). */
const on_time_delivery: MetricResolver = async (ctx) => {
  const acts = await rows(ctx, "schedule_activities", "percent_complete,total_float_days", {
    notNull: ["percent_complete"],
  });
  if (!acts || acts.length === 0) return null;
  const done = acts.filter((a) => num(a.percent_complete) >= 100);
  if (done.length === 0) return null;
  const onTime = done.filter((a) => num(a.total_float_days) >= 0).length;
  return (onTime / done.length) * 100;
};

/** Mean schedule completion across all activities (0–100). */
const milestone_completion: MetricResolver = async (ctx) => {
  const acts = await rows(ctx, "schedule_activities", "percent_complete", { notNull: ["percent_complete"] });
  if (!acts || acts.length === 0) return null;
  return sum(acts, "percent_complete") / acts.length;
};

/** Mean total float (days) across activities — negative = behind, positive =
 *  slack. A schedule-variance proxy in days. */
const schedule_variance: MetricResolver = async (ctx) => {
  const acts = await rows(ctx, "schedule_activities", "total_float_days", { notNull: ["total_float_days"] });
  if (!acts || acts.length === 0) return null;
  return sum(acts, "total_float_days") / acts.length;
};

// ===========================================================================
// BUDGET / FINANCE (budgets is the per-line cost ledger)
// ===========================================================================

/** (actual − budget) / budget × 100 across all budget lines. Positive = over. */
const budget_variance: MetricResolver = async (ctx) => {
  const b = await rows(ctx, "budgets", "amount_cents,actual_cents,spent_cents");
  if (!b || b.length === 0) return null;
  const budget = sum(b, "amount_cents");
  if (budget === 0) return null;
  // prefer actual_cents; fall back to spent_cents per line
  const actual = b.reduce((a, r) => a + (r.actual_cents != null ? num(r.actual_cents) : num(r.spent_cents)), 0);
  return ((actual - budget) / budget) * 100;
};

/** (collected revenue − cost) / revenue × 100. Revenue = paid invoices;
 *  cost = budget spend. */
const gross_margin: MetricResolver = async (ctx) => {
  const inv = await rows(ctx, "invoices", "amount_cents,invoice_state", { eq: { invoice_state: "paid" }, isNull: ["deleted_at"] });
  const b = await rows(ctx, "budgets", "spent_cents,actual_cents");
  if (!inv || inv.length === 0) return null;
  const revenue = sum(inv, "amount_cents");
  if (revenue === 0) return null;
  const cost = (b ?? []).reduce((a, r) => a + (r.actual_cents != null ? num(r.actual_cents) : num(r.spent_cents)), 0);
  return ((revenue - cost) / revenue) * 100;
};

/** Estimate-at-completion minus actual to date (dollars), summed across lines.
 *  Uses eac_cents where present, else forecast_cents, else budget amount. */
const cost_to_complete: MetricResolver = async (ctx) => {
  const b = await rows(ctx, "budgets", "amount_cents,actual_cents,spent_cents,eac_cents,forecast_cents");
  if (!b || b.length === 0) return null;
  const ctc = b.reduce((a, r) => {
    const eac = r.eac_cents != null ? num(r.eac_cents) : r.forecast_cents != null ? num(r.forecast_cents) : num(r.amount_cents);
    const actual = r.actual_cents != null ? num(r.actual_cents) : num(r.spent_cents);
    return a + Math.max(eac - actual, 0);
  }, 0);
  return ctc / 100;
};

/** Spend / budget × 100 across all budget lines. */
const burn_rate: MetricResolver = async (ctx) => {
  const b = await rows(ctx, "budgets", "amount_cents,actual_cents,spent_cents");
  if (!b || b.length === 0) return null;
  const budget = sum(b, "amount_cents");
  if (budget === 0) return null;
  const spent = b.reduce((a, r) => a + (r.actual_cents != null ? num(r.actual_cents) : num(r.spent_cents)), 0);
  return (spent / budget) * 100;
};

/** Sum of approved change-order deltas (dollars). */
const change_order_value: MetricResolver = async (ctx) => {
  const co = await rows(ctx, "change_orders", "total_delta_cents,change_order_state", {
    eq: { change_order_state: "approved" },
    isNull: ["deleted_at"],
  });
  if (!co) return null;
  if (co.length === 0) return 0;
  return sum(co, "total_delta_cents") / 100;
};

/** EAC vs final actual divergence proxy: 100 − |budget − forecast| / budget × 100.
 *  Higher = forecast tracked closer to the committed budget. */
const forecast_accuracy: MetricResolver = async (ctx) => {
  const b = await rows(ctx, "budgets", "amount_cents,forecast_cents,eac_cents");
  if (!b || b.length === 0) return null;
  const budget = sum(b, "amount_cents");
  if (budget === 0) return null;
  const forecast = b.reduce((a, r) => a + (r.eac_cents != null ? num(r.eac_cents) : num(r.forecast_cents)), 0);
  if (forecast === 0) return null;
  return Math.max(0, 100 - (Math.abs(budget - forecast) / budget) * 100);
};

// ===========================================================================
// RESOURCE / UTILIZATION
// ===========================================================================

/** Mean activity progress weighted as a crewed-utilization proxy: average
 *  percent_complete of in-flight activities (started, not finished). */
const resource_utilization: MetricResolver = async (ctx) => {
  const acts = await rows(ctx, "schedule_activities", "percent_complete", { notNull: ["percent_complete"] });
  if (!acts || acts.length === 0) return null;
  const inFlight = acts.filter((a) => num(a.percent_complete) > 0 && num(a.percent_complete) < 100);
  if (inFlight.length === 0) return null;
  return sum(inFlight, "percent_complete") / inFlight.length;
};

/** Billable minutes / total minutes × 100 across timesheets. */
const billable_utilization: MetricResolver = async (ctx) => {
  const ts = await rows(ctx, "timesheets", "total_minutes,billable_minutes");
  if (!ts || ts.length === 0) return null;
  const total = sum(ts, "total_minutes");
  if (total === 0) return null;
  return (sum(ts, "billable_minutes") / total) * 100;
};

// ===========================================================================
// SALES / PIPELINE
// ===========================================================================

/** Open lead pipeline value (dollars) — stages still in flight. */
const pipeline_value: MetricResolver = async (ctx) => {
  const leads = await rows(ctx, "leads", "estimated_value_cents,stage");
  if (!leads) return null;
  const open = leads.filter((l) => !["won", "lost"].includes(String(l.stage)));
  if (open.length === 0) return 0;
  return sum(open, "estimated_value_cents") / 100;
};

/** Active projects count. */
const active_projects: MetricResolver = (ctx) =>
  countWhere(ctx, "projects", { project_state: "active", deleted_at: null });

/** At-risk projects: active projects whose budget lines are over budget
 *  (actual/spent > committed amount). Counted distinct by project. */
const at_risk_projects: MetricResolver = async (ctx) => {
  const projs = await rows(ctx, "projects", "id,project_state", {
    eq: { project_state: "active" },
    isNull: ["deleted_at"],
  });
  if (!projs || projs.length === 0) return null;
  const b = await rows(ctx, "budgets", "project_id,amount_cents,actual_cents,spent_cents");
  if (!b || b.length === 0) return 0;
  const byProj = new Map<string, { budget: number; spent: number }>();
  for (const r of b) {
    const pid = String(r.project_id ?? "");
    if (!pid) continue;
    const acc = byProj.get(pid) ?? { budget: 0, spent: 0 };
    acc.budget += num(r.amount_cents);
    acc.spent += r.actual_cents != null ? num(r.actual_cents) : num(r.spent_cents);
    byProj.set(pid, acc);
  }
  const activeIds = new Set(projs.map((p) => String(p.id)));
  let atRisk = 0;
  for (const [pid, v] of byProj) if (activeIds.has(pid) && v.budget > 0 && v.spent > v.budget) atRisk += 1;
  return atRisk;
};

/** Portfolio health score 0–100: blends share of active (non-archived) projects
 *  and (1 − over-budget share). */
const project_health: MetricResolver = async (ctx) => {
  const projs = await rows(ctx, "projects", "id,project_state", { isNull: ["deleted_at"] });
  if (!projs || projs.length === 0) return null;
  const live = projs.filter((p) => !["archived"].includes(String(p.project_state)));
  if (live.length === 0) return null;
  const activeShare = projs.filter((p) => ["active", "complete"].includes(String(p.project_state))).length / projs.length;
  const atRisk = await at_risk_projects(ctx);
  const riskShare = atRisk != null && live.length > 0 ? atRisk / live.length : 0;
  return Math.round(Math.max(0, Math.min(100, (activeShare * 0.6 + (1 - riskShare) * 0.4) * 100)));
};

/** Signed/approved sales not yet invoiced-as-paid — proxied as the value of
 *  signed proposals (dollars). */
const backlog_value: MetricResolver = async (ctx) => {
  const props = await rows(ctx, "proposals", "amount_cents,proposal_state", { isNull: ["deleted_at"] });
  if (!props) return null;
  const won = props.filter((p) => ["signed", "approved"].includes(String(p.proposal_state)));
  if (won.length === 0) return 0;
  return sum(won, "amount_cents") / 100;
};

// ===========================================================================
// AR / INVOICING
// ===========================================================================

/** Days sales outstanding: mean (paid_at − issued_at) over paid invoices. */
const dso: MetricResolver = async (ctx) => {
  const inv = await rows(ctx, "invoices", "issued_at,paid_at,invoice_state", {
    eq: { invoice_state: "paid" },
    notNull: ["paid_at", "issued_at"],
    isNull: ["deleted_at"],
  });
  if (!inv || inv.length === 0) return null;
  const spans = inv
    .map((r) => daysBetween(r.issued_at as string, r.paid_at as string))
    .filter((d) => Number.isFinite(d) && d >= 0);
  if (spans.length === 0) return null;
  return spans.reduce((a, d) => a + d, 0) / spans.length;
};

/** Share of outstanding AR value that is overdue (0–100). */
const ar_overdue: MetricResolver = async (ctx) => {
  const inv = await rows(ctx, "invoices", "amount_cents,invoice_state,due_at", { isNull: ["deleted_at"] });
  if (!inv) return null;
  const outstanding = inv.filter((r) => ["sent", "overdue"].includes(String(r.invoice_state)));
  const outValue = sum(outstanding, "amount_cents");
  if (outValue === 0) return null;
  const today = Date.now();
  const overdueValue = outstanding
    .filter((r) => String(r.invoice_state) === "overdue" || (r.due_at && new Date(r.due_at as string).getTime() < today))
    .reduce((a, r) => a + num(r.amount_cents), 0);
  return (overdueValue / outValue) * 100;
};

// ===========================================================================
// WIN RATE / PROCUREMENT / RISK
// ===========================================================================

/** Won proposals / decided proposals × 100. Decided = signed/approved/rejected/
 *  expired; won = signed or approved. */
const win_rate: MetricResolver = async (ctx) => {
  const props = await rows(ctx, "proposals", "proposal_state", { isNull: ["deleted_at"] });
  if (!props) return null;
  const decided = props.filter((p) => ["signed", "approved", "rejected", "expired"].includes(String(p.proposal_state)));
  if (decided.length === 0) return null;
  const won = decided.filter((p) => ["signed", "approved"].includes(String(p.proposal_state))).length;
  return (won / decided.length) * 100;
};

/** Vendor on-time delivery. The PO schema carries no promised-vs-actual delivery
 *  dates, so a true OTD rate isn't computable — return null rather than proxy. */
const vendor_otd: MetricResolver = NOT_COMPUTED;

/** Risk exposure (dollars): committed budget on at-risk (over-budget) active
 *  projects — the dollars in jeopardy. */
const risk_exposure: MetricResolver = async (ctx) => {
  const projs = await rows(ctx, "projects", "id,project_state", {
    eq: { project_state: "active" },
    isNull: ["deleted_at"],
  });
  if (!projs || projs.length === 0) return null;
  const b = await rows(ctx, "budgets", "project_id,amount_cents,actual_cents,spent_cents");
  if (!b || b.length === 0) return 0;
  const activeIds = new Set(projs.map((p) => String(p.id)));
  const byProj = new Map<string, { budget: number; spent: number }>();
  for (const r of b) {
    const pid = String(r.project_id ?? "");
    if (!activeIds.has(pid)) continue;
    const acc = byProj.get(pid) ?? { budget: 0, spent: 0 };
    acc.budget += num(r.amount_cents);
    acc.spent += r.actual_cents != null ? num(r.actual_cents) : num(r.spent_cents);
    byProj.set(pid, acc);
  }
  let exposureCents = 0;
  for (const v of byProj.values()) if (v.budget > 0 && v.spent > v.budget) exposureCents += v.budget;
  return exposureCents / 100;
};

export const atlvsResolvers: ResolverMap = {
  on_time_delivery,
  milestone_completion,
  schedule_variance,
  budget_variance,
  gross_margin,
  cost_to_complete,
  burn_rate,
  change_order_value,
  resource_utilization,
  billable_utilization,
  pipeline_value,
  active_projects,
  at_risk_projects,
  forecast_accuracy,
  project_health,
  backlog_value,
  dso,
  ar_overdue,
  win_rate,
  vendor_otd,
  risk_exposure,
};
