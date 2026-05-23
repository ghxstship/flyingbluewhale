import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { decideTimeOff } from "./actions";

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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Time Off" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
    user: userMap.get(r.user_id) ?? "Unknown",
    policy: policyMap.get(r.policy_id) ?? "Policy",
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
        eyebrow="Workforce"
        title="Time Off"
        subtitle={`${pending} Pending · ${approved} Approved · ${denied} Denied`}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Pending" value={fmt.number(pending)} accent />
          <MetricCard label="Approved" value={fmt.number(approved)} />
          <MetricCard label="Denied" value={fmt.number(denied)} />
        </div>
        <DataTable<Row>
          tableId="workforce.time_off"
          rows={rows}
          emptyLabel="No time-off requests"
          emptyDescription="Requests filed from /m/time-off appear here. Managers approve or deny inline."
          columns={[
            {
              key: "user",
              header: "Requester",
              render: (r) => r.user,
              accessor: (r) => r.user,
              filterable: true,
            },
            {
              key: "policy",
              header: "Policy",
              render: (r) => r.policy,
              accessor: (r) => r.policy,
              filterable: true,
              groupable: true,
            },
            {
              key: "window",
              header: "Window",
              render: (r) => `${fmt.date(r.starts_on)} → ${fmt.date(r.ends_on)}`,
              accessor: (r) => r.starts_on,
              className: "font-mono text-xs",
            },
            {
              key: "hours",
              header: "Hours",
              render: (r) => fmt.number(r.hours_requested),
              accessor: (r) => r.hours_requested,
              className: "font-mono text-xs tabular-nums",
              total: "sum",
            },
            {
              key: "reason",
              header: "Reason",
              render: (r) => r.reason ?? "—",
              accessor: (r) => r.reason ?? null,
            },
            {
              key: "state",
              header: "State",
              render: (r) => <Badge variant={STATE_TONE[r.request_state] ?? "muted"}>{toTitle(r.request_state)}</Badge>,
              accessor: (r) => r.request_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "action",
              header: "Action",
              render: (r) =>
                r.request_state === "pending" ? (
                  <div className="flex items-center gap-1">
                    <form action={decideTimeOff}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <button type="submit" className="btn btn-primary btn-xs">
                        Approve
                      </button>
                    </form>
                    <form action={decideTimeOff}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="decision" value="denied" />
                      <button type="submit" className="btn btn-secondary btn-xs">
                        Deny
                      </button>
                    </form>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">—</span>
                ),
              accessor: () => null,
            },
          ]}
        />
      </div>
    </>
  );
}
