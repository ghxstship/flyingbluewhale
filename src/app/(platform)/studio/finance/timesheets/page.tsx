import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, money } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";
import { formatMinutes } from "@/lib/db/timesheets";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  period_start: string;
  period_end: string;
  state: string;
  total_minutes: number;
  billable_minutes: number;
  total_amount_minor: number;
  total_amount_currency: string | null;
  worker: string;
};

export default async function TimesheetsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.finance.timesheets.title", undefined, "Timesheets")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.timesheets.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );

  const session = await requireSession();
  const supabase = await createClient();

  // timesheets has no deleted_at — not a SOFT_DELETABLE_TABLES member —
  // so read it via the typed client directly. RLS enforces org scoping;
  // the explicit org_id eq narrows the query for the manager list view.
  // No FK is registered between timesheets.party_id and parties (the
  // generated Relationships are empty), so worker names are hydrated with a
  // second query rather than a PostgREST embed.
  const { data, error } = await supabase
    .from("timesheets")
    .select(
      "id, party_id, period_start, period_end, state, total_minutes, billable_minutes, total_amount_minor, total_amount_currency",
    )
    .eq("org_id", session.orgId)
    .order("period_start", { ascending: false });
  if (error) throw error;

  const sheets = data ?? [];
  const partyIds = Array.from(new Set(sheets.map((r) => r.party_id)));
  const nameById = new Map<string, string>();
  if (partyIds.length > 0) {
    const { data: parties } = await supabase
      .from("parties")
      .select("id, display_name")
      .eq("org_id", session.orgId)
      .in("id", partyIds);
    for (const p of parties ?? []) nameById.set(p.id, p.display_name);
  }

  const dash = t("console.finance.timesheets.unknownWorker", undefined, "—");
  const rows: Row[] = sheets.map((r) => ({
    id: r.id,
    period_start: r.period_start,
    period_end: r.period_end,
    state: r.state,
    total_minutes: r.total_minutes,
    billable_minutes: r.billable_minutes,
    total_amount_minor: r.total_amount_minor,
    total_amount_currency: r.total_amount_currency,
    worker: nameById.get(r.party_id) ?? dash,
  }));

  const pending = rows.filter((r) => r.state === "submitted").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.timesheets.eyebrow", undefined, "Finance")}
        title={t("console.finance.timesheets.title", undefined, "Timesheets")}
        subtitle={`${rows.length} ${t("console.finance.timesheets.total", undefined, "Total")} · ${pending} ${t("console.finance.timesheets.awaitingReview", undefined, "Awaiting review")}`}
      />
      <div className="page-content space-y-3">
        <DataTable<Row>
          rows={rows}
          totalCount={rows.length}
          rowHref={(r) => `/studio/finance/timesheets/${r.id}`}
          emptyLabel={t("console.finance.timesheets.emptyLabel", undefined, "No timesheets yet")}
          emptyDescription={t(
            "console.finance.timesheets.emptyDescription",
            undefined,
            "Submitted timesheets route here for manager approval before they post to payroll.",
          )}
          columns={[
            {
              key: "worker",
              header: t("console.finance.timesheets.columns.worker", undefined, "Worker"),
              render: (r) => r.worker,
              accessor: (r) => r.worker,
              filterable: true,
              groupable: true,
            },
            {
              key: "period",
              header: t("console.finance.timesheets.columns.period", undefined, "Period"),
              render: (r) => `${fmtDate(r.period_start)} – ${fmtDate(r.period_end)}`,
              className: "font-mono text-xs",
              accessor: (r) => r.period_start,
            },
            {
              key: "hours",
              header: t("console.finance.timesheets.columns.hours", undefined, "Hours"),
              render: (r) => formatMinutes(r.total_minutes),
              className: "font-mono text-xs",
              accessor: (r) => r.total_minutes,
            },
            {
              key: "amount",
              header: t("console.finance.timesheets.columns.amount", undefined, "Amount"),
              render: (r) => money(r.total_amount_minor),
              className: "font-mono text-xs",
              accessor: (r) => r.total_amount_minor,
            },
            {
              key: "state",
              header: t("console.finance.timesheets.columns.state", undefined, "State"),
              render: (r) => <StatusBadge status={r.state} />,
              accessor: (r) => r.state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
