import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { DecideTimeOffButtons } from "./DecideButtons";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  user: string;
  policy: string;
  starts_on: string;
  ends_on: string;
  hours_requested: number;
  request_state: string;
  reason: string | null;
  created_at: string;
};

const STATE_TONE: Record<string, "info" | "success" | "error" | "muted"> = {
  pending: "info",
  approved: "success",
  denied: "error",
  cancelled: "muted",
};

export default async function TimeOffAdminPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.timeOff.eyebrow", undefined, "Workforce")}
          title={t("console.workforce.timeOff.title", undefined, "Time Off")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.timeOff.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: requests } = await supabase
    .from("time_off_requests")
    .select("id, user_id, policy_id, starts_on, ends_on, hours_requested, request_state, reason, created_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(500);

  const raw = (requests ?? []) as Array<{
    id: string;
    user_id: string;
    policy_id: string;
    starts_on: string;
    ends_on: string;
    hours_requested: number;
    request_state: string;
    reason: string | null;
    created_at: string;
  }>;
  const pending = raw.filter((r) => r.request_state === "pending").length;
  const approved = raw.filter((r) => r.request_state === "approved").length;
  const denied = raw.filter((r) => r.request_state === "denied").length;

  const policyIds = Array.from(new Set(raw.map((r) => r.policy_id)));
  const userIds = Array.from(new Set(raw.map((r) => r.user_id)));
  const [{ data: policies }, { data: users }] = await Promise.all([
    policyIds.length
      ? supabase.from("time_off_policies").select("id, name").in("id", policyIds)
      : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from("users").select("id, email, name").in("id", userIds) : Promise.resolve({ data: [] }),
  ]);
  const policyMap = new Map(((policies ?? []) as Array<{ id: string; name: string }>).map((p) => [p.id, p.name]));
  const userMap = new Map(
    ((users ?? []) as unknown as Array<{ id: string; email: string; name: string | null }>).map((u) => [
      u.id,
      u.name ?? u.email,
    ]),
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id,
    user: userMap.get(r.user_id) ?? t("console.workforce.timeOff.unknown", undefined, "Unknown"),
    policy: policyMap.get(r.policy_id) ?? t("console.workforce.timeOff.policyFallback", undefined, "Policy"),
    starts_on: r.starts_on,
    ends_on: r.ends_on,
    hours_requested: r.hours_requested,
    request_state: r.request_state,
    reason: r.reason,
    created_at: r.created_at,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.timeOff.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.timeOff.title", undefined, "Time Off")}
        subtitle={t(
          "console.workforce.timeOff.subtitle",
          { pending: fmt.number(pending), approved: fmt.number(approved), denied: fmt.number(denied) },
          `${pending} Pending · ${approved} Approved · ${denied} Denied`,
        )}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.workforce.timeOff.metric.pending", undefined, "Pending")}
            value={fmt.number(pending)}
            accent
          />
          <MetricCard
            label={t("console.workforce.timeOff.metric.approved", undefined, "Approved")}
            value={fmt.number(approved)}
          />
          <MetricCard
            label={t("console.workforce.timeOff.metric.denied", undefined, "Denied")}
            value={fmt.number(denied)}
          />
        </div>
        <DataTable<Row>
          tableId="workforce.time_off"
          rows={rows}
          emptyLabel={t("console.workforce.timeOff.emptyLabel", undefined, "No time-off requests")}
          emptyDescription={t(
            "console.workforce.timeOff.emptyDescription",
            undefined,
            "Requests filed from /m/time-off appear here. Managers approve or deny inline.",
          )}
          columns={[
            {
              key: "user",
              header: t("console.workforce.timeOff.column.requester", undefined, "Requester"),
              render: (r) => r.user,
              accessor: (r) => r.user,
              filterable: true,
            },
            {
              key: "policy",
              header: t("console.workforce.timeOff.column.policy", undefined, "Policy"),
              render: (r) => r.policy,
              accessor: (r) => r.policy,
              filterable: true,
              groupable: true,
            },
            {
              key: "window",
              header: t("console.workforce.timeOff.column.window", undefined, "Window"),
              render: (r) => `${fmt.date(r.starts_on)} → ${fmt.date(r.ends_on)}`,
              accessor: (r) => r.starts_on,
              className: "font-mono text-xs",
            },
            {
              key: "hours",
              header: t("console.workforce.timeOff.column.hours", undefined, "Hours"),
              render: (r) => fmt.number(r.hours_requested),
              accessor: (r) => r.hours_requested,
              className: "font-mono text-xs tabular-nums",
              total: "sum",
            },
            {
              key: "reason",
              header: t("console.workforce.timeOff.column.reason", undefined, "Reason"),
              render: (r) => r.reason ?? "—",
              accessor: (r) => r.reason ?? null,
            },
            {
              key: "state",
              header: t("console.workforce.timeOff.column.state", undefined, "State"),
              render: (r) => <Badge variant={STATE_TONE[r.request_state] ?? "muted"}>{toTitle(r.request_state)}</Badge>,
              accessor: (r) => r.request_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "action",
              header: t("console.workforce.timeOff.column.action", undefined, "Action"),
              render: (r) =>
                r.request_state === "pending" ? (
                  <DecideTimeOffButtons
                    requestId={r.id}
                    approveLabel={t("console.workforce.timeOff.action.approve", undefined, "Approve")}
                    denyLabel={t("console.workforce.timeOff.action.deny", undefined, "Deny")}
                  />
                ) : (
                  <span className="text-xs text-[var(--p-text-2)]">—</span>
                ),
              accessor: () => null,
            },
          ]}
        />
      </div>
    </>
  );
}
