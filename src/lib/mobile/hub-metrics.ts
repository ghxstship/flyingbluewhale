import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { MetricBarItem } from "@/components/mobile/kit";
import { OPS_REPORTS, OPS_INSPECTIONS, OPS_PERMITS, OPS_LOGISTICS } from "@/lib/mobile/ops-seed";
import { resolveProjectContext, listProjectTasks, listProjectMilestones } from "@/lib/mobile/project-xpms";

/**
 * Hub-landing MetricBar — the kit's `Back → Title → MetricBar → viewseg`.
 *
 * **OFF by default** (`HUB_LANDING_METRICS_ENABLED = false`). On mobile a hub
 * landing is a router, and the glanceable KPIs already live on the `/m` Home
 * strip; a headline metric bar on every category screen is redundant with Home
 * and eats vertical space. The bar is nonetheless fully wired so it can be
 * switched on with a single flag flip.
 *
 * When enabled, each hub's cells summarize exactly what its members contain —
 * seed-backed Operations/Logistics from `ops-seed` (consistent with the very
 * rows their ledgers render), Projects/Equipment/Workforce from live org-scoped
 * reads. Nothing is fabricated: a read that fails or has no backing data drops
 * its cell (or the whole bar), so `HubChrome` cleanly falls back to the launcher.
 */
export const HUB_LANDING_METRICS_ENABLED = false;

type MetricSession = { orgId: string; userId: string };

export async function hubLandingMetrics(hubKey: string, session: MetricSession): Promise<MetricBarItem[]> {
  if (!HUB_LANDING_METRICS_ENABLED) return [];
  try {
    switch (hubKey) {
      case "operations":
        return operationsMetrics();
      case "logistics":
        return logisticsMetrics();
      case "projects":
        return await projectsMetrics(session.orgId);
      case "equipment":
        return await equipmentMetrics(session.orgId);
      case "workforce":
        return await workforceMetrics(session.orgId, session.userId);
      default:
        return [];
    }
  } catch {
    // A hub landing must never break over a metric read.
    return [];
  }
}

/** Operations members (Reports · Inspections · Permits · Travel) are ops-seed. */
export function operationsMetrics(): MetricBarItem[] {
  const open = OPS_REPORTS.filter((r) => r.status === "Open").length;
  const insp = OPS_INSPECTIONS.filter((i) => i.status === "In Progress" || i.status === "Flagged").length;
  const expiring = OPS_PERMITS.filter((p) => p.status === "Expiring").length;
  return [
    { short: "Open Reports", v: open, tone: open ? "danger" : "success" },
    { short: "Inspections", v: insp, tone: insp ? "warning" : "success" },
    { short: "Permits Exp", v: expiring, tone: expiring ? "warning" : "success" },
  ];
}

/** Logistics members (Shipments · Docks · Gate · Delivery) are ops-seed. */
export function logisticsMetrics(): MetricBarItem[] {
  const enRoute = OPS_LOGISTICS.filter((l) => l.status === "En Route").length;
  const delayed = OPS_LOGISTICS.filter((l) => l.status === "Delayed").length;
  const inbound = OPS_LOGISTICS.filter((l) => l.dir === "in").length;
  return [
    { short: "En Route", v: enRoute, tone: "info" },
    { short: "Delayed", v: delayed, tone: delayed ? "danger" : "success" },
    { short: "Inbound", v: inbound, tone: "text-3" },
  ];
}

/** Projects members read the live XPMS spine for the active project. */
async function projectsMetrics(orgId: string): Promise<MetricBarItem[]> {
  const project = await resolveProjectContext(orgId);
  if (!project) return [];
  const [tasks, milestones] = await Promise.all([
    listProjectTasks(orgId, project.id),
    listProjectMilestones(orgId, project.id),
  ]);
  const openTasks = tasks.filter((t) => !t.archived && t.status !== "Done").length;
  const upcoming = milestones.filter((m) => m.status !== "Done").length;
  return [
    { short: "Open Tasks", v: openTasks, tone: openTasks ? "info" : "success" },
    { short: "Milestones", v: upcoming, tone: "text-3" },
  ];
}

/** Assets & Equipment — the org's reusable catalog SKU count. */
async function equipmentMetrics(orgId: string): Promise<MetricBarItem[]> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("master_catalog_items")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .is("deleted_at", null);
  return [{ short: "Catalog SKUs", v: count ?? 0, tone: "text-3" }];
}

/** Workforce — the caller's OWN pending time-off (role-safe for crew + manager). */
async function workforceMetrics(orgId: string, userId: string): Promise<MetricBarItem[]> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("time_off_requests")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("request_state", "pending");
  const pending = count ?? 0;
  return [{ short: "My Time Off", v: pending, tone: pending ? "info" : "text-3" }];
}
