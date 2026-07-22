import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { decideSwap } from "./actions";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  requester: string;
  target: string;
  shift_window: string;
  shift_role: string | null;
  shift_venue: string | null;
  reason: string | null;
  swap_state: string;
  created_at: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.shiftSwaps.eyebrow", undefined, "Workforce")}
          title={t("console.workforce.shiftSwaps.title", undefined, "Shift Swaps")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.shiftSwaps.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: swaps } = await supabase
    .from("shift_swaps")
    .select("id, shift_id, requested_by, target_user_id, reason, swap_state, created_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(500);

  const raw = (swaps ?? []) as Array<{
    id: string;
    shift_id: string;
    requested_by: string;
    target_user_id: string | null;
    reason: string | null;
    swap_state: string;
    created_at: string;
  }>;
  const pending = raw.filter((r) => r.swap_state === "requested" || r.swap_state === "accepted").length;
  const approved = raw.filter((r) => r.swap_state === "approved").length;

  const shiftIds = Array.from(new Set(raw.map((r) => r.shift_id)));
  const userIds = Array.from(
    new Set([...raw.map((r) => r.requested_by), ...raw.map((r) => r.target_user_id).filter((u): u is string => !!u)]),
  );
  const [{ data: shifts }, { data: users }] = await Promise.all([
    shiftIds.length
      ? supabase
          .from("shifts")
          .select("id, starts_at, ends_at, role, venue:venue_id(name)")
          .eq("org_id", session.orgId)
          .in("id", shiftIds)
      : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from("users").select("id, email, name").in("id", userIds) : Promise.resolve({ data: [] }),
  ]);
  const shiftMap = new Map(
    (
      (shifts ?? []) as unknown as Array<{
        id: string;
        starts_at: string;
        ends_at: string;
        role: string | null;
        venue: { name: string | null } | null;
      }>
    ).map((s) => [s.id, s]),
  );
  const userMap = new Map(
    ((users ?? []) as unknown as Array<{ id: string; email: string; name: string | null }>).map((u) => [
      u.id,
      u.name ?? u.email,
    ]),
  );

  const rows: Row[] = raw.map((r) => {
    const s = shiftMap.get(r.shift_id);
    return {
      id: r.id,
      requester: userMap.get(r.requested_by) ?? t("console.workforce.shiftSwaps.unknown", undefined, "Unknown"),
      target: r.target_user_id
        ? (userMap.get(r.target_user_id) ?? "—")
        : t("console.workforce.shiftSwaps.openPool", undefined, "Open Pool"),
      shift_window: s
        ? `${fmt.dateParts(s.starts_at, { month: "short", day: "numeric" })} · ${fmt.time(s.starts_at)}–${fmt.time(s.ends_at)}`
        : "—",
      shift_role: s?.role ?? null,
      shift_venue: s?.venue?.name ?? null,
      reason: r.reason,
      swap_state: r.swap_state,
      created_at: r.created_at,
    };
  });

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.shiftSwaps.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.shiftSwaps.title", undefined, "Shift Swaps")}
        subtitle={t(
          "console.workforce.shiftSwaps.subtitle",
          { pending, approved, total: rows.length },
          `${pending} Pending · ${approved} Approved · ${rows.length} Total`,
        )}
        action={
          <Button
            href="/studio/operations/schedule?lane=crew&kind=shift&state=swap_requested"
            size="sm"
            variant="secondary"
          >
            {t("console.workforce.shiftSwaps.openSchedule", undefined, "Open in Schedule")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.workforce.shiftSwaps.metric.pending", undefined, "Pending")}
            value={fmt.number(pending)}
            accent
          />
          <MetricCard
            label={t("console.workforce.shiftSwaps.metric.approved", undefined, "Approved")}
            value={fmt.number(approved)}
          />
          <MetricCard
            label={t("console.workforce.shiftSwaps.metric.total", undefined, "Total")}
            value={fmt.number(rows.length)}
          />
        </div>
        <DataTable<Row>
          tableId="workforce.shift_swaps"
          rows={rows}
          emptyLabel={t("console.workforce.shiftSwaps.empty.label", undefined, "No swap requests")}
          emptyDescription={t(
            "console.workforce.shiftSwaps.empty.description",
            undefined,
            "When crew request to swap shifts they appear here. Managers approve or decline inline.",
          )}
          columns={[
            {
              key: "requester",
              header: t("console.workforce.shiftSwaps.column.requester", undefined, "Requester"),
              render: (r) => r.requester,
              accessor: (r) => r.requester,
              filterable: true,
            },
            {
              key: "target",
              header: t("console.workforce.shiftSwaps.column.target", undefined, "Target"),
              render: (r) => r.target,
              accessor: (r) => r.target,
              filterable: true,
            },
            {
              key: "shift",
              header: t("console.workforce.shiftSwaps.column.shift", undefined, "Shift"),
              render: (r) => r.shift_window,
              accessor: (r) => r.shift_window,
              className: "font-mono text-xs",
            },
            {
              key: "role",
              header: t("console.workforce.shiftSwaps.column.role", undefined, "Role"),
              render: (r) => r.shift_role ?? "—",
              accessor: (r) => r.shift_role ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "venue",
              header: t("console.workforce.shiftSwaps.column.venue", undefined, "Venue"),
              render: (r) => r.shift_venue ?? "—",
              accessor: (r) => r.shift_venue ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "reason",
              header: t("console.workforce.shiftSwaps.column.reason", undefined, "Reason"),
              render: (r) => r.reason ?? "—",
              accessor: (r) => r.reason ?? null,
            },
            {
              key: "state",
              header: t("console.workforce.shiftSwaps.column.state", undefined, "State"),
              render: (r) => <Badge variant={toneFor(r.swap_state)}>{toTitle(r.swap_state)}</Badge>,
              accessor: (r) => r.swap_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "action",
              header: t("console.workforce.shiftSwaps.column.action", undefined, "Action"),
              render: (r) =>
                r.swap_state === "requested" || r.swap_state === "accepted" ? (
                  <div className="flex items-center gap-1">
                    <form action={decideSwap}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <button type="submit" className="ps-btn ps-btn--sm">
                        {t("console.workforce.shiftSwaps.action.approve", undefined, "Approve")}
                      </button>
                    </form>
                    <form action={decideSwap}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="decision" value="declined" />
                      <button type="submit" className="ps-btn ps-btn--ghost ps-btn--sm">
                        {t("console.workforce.shiftSwaps.action.decline", undefined, "Decline")}
                      </button>
                    </form>
                  </div>
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
