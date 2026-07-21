"use client";

import Link from "next/link";
import { HubChrome } from "@/components/mobile/HubChrome";
import { Block, KIcon, ListRow, MetricGrid } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Daily Report (kit 34 v3.7) — the end-of-day rollup, an Operations hub member.
 * Renders the day's REAL shift notes + the org's open-incident count (the page
 * does the org-scoped reads). File routes to the real daily-log form; Export
 * prints the current view. No fabricated ops-seed data.
 */
export type ReportNote = { id: string; author: string; asManager: boolean; body: string; when: string };

export function DailyReportView({
  canManage,
  notes,
  openIncidents,
  managerNotes,
}: {
  canManage: boolean;
  notes: ReportNote[];
  openIncidents: number;
  managerNotes: number;
}) {
  const t = useT();

  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="operations" active="dailyreport" canManage={canManage} />

      <MetricGrid
        cells={[
          { k: t("m.dailyReport.notes", undefined, "Shift Notes"), v: notes.length },
          {
            k: t("m.dailyReport.openIncidents", undefined, "Open Incidents"),
            v: openIncidents,
            color: openIncidents ? "var(--p-danger)" : undefined,
          },
          { k: t("m.dailyReport.managerNotes", undefined, "Manager Notes"), v: managerNotes },
        ]}
      />

      <Block
        title={t("m.dailyReport.notes", undefined, "Shift Notes")}
        meta={t("m.dailyReport.filed", { count: notes.length }, `${notes.length} filed`)}
      >
        {notes.length === 0 ? (
          <div className="s" style={{ color: "var(--p-text-3)", padding: "8px 0" }}>
            {t("m.dailyReport.empty", undefined, "No shift notes filed today.")}
          </div>
        ) : (
          notes.map((n) => (
            <ListRow
              key={n.id}
              icon="StickyNote"
              iconColor={n.asManager ? "var(--p-warning)" : "var(--p-text-3)"}
              title={n.author}
              sub={n.when}
            >
              <div className="s" style={{ marginTop: 4, color: "var(--p-text-2)" }}>
                {n.body}
              </div>
            </ListRow>
          ))
        )}
      </Block>

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <Link
          href="/m/daily-log/new"
          className="ps-btn ps-btn--cta ps-btn--lg"
          style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
        >
          <KIcon name="Check" size={16} /> {t("m.dailyReport.file", undefined, "File Report")}
        </Link>
        <button
          type="button"
          className="ps-btn ps-btn--secondary ps-btn--lg"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={() => window.print()}
        >
          <KIcon name="Printer" size={16} /> {t("m.dailyReport.export", undefined, "Export PDF")}
        </button>
      </div>

      <p className="hint" style={{ marginTop: 10 }}>
        {t(
          "m.dailyReport.hint",
          undefined,
          "The Daily Report rolls up today's shift notes and open incidents for handoff to leads. Filing saves it to the project's daily log; export prints a PDF for email.",
        )}
      </p>
    </div>
  );
}
