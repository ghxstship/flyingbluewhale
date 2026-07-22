"use client";

import { useState } from "react";
import { NormalizedList, RecordDetail, type FieldDef, toneToBadge } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { SubmitLogButton } from "./SubmitLogButton";

/**
 * Daily Log — the org's per-day site logs on the kit view engine. Calendar is
 * the natural default (rows are keyed by `log_date`); list/table/board are the
 * other lenses. `log_state` is the board column + row badge, never a
 * quick-filter pill (repo canon). The inline draft-submit action stays inside
 * the row — a draft is the field's to move; approval is the console's.
 *
 * A row opens the log itself: the row line is weather-only, so `notes` — the
 * site log everyone actually writes — was fetched and never displayed.
 */
export type DailyLogItem = {
  id: string;
  logIso: string | null;
  dateLabel: string;
  log_state: string | null;
  summary: string;
  notes: string | null;
  weather: string | null;
};

/** Tone keyed by the RAW state — the display label is locale-dependent. */
const STATE_TONE: Record<string, string> = {
  draft: "text-3",
  submitted: "info",
  approved: "success",
};
const RAW_STATE_ORDER = ["draft", "submitted", "approved"];

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  // Tone → class mapping is the kit's toneToBadge SSOT (was a per-surface ternary).
  return <span className={toneToBadge(tone)}>{children}</span>;
}

export function DailyLogView({ items }: { items: DailyLogItem[] }) {
  const [detail, setDetail] = useState<DailyLogItem | null>(null);
  const t = useT();

  const stateLabel: Record<string, string> = {
    draft: t("m.dailyLog.state.draft", undefined, "Draft"),
    submitted: t("m.dailyLog.state.submitted", undefined, "Submitted"),
    approved: t("m.dailyLog.state.approved", undefined, "Approved"),
  };
  const stateOf = (x: DailyLogItem) => (x.log_state ? (stateLabel[x.log_state] ?? x.log_state) : "—");

  // Board columns + tones keyed by the TRANSLATED label the field emits —
  // keying them by the English label broke both in any other locale.
  const STATE_ORDER = RAW_STATE_ORDER.map((s) => stateLabel[s] ?? s);
  const boardTone: Record<string, string> = Object.fromEntries(
    RAW_STATE_ORDER.map((s) => [stateLabel[s] ?? s, STATE_TONE[s] ?? "text-3"]),
  );

  const fields: FieldDef<DailyLogItem>[] = [
    {
      id: "date",
      label: t("m.dailyLog.col.date", undefined, "Date"),
      type: "date",
      get: (x) => x.dateLabel,
      iso: (x) => x.logIso,
    },
    {
      id: "log_state",
      label: t("m.dailyLog.col.status", undefined, "Status"),
      type: "select",
      options: STATE_ORDER,
      get: stateOf,
    },
    { id: "weather", label: t("m.dailyLog.col.summary", undefined, "Summary"), type: "text", get: (x) => x.summary },
  ];

  const row = (x: DailyLogItem) => (
    <div
      className="item tap"
      key={x.id}
      role="button"
      tabIndex={0}
      onClick={() => setDetail(x)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setDetail(x);
        }
      }}
    >
      <span className="bar" style={{ background: "var(--p-info)" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t">{x.dateLabel}</div>
        <div className="s">{x.summary}</div>
      </div>
      <Badge tone={(x.log_state ? STATE_TONE[x.log_state] : undefined) ?? "neutral"}>{stateOf(x)}</Badge>
      {/* Only a draft is the field's to move. submitted → approved is the
          console's step, per the shared FSM. Stop the tap here so submitting
          doesn't also open the record. */}
      {x.log_state === "draft" && (
        /* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
        <span onClick={(e) => e.stopPropagation()}>
          <SubmitLogButton id={x.id} label={t("m.dailyLog.submit", undefined, "Submit")} />
        </span>
      )}
    </div>
  );

  return (
    <>
      <NormalizedList
        k="daily-log"
        items={items}
        fields={fields}
        search={(x) => `${x.dateLabel} ${x.summary} ${x.notes ?? ""}`}
        searchPlaceholder={t("m.dailyLog.search", undefined, "Search logs…")}
        renderRow={row}
        onRow={setDetail}
        views={["calendar", "list", "table", "board"]}
        initialView="calendar"
        dateField="date"
        statusField="log_state"
        statusOrder={STATE_ORDER}
        boardTone={boardTone}
        empty={{
          cols: [
            t("m.dailyLog.col.date", undefined, "Date"),
            t("m.dailyLog.col.status", undefined, "Status"),
            t("m.dailyLog.col.summary", undefined, "Summary"),
          ],
          title: t("m.dailyLog.emptyTitle", undefined, "No Logs Yet"),
          hint: t("m.dailyLog.emptyBody", undefined, "Start the day's log with weather and notes."),
        }}
      />
      {detail && (
        <RecordDetail
          title={detail.dateLabel}
          icon="NotebookPen"
          status={{ tone: (detail.log_state ? STATE_TONE[detail.log_state] : undefined) ?? "neutral", label: stateOf(detail) }}
          fields={[
            ...(detail.weather ? [{ k: t("m.dailyLog.weather", undefined, "Weather"), v: detail.weather }] : []),
            {
              k: t("m.dailyLog.col.notes", undefined, "Notes"),
              v: detail.notes ?? t("m.dailyLog.noNotes", undefined, "No notes written for this day."),
              full: true,
            },
          ]}
          sections={
            detail.log_state === "draft"
              ? [
                  {
                    h: t("m.dailyLog.submitHead", undefined, "Submit This Log"),
                    node: (
                      <div style={{ marginTop: 8 }}>
                        <SubmitLogButton id={detail.id} label={t("m.dailyLog.submit", undefined, "Submit")} />
                      </div>
                    ),
                  },
                ]
              : []
          }
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}
