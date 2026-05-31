import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { acknowledgeAlertAction, evaluateAlertsAction, resolveAlertAction } from "./actions";

export const dynamic = "force-dynamic";

type AlertRow = {
  id: string;
  rule_kind: string;
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  fired_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
};

const SEVERITY_TONE: Record<string, "info" | "warning" | "error" | "muted"> = {
  info: "info",
  warning: "warning",
  critical: "error",
};

const KIND_LABELS: Record<string, string> = {
  budget_overrun: "Budget",
  overdue_deliverable: "Deliverable",
  task_overdue: "Task",
  crew_gap: "Crew",
  equipment_conflict: "Equipment",
  low_inventory: "Inventory",
};

export default async function OpsAlertsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Ops" title="Operational Alerts" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("ops_alerts")
    .select("id, rule_kind, severity, title, body, entity_type, entity_id, fired_at, acknowledged_at, resolved_at")
    .eq("org_id", session.orgId)
    .is("resolved_at", null)
    .order("fired_at", { ascending: false })
    .limit(200);

  const alerts = (data ?? []) as AlertRow[];
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warnings = alerts.filter((a) => a.severity === "warning").length;
  const unread = alerts.filter((a) => !a.acknowledged_at).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Ops"
        title="Operational Alerts"
        subtitle={`${alerts.length} open · ${unread} unread`}
        action={
          <form action={evaluateAlertsAction}>
            <Button type="submit" size="sm" variant="secondary">
              ↻ Evaluate Now
            </Button>
          </form>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Critical" value={String(critical)} />
          <MetricCard label="Warnings" value={String(warnings)} />
          <MetricCard label="Unread" value={String(unread)} accent={unread > 0} />
        </div>

        {alerts.length === 0 ? (
          <EmptyState
            title="All Clear"
            description="No open operational alerts. Run an evaluation to scan for budget overruns, crew gaps, overdue deliverables, and task blockers."
            action={
              <form action={evaluateAlertsAction}>
                <Button type="submit" size="sm">
                  ↻ Evaluate Now
                </Button>
              </form>
            }
          />
        ) : (
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li key={a.id} className={`surface p-4 ${a.acknowledged_at ? "opacity-70" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={SEVERITY_TONE[a.severity] ?? "muted"}>
                      {toTitle(a.severity)}
                    </Badge>
                    <Badge variant="muted">{KIND_LABELS[a.rule_kind] ?? toTitle(a.rule_kind)}</Badge>
                  </div>
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {fmt.dateParts(a.fired_at, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-semibold">{a.title}</h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{a.body}</p>
                <div className="mt-3 flex items-center justify-end gap-2">
                  {a.acknowledged_at ? (
                    <span className="text-xs text-[var(--text-muted)]">
                      Acked {fmt.dateParts(a.acknowledged_at, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  ) : (
                    <form action={acknowledgeAlertAction}>
                      <input type="hidden" name="alertId" value={a.id} />
                      <Button type="submit" size="sm" variant="secondary">
                        Acknowledge
                      </Button>
                    </form>
                  )}
                  <form action={resolveAlertAction}>
                    <input type="hidden" name="alertId" value={a.id} />
                    <Button type="submit" size="sm" variant="secondary">
                      Resolve
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
