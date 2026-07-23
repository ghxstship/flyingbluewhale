export const dynamic = "force-dynamic";

import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate, fmtDateTime } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { ALLOWED_DECISIONS, formatMinutes, type TimesheetState } from "@/lib/db/timesheets";
import { ApprovalControl } from "./ApprovalControl";

type Approval = {
  id: string;
  decision: string;
  notes: string | null;
  decided_at: string;
  approver: string;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();

  const dash = t("console.finance.timesheets.unknownWorker", undefined, "—");

  const { data: row } = await supabase
    .from("timesheets")
    .select(
      "id, party_id, period_start, period_end, state, total_minutes, billable_minutes, total_amount_minor, total_amount_currency, project_id, posted_at, created_at",
    )
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();

  // Approval audit trail (append-only). RLS scopes to the sheet's org via
  // the timesheet_id join in the policy.
  const { data: approvalRows } = await supabase
    .from("timesheet_approvals")
    .select("id, decision, notes, decided_at, approver_party_id")
    .eq("timesheet_id", id)
    .order("decided_at", { ascending: false });

  // No FK embed available (empty Relationships); hydrate every party name
  // referenced by the sheet + its approvals in one query.
  const partyIds = Array.from(
    new Set([row?.party_id, ...(approvalRows ?? []).map((a) => a.approver_party_id)].filter((x): x is string => !!x)),
  );
  const nameById = new Map<string, string>();
  if (partyIds.length > 0) {
    const { data: parties } = await supabase
      .from("parties")
      .select("id, display_name")
      .eq("org_id", session.orgId)
      .in("id", partyIds);
    for (const p of parties ?? []) nameById.set(p.id, p.display_name);
  }

  const worker = (row?.party_id && nameById.get(row.party_id)) || dash;

  const approvals: Approval[] = (approvalRows ?? []).map((a) => ({
    id: a.id,
    decision: a.decision,
    notes: a.notes,
    decided_at: a.decided_at,
    approver: nameById.get(a.approver_party_id) ?? dash,
  }));

  const manager = isManagerPlus(session);
  const decisions = row ? ALLOWED_DECISIONS[row.state as TimesheetState] : [];

  return (
    <DetailShell
      row={row}
      eyebrow={t("console.finance.timesheets.detail.eyebrow", undefined, "Finance")}
      title={() => worker}
      subtitle={(r) => `${fmtDate(r.period_start)} – ${fmtDate(r.period_end)} · ${formatMinutes(r.total_minutes)}`}
      breadcrumbs={[
        { label: t("console.finance.breadcrumb", undefined, "Finance"), href: "/studio/finance" },
        {
          label: t("console.finance.timesheets.breadcrumb", undefined, "Timesheets"),
          href: "/studio/finance/timesheets",
        },
        { label: worker },
      ]}
      action={row ? <StatusBadge status={row.state} /> : undefined}
      fields={
        row
          ? [
              {
                label: t("console.finance.timesheets.detail.fields.worker", undefined, "Worker"),
                value: worker,
              },
              {
                label: t("console.finance.timesheets.detail.fields.state", undefined, "Status"),
                value: <StatusBadge status={row.state} />,
              },
              {
                label: t("console.finance.timesheets.detail.fields.period", undefined, "Period"),
                value: `${fmtDate(row.period_start)} – ${fmtDate(row.period_end)}`,
              },
              {
                label: t("console.finance.timesheets.detail.fields.totalHours", undefined, "Total hours"),
                value: formatMinutes(row.total_minutes),
              },
              {
                label: t("console.finance.timesheets.detail.fields.billableHours", undefined, "Billable hours"),
                value: formatMinutes(row.billable_minutes),
              },
              {
                label: t("console.finance.timesheets.detail.fields.amount", undefined, "Amount"),
                value: money(row.total_amount_minor),
              },
              {
                label: t("console.finance.timesheets.detail.fields.posted", undefined, "Posted"),
                value: row.posted_at ? fmtDateTime(row.posted_at) : "—",
              },
              {
                label: t("console.finance.timesheets.detail.fields.created", undefined, "Created"),
                value: fmtDateTime(row.created_at),
              },
            ]
          : undefined
      }
    >
      {row && manager && (
        <section className="surface space-y-3 p-5">
          <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
            {t("console.finance.timesheets.review.heading", undefined, "Review")}
          </h2>
          <ApprovalControl timesheetId={row.id} decisions={decisions} />
        </section>
      )}

      <section className="surface space-y-3 p-5">
        <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
          {t("console.finance.timesheets.history.heading", undefined, "Approval history")}
        </h2>
        {approvals.length === 0 ? (
          <p className="text-sm text-[var(--p-text-2)]">
            {t("console.finance.timesheets.history.empty", undefined, "No decisions recorded yet.")}
          </p>
        ) : (
          <ul className="space-y-2">
            {approvals.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 border-t border-[var(--p-border)] pt-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--p-text-1)]">{toTitle(a.decision)}</div>
                  <div className="text-xs text-[var(--p-text-2)]">
                    {a.approver} · {fmtDateTime(a.decided_at)}
                  </div>
                  {a.notes && <div className="mt-1 text-sm text-[var(--p-text-2)]">{a.notes}</div>}
                </div>
                <StatusBadge status={a.decision} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </DetailShell>
  );
}
