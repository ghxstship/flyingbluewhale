"use client";

import Link from "next/link";
import { HubChrome } from "@/components/mobile/HubChrome";
import { Block, KIcon, ListRow, MetricGrid } from "@/components/mobile/kit";
import { SHIFT_NOTES, OPS_REPORTS, DELIVERIES } from "@/lib/mobile/ops-seed";

/**
 * Daily Report (kit 34 v3.7) — the end-of-day rollup, an Operations hub member.
 * Aggregates the day's shift notes with a summary derived from the ops ledgers
 * (open incidents · deliveries · flags) into one filable/exportable record.
 * File routes to the real daily-log form; Export prints the current view.
 */
const TONE_COLOR: Record<string, string> = {
  ok: "var(--p-success)",
  info: "var(--p-info)",
  warn: "var(--p-warning)",
  danger: "var(--p-danger)",
  neutral: "var(--p-text-3)",
};

export function DailyReportView({ canManage }: { canManage: boolean }) {
  const openIncidents = OPS_REPORTS.filter((r) => r.type === "Incident" && r.status === "Open").length;
  const deliveries = DELIVERIES.length;
  const flags = SHIFT_NOTES.filter((n) => n.tone === "warn").length;

  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="operations" active="dailyreport" canManage={canManage} />

      <MetricGrid
        cells={[
          { k: "Shift Notes", v: SHIFT_NOTES.length },
          { k: "Open Incidents", v: openIncidents, color: openIncidents ? "var(--p-danger)" : undefined },
          { k: "Deliveries", v: deliveries },
          { k: "Flags", v: flags, color: flags ? "var(--p-warning)" : undefined },
        ]}
      />

      <Block title="Shift Notes" meta={`${SHIFT_NOTES.length} filed`}>
        {SHIFT_NOTES.map((n) => (
          <ListRow
            key={n.id}
            icon="StickyNote"
            iconColor={TONE_COLOR[n.tone]}
            title={`${n.by} · ${n.role}`}
            sub={`${n.shift} · ${n.time}`}
          >
            <div className="s" style={{ marginTop: 4, color: "var(--p-text-2)" }}>
              {n.txt}
            </div>
          </ListRow>
        ))}
      </Block>

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <Link
          href="/m/daily-log/new"
          className="ps-btn ps-btn--cta ps-btn--lg"
          style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
        >
          <KIcon name="Check" size={16} /> File Report
        </Link>
        <button
          type="button"
          className="ps-btn ps-btn--secondary ps-btn--lg"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={() => window.print()}
        >
          <KIcon name="Printer" size={16} /> Export PDF
        </button>
      </div>

      <p className="hint" style={{ marginTop: 10 }}>
        The Daily Report rolls up shift notes, incidents and deliveries for handoff to leads. Filing saves it to the
        project&apos;s daily log; export prints a PDF for email.
      </p>
    </div>
  );
}
