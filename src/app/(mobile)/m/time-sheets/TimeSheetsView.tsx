"use client";

import { useMemo, useState } from "react";
import { HubChrome } from "@/components/mobile/HubChrome";
import { KIcon, MetricGrid, NormalizedList, SwipeRow, type FieldDef } from "@/components/mobile/kit";
import { useToast } from "@/lib/hooks/useToast";
import { TIMESHEETS, TIMESHEET_TONE, type CrewTimesheet } from "@/lib/mobile/ops-seed";

/**
 * Workforce · Time Sheets (kit 34 v3.7 · §5 handoff). The manager review of
 * crew punches: approve / flag submitted sheets, then **Export → Payroll**
 * (approved hours only, CSV/API). COMPVSS owns capture + approval and hands off
 * at the payroll line — it does not run payroll. Distinct from the personal
 * "My Timesheets" (/m/timesheets).
 */
const STATUS_ORDER = ["Submitted", "Flagged", "Approved", "Exported"];

export function TimeSheetsView({ canManage }: { canManage: boolean }) {
  const toast = useToast();
  // Optimistic review state over the seed (id → status). Real backing wires to
  // the timesheet FSM; here the approve/flag/export moves are local.
  const [override, setOverride] = useState<Map<string, string>>(new Map());
  const stateOf = (t: CrewTimesheet) => override.get(t.id) ?? t.status;

  const set = (t: CrewTimesheet, status: string, msg: string) => {
    setOverride((m) => new Map(m).set(t.id, status));
    toast.success(msg, { description: `${t.person} · ${t.date}` });
  };
  const approve = (t: CrewTimesheet) => set(t, "Approved", "Timesheet Approved");
  const flag = (t: CrewTimesheet) => set(t, "Flagged", "Flagged For Review");

  const approvedCount = TIMESHEETS.filter((t) => stateOf(t) === "Approved").length;
  const exportPayroll = () => {
    if (!approvedCount) {
      toast.error("No approved timesheets to export.");
      return;
    }
    setOverride((m) => {
      const n = new Map(m);
      for (const t of TIMESHEETS) if (stateOf(t) === "Approved") n.set(t.id, "Exported");
      return n;
    });
    toast.success(`Exported ${approvedCount} Approved Timesheets`, { description: "Sent to your payroll provider (CSV)" });
  };

  const totals = useMemo(() => {
    const reg = TIMESHEETS.reduce((s, t) => s + t.reg, 0);
    const ot = TIMESHEETS.reduce((s, t) => s + t.ot, 0);
    const flagged = TIMESHEETS.filter((t) => stateOf(t) === "Flagged").length;
    return { reg, ot, flagged };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [override]);

  const FIELDS: FieldDef<CrewTimesheet>[] = [
    { id: "person", label: "Crew", type: "text", get: (t) => t.person },
    { id: "role", label: "Role", type: "select", options: [...new Set(TIMESHEETS.map((t) => t.role))], get: (t) => t.role },
    { id: "status", label: "Status", type: "select", options: STATUS_ORDER, get: (t) => stateOf(t) },
    { id: "reg", label: "Reg", type: "num", get: (t) => t.reg },
    { id: "ot", label: "OT", type: "num", get: (t) => t.ot },
  ];

  const boardTone: Record<string, string> = {};
  for (const s of STATUS_ORDER) boardTone[s] = TIMESHEET_TONE[s] ?? "neutral";

  const row = (t: CrewTimesheet) => {
    const st = stateOf(t);
    const canAct = st === "Submitted" || st === "Flagged";
    return (
      <SwipeRow
        key={t.id}
        actions={
          canAct
            ? [
                { icon: "Check", label: "Approve", tone: "ok", on: () => approve(t) },
                { icon: "Flag", label: "Flag", tone: "danger", on: () => flag(t) },
              ]
            : []
        }
      >
        <div className="item" style={{ margin: 0 }}>
          <KIcon name="Timer" size={17} style={{ color: "var(--p-text-2)", flex: "none" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">{t.person} · {t.role}</div>
            <div className="s" style={{ fontVariantNumeric: "tabular-nums" }}>
              {t.in}–{t.out} · {t.reg}h + {t.ot} OT{t.note ? ` · ${t.note}` : ""}
            </div>
          </div>
          <span className={`ps-badge ps-badge--${TIMESHEET_TONE[st] ?? "neutral"}`}>{st}</span>
        </div>
      </SwipeRow>
    );
  };

  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="workforce" active="timesheets" canManage={canManage} />

      <MetricGrid
        cells={[
          { k: "Crew", v: TIMESHEETS.length },
          { k: "Reg Hours", v: `${totals.reg}h` },
          { k: "OT Hours", v: `${totals.ot.toFixed(1)}h`, color: "var(--p-warning)" },
          { k: "Flagged", v: totals.flagged, color: totals.flagged ? "var(--p-danger)" : undefined },
        ]}
      />

      <NormalizedList
        k="ts"
        items={TIMESHEETS}
        fields={FIELDS}
        search={(t) => `${t.person} ${t.role} ${t.note}`}
        searchPlaceholder="Search time sheets…"
        renderRow={row}
        views={["list", "table", "board"]}
        statusField="status"
        statusOrder={STATUS_ORDER}
        boardTone={boardTone}
        pill={{ get: (t) => t.role, order: [...new Set(TIMESHEETS.map((t) => t.role))] }}
        empty={{ cols: ["Crew", "Role", "Status"], title: "No time sheets", hint: "Submitted crew punches land here for review." }}
        footer={
          <button
            type="button"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
            onClick={exportPayroll}
          >
            <KIcon name="Download" size={16} /> Export → Payroll ({approvedCount} approved)
          </button>
        }
      />

      <p className="hint" style={{ marginTop: 10 }}>
        COMPVSS captures and approves hours, then exports approved time sheets (CSV/API) to your payroll provider — it
        doesn&apos;t run payroll.
      </p>
    </div>
  );
}
