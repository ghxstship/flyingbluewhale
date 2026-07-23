"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { HubChrome } from "@/components/mobile/HubChrome";
import { KIcon, MetricGrid, NormalizedList, SwipeRow, type FieldDef } from "@/components/mobile/kit";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";
import { TIMESHEET_STATE_LABEL, type TimesheetState } from "@/lib/db/timesheets";
import { decideTimesheet } from "@/app/(platform)/studio/finance/timesheets/[id]/actions";
import { useActionErrorResolver } from "@/lib/errors-client";

/**
 * Workforce · Time Sheets (kit 34 v3.7 · §5 handoff). Manager review of REAL
 * submitted timesheets: approve / flag route through the shared, RLS-gated
 * `decideTimesheet` FSM (self-approval-guarded, race-safe, audited); Export
 * downloads a real CSV of approved hours. COMPVSS owns capture + approval and
 * hands off at the payroll line — it does not run payroll.
 */
export type TimesheetRow = {
  id: string;
  worker: string;
  period: string;
  minutes: number;
  billableMinutes: number;
  state: string;
};

const STATE_TONE: Record<string, string> = {
  submitted: "info",
  approved: "ok",
  rejected: "danger",
  open: "neutral",
  posted: "neutral",
  archived: "neutral",
};

const hrs = (min: number): string => (min / 60).toFixed(min % 60 ? 1 : 0);

export function TimeSheetsView({ rows }: { rows: TimesheetRow[] }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [pending, startTx] = useTransition();
  const resolveErr = useActionErrorResolver();

  const submitted = rows.filter((r) => r.state === "submitted");
  const approved = rows.filter((r) => r.state === "approved");
  const totalHours = rows.reduce((s, r) => s + r.minutes, 0) / 60;
  const stateLabel = (s: string) => TIMESHEET_STATE_LABEL[s as TimesheetState] ?? s;

  const decide = (r: TimesheetRow, decision: "approved" | "returned", msg: string) => {
    if (pending) return;
    const fd = new FormData();
    fd.set("decision", decision);
    startTx(async () => {
      const res = await decideTimesheet(r.id, null, fd);
      if (res?.error) {
        toast.error(resolveErr(res.error));
        return;
      }
      toast.success(msg, { description: `${r.worker} · ${r.period}` });
      router.refresh();
    });
  };

  const exportCsv = () => {
    if (approved.length === 0) {
      toast.error(t("m.timeSheets.noApproved", undefined, "No approved timesheets to export."));
      return;
    }
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const header = "Worker,Period,Hours,Billable Hours\n";
    const body = approved
      .map((r) => [esc(r.worker), esc(r.period), hrs(r.minutes), hrs(r.billableMinutes)].join(","))
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timesheets-approved.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(
      t("m.timeSheets.exported", { count: approved.length }, `Exported ${approved.length} Approved Timesheets`),
      { description: t("m.timeSheets.exportedDesc", undefined, "CSV downloaded for your payroll provider.") },
    );
  };

  const FIELDS: FieldDef<TimesheetRow>[] = [
    { id: "worker", label: t("m.timeSheets.col.worker", undefined, "Worker"), type: "text", get: (r) => r.worker },
    { id: "period", label: t("m.timeSheets.col.period", undefined, "Period"), type: "text", get: (r) => r.period },
    { id: "hours", label: t("m.timeSheets.col.hours", undefined, "Hours"), type: "text", get: (r) => `${hrs(r.minutes)}h` },
    { id: "state", label: t("m.timeSheets.col.status", undefined, "Status"), type: "select", get: (r) => stateLabel(r.state) },
  ];

  const row = (r: TimesheetRow) => (
    <SwipeRow
      key={r.id}
      actions={
        r.state === "submitted"
          ? [
              {
                icon: "Check",
                label: t("m.timeSheets.approve", undefined, "Approve"),
                tone: "ok" as const,
                on: () => decide(r, "approved", t("m.timeSheets.approved", undefined, "Timesheet Approved")),
              },
              {
                icon: "Flag",
                label: t("m.timeSheets.flag", undefined, "Flag"),
                tone: "danger" as const,
                on: () => decide(r, "returned", t("m.timeSheets.flagged", undefined, "Returned For Changes")),
              },
            ]
          : []
      }
    >
      <div className="item" style={{ margin: 0 }}>
        <KIcon name="Timer" size={17} style={{ color: "var(--p-text-2)", flex: "none" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{r.worker}</div>
          <div className="s" style={{ fontVariantNumeric: "tabular-nums" }}>
            {r.period} · {hrs(r.minutes)}h
          </div>
        </div>
        <span className={`ps-badge ps-badge--${STATE_TONE[r.state] ?? "neutral"}`}>{stateLabel(r.state)}</span>
      </div>
    </SwipeRow>
  );

  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="workforce" active="timesheets" canManage />

      <MetricGrid
        cells={[
          {
            k: t("m.timeSheets.submitted", undefined, "Submitted"),
            v: submitted.length,
            color: submitted.length ? "var(--p-info)" : undefined,
          },
          { k: t("m.timeSheets.approvedMetric", undefined, "Approved"), v: approved.length },
          { k: t("m.timeSheets.hours", undefined, "Total Hours"), v: `${totalHours.toFixed(totalHours % 1 ? 1 : 0)}h` },
        ]}
      />

      <NormalizedList
        k="ts"
        items={rows}
        fields={FIELDS}
        search={(r) => `${r.worker} ${r.period}`}
        searchPlaceholder={t("m.timeSheets.search", undefined, "Search Time Sheets…")}
        renderRow={row}
        views={["list", "table"]}
        // Pills = context (worker), never status — status stays on the row
        // badge + the "state" field in the filter drawer.
        pill={{ get: (r) => r.worker }}
        empty={{
          cols: [
            t("m.timeSheets.col.worker", undefined, "Worker"),
            t("m.timeSheets.col.period", undefined, "Period"),
            t("m.timeSheets.col.status", undefined, "Status"),
          ],
          title: t("m.timeSheets.empty.title", undefined, "No Time Sheets"),
          hint: t("m.timeSheets.empty.body", undefined, "Submitted crew timesheets land here for review."),
        }}
        footer={
          <button
            type="button"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
            disabled={pending || approved.length === 0}
            onClick={exportCsv}
          >
            <KIcon name="Download" size={16} />{" "}
            {t("m.timeSheets.export", { count: approved.length }, `Export → Payroll (${approved.length} approved)`)}
          </button>
        }
      />

      <p className="hint" style={{ marginTop: 10 }}>
        {t(
          "m.timeSheets.hint",
          undefined,
          "COMPVSS captures and approves hours, then exports approved time sheets (CSV) to your payroll provider. It doesn't run payroll.",
        )}
      </p>
    </div>
  );
}
