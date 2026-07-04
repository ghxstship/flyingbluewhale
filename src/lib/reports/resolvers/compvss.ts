import type { MetricResolver, ResolverMap } from "./types";
import { countWhere, NOT_COMPUTED } from "./types";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * COMPVSS KPI resolvers (kit v6.3 Reports engine).
 *
 * Site & Venue Operations metrics, computed from real org-scoped tables. Each
 * resolver returns a value in its declared unit (currency → dollars, pct → 0–100,
 * float/int → the number) or `null` when the source data isn't present in the
 * live schema. Org-scope is applied on every query via `.eq("org_id", orgId)`.
 *
 * Source-table notes (verified against the live schema):
 *  - roster/staffing fill is modeled by `public.shifts` (one row per scheduled
 *    workforce slot; `attendance` enum, `workforce_member_id` = the filled seat).
 *  - There are no `pull_sheets`, `maintenance_logs`/maintenance-schedule, waste,
 *    energy, turnaround, or overtime-flag tables — metrics that depend on those
 *    return `null` rather than fabricating a number.
 */

/** OSHA TRIR scaling factor: recordable cases × 200,000 / hours worked. */
const OSHA_HOURS_BASE = 200_000;

// Dynamic table names → sanctioned LooseSupabase escape hatch (RLS stays the
// authz boundary), same contract as `countWhere`. No raw `any`.
type AnyDB = LooseSupabase;

/** labor_fill_rate (pct) — filled shift seats / total scheduled shift seats. */
const labor_fill_rate: MetricResolver = async (ctx) => {
  const total = await countWhere(ctx, "shifts", {});
  if (!total) return null;
  const filledTotal = await (ctx.db as unknown as AnyDB)
    .from("shifts")
    .select("workforce_member_id", { count: "exact", head: true })
    .eq("org_id", ctx.orgId)
    .not("workforce_member_id", "is", null);
  if (filledTotal.error) return null;
  const filled = filledTotal.count ?? 0;
  return (filled / total) * 100;
};

/**
 * overtime_pct (pct) — share of timesheet minutes worked beyond straight time.
 * The schema carries `total_minutes`/`billable_minutes` but no overtime flag or
 * OT bucket, so overtime can't be isolated. Returns null.
 */
const overtime_pct: MetricResolver = NOT_COMPUTED;

/**
 * labor_cost_per_head (currency, dollars) — total timesheet cost / distinct
 * worked party. `timesheets.total_amount_minor` is cents.
 */
const labor_cost_per_head: MetricResolver = async (ctx) => {
  const { data, error } = await (ctx.db as unknown as AnyDB)
    .from("timesheets")
    .select("party_id,total_amount_minor")
    .eq("org_id", ctx.orgId);
  if (error || !data || data.length === 0) return null;
  let totalCents = 0;
  const heads = new Set<string>();
  for (const r of data as { party_id: string | null; total_amount_minor: number | null }[]) {
    totalCents += r.total_amount_minor ?? 0;
    if (r.party_id) heads.add(r.party_id);
  }
  if (heads.size === 0) return null;
  return totalCents / 100 / heads.size;
};

/** no_show_rate_crew (pct) — shifts with attendance='no_show' / total shifts. */
const no_show_rate_crew: MetricResolver = async (ctx) => {
  const total = await countWhere(ctx, "shifts", {});
  if (!total) return null;
  const noShows = await countWhere(ctx, "shifts", { attendance: "no_show" });
  if (noShows === null) return null;
  return (noShows / total) * 100;
};

/**
 * cert_compliance (pct) — credentials that are current (no expiry, or expires
 * on/after today) / all credentials. Compliance = not-expired share.
 */
const cert_compliance: MetricResolver = async (ctx) => {
  const total = await countWhere(ctx, "credentials", {});
  if (!total) return null;
  const today = new Date().toISOString().slice(0, 10);
  const expired = await (ctx.db as unknown as AnyDB)
    .from("credentials")
    .select("id", { count: "exact", head: true })
    .eq("org_id", ctx.orgId)
    .not("expires_on", "is", null)
    .lt("expires_on", today);
  if (expired.error) return null;
  const expiredCount = expired.count ?? 0;
  return ((total - expiredCount) / total) * 100;
};

/**
 * incident_rate (float) — OSHA TRIR: recordable cases × 200,000 / hours worked.
 * Hours come from summed `timesheets.total_minutes`. Returns null when no hours.
 */
const incident_rate: MetricResolver = async (ctx) => {
  const recordable = await countWhere(ctx, "incidents", { osha_recordable: true });
  if (recordable === null) return null;
  const { data, error } = await (ctx.db as unknown as AnyDB)
    .from("timesheets")
    .select("total_minutes")
    .eq("org_id", ctx.orgId);
  if (error || !data) return null;
  let minutes = 0;
  for (const r of data as { total_minutes: number | null }[]) minutes += r.total_minutes ?? 0;
  const hours = minutes / 60;
  if (hours <= 0) return null;
  return (recordable * OSHA_HOURS_BASE) / hours;
};

/** near_miss_count (int) — incidents with severity='near_miss'. */
const near_miss_count: MetricResolver = (ctx) => countWhere(ctx, "incidents", { severity: "near_miss" });

/**
 * checkpoint_completion (pct) — inspection_items answered (result not null) /
 * total inspection items across the org.
 */
const checkpoint_completion: MetricResolver = async (ctx) => {
  const total = await countWhere(ctx, "inspection_items", {});
  if (!total) return null;
  const answered = await (ctx.db as unknown as AnyDB)
    .from("inspection_items")
    .select("id", { count: "exact", head: true })
    .eq("org_id", ctx.orgId)
    .not("result", "is", null);
  if (answered.error) return null;
  return ((answered.count ?? 0) / total) * 100;
};

/**
 * ros_adherence (pct) — run-of-shows that have been locked (committed) / total.
 * A locked ROS is the operational proxy for "ran to plan"; `cues` is free-form
 * jsonb with no per-cue completion flag, so the locked share is the signal.
 */
const ros_adherence: MetricResolver = async (ctx) => {
  const total = await countWhere(ctx, "run_of_shows", { deleted_at: null });
  if (!total) return null;
  const locked = await countWhere(ctx, "run_of_shows", { run_of_show_state: "locked", deleted_at: null });
  if (locked === null) return null;
  return (locked / total) * 100;
};

/**
 * asset_utilization (pct) — assets currently deployed (in_use or reserved) /
 * all non-retired assets. No pull-sheet table exists, so the asset-state
 * roll-up is the utilization signal.
 */
const asset_utilization: MetricResolver = async (ctx) => {
  const fleet = await (ctx.db as unknown as AnyDB)
    .from("assets")
    .select("id", { count: "exact", head: true })
    .eq("org_id", ctx.orgId)
    .is("deleted_at", null)
    .neq("state", "retired");
  if (fleet.error) return null;
  const total = fleet.count ?? 0;
  if (!total) return null;
  const deployed = await (ctx.db as unknown as AnyDB)
    .from("assets")
    .select("id", { count: "exact", head: true })
    .eq("org_id", ctx.orgId)
    .is("deleted_at", null)
    .in("state", ["in_use", "reserved"]);
  if (deployed.error) return null;
  return ((deployed.count ?? 0) / total) * 100;
};

/**
 * fleet_roi (pct) — rental revenue against fleet capital cost. Equipment carries
 * a daily_rate but no acquisition/book cost, so ROI has no cost basis. Null.
 */
const fleet_roi: MetricResolver = NOT_COMPUTED;

/**
 * equipment_downtime (pct) — assets in maintenance / all non-retired
 * assets (the share of the fleet out of service right now).
 */
const equipment_downtime: MetricResolver = async (ctx) => {
  const fleet = await (ctx.db as unknown as AnyDB)
    .from("assets")
    .select("id", { count: "exact", head: true })
    .eq("org_id", ctx.orgId)
    .is("deleted_at", null)
    .neq("state", "retired");
  if (fleet.error) return null;
  const total = fleet.count ?? 0;
  if (!total) return null;
  const down = await (ctx.db as unknown as AnyDB)
    .from("assets")
    .select("id", { count: "exact", head: true })
    .eq("org_id", ctx.orgId)
    .is("deleted_at", null)
    .eq("state", "in_maintenance");
  if (down.error) return null;
  return ((down.count ?? 0) / total) * 100;
};

/**
 * sub_rental_spend (currency) — spend on outside (sub-)rentals. Purchase orders
 * have no rental-specific marker that distinguishes sub-rentals from any other
 * PO line, so this can't be isolated from real columns. Null.
 */
const sub_rental_spend: MetricResolver = NOT_COMPUTED;

/**
 * maintenance_compliance (pct) — completed-on-schedule maintenance / due
 * maintenance. No maintenance-schedule or maintenance-log table exists. Null.
 */
const maintenance_compliance: MetricResolver = NOT_COMPUTED;

/**
 * inventory_accuracy (pct) — counted vs expected on pull sheets. No pull-sheet
 * or cycle-count table exists. Null.
 */
const inventory_accuracy: MetricResolver = NOT_COMPUTED;

/**
 * turnaround_time (float) — hours between scheduled and actual changeover.
 * No turnaround/changeover timestamps captured. Null.
 */
const turnaround_time: MetricResolver = NOT_COMPUTED;

/** waste_diversion (pct) — diverted vs total waste. No waste data. Null. */
const waste_diversion: MetricResolver = NOT_COMPUTED;

/** energy_intensity (float) — energy per unit of activity. No energy data. Null. */
const energy_intensity: MetricResolver = NOT_COMPUTED;

export const compvssResolvers: ResolverMap = {
  labor_fill_rate,
  overtime_pct,
  labor_cost_per_head,
  no_show_rate_crew,
  cert_compliance,
  incident_rate,
  near_miss_count,
  checkpoint_completion,
  ros_adherence,
  asset_utilization,
  fleet_roi,
  equipment_downtime,
  sub_rental_spend,
  maintenance_compliance,
  inventory_accuracy,
  turnaround_time,
  waste_diversion,
  energy_intensity,
};
