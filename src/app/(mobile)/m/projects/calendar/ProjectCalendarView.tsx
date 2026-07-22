"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { HubChrome } from "@/components/mobile/HubChrome";
import { NormalizedList, ListRow, RecordDetail, type FieldDef, type RecordAction } from "@/components/mobile/kit";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { ProjectEvent } from "@/lib/mobile/project-xpms";
import { setEventState, type State } from "../actions";

const EVENT_STATES = ["Scheduled", "Upcoming", "Done"] as const;

/**
 * Project Calendar — XPMS-keyed events (the field slice of the ATLVS unified
 * schedule). Agenda view by date is the default; the same schema drives
 * list/table/board. `My Calendar` (/m/schedule) is the personal slice.
 */
const STATUS_TONE: Record<string, string> = { Scheduled: "info", Upcoming: "text-3", Done: "success" };
const PHASE_ORDER = ["Discover", "Design", "Advance", "Procure", "Build", "Install", "Operate", "Amplify", "Close"];

function StatusChip({ status }: { status: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--p-text-2)", whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: `var(--p-${STATUS_TONE[status] ?? "text-3"})` }} />
      {status}
    </span>
  );
}

export function ProjectCalendarView({ items, canManage }: { items: ProjectEvent[]; canManage: boolean }) {
  const t = useT();
  const [detail, setDetail] = useState<ProjectEvent | null>(null);
  const [, startTx] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const FIELDS: FieldDef<ProjectEvent>[] = [
    { id: "title", label: t("m.projects.cal.col.event", undefined, "Event"), type: "text", get: (x) => x.title },
    { id: "date", label: t("m.projects.cal.col.when", undefined, "When"), type: "date", get: (x) => x.event_date, iso: (x) => x.event_iso },
    { id: "status", label: t("m.projects.col.status", undefined, "Status"), type: "select", options: ["Scheduled", "Upcoming", "Done"], get: (x) => x.status },
    { id: "phase", label: t("m.projects.col.phase", undefined, "Phase"), type: "select", options: PHASE_ORDER, get: (x) => x.phase },
    { id: "department", label: t("m.projects.col.department", undefined, "Department"), type: "select", get: (x) => x.department },
    { id: "owner", label: t("m.projects.col.owner", undefined, "Owner"), type: "text", get: (x) => x.owner ?? "" },
  ];

  const setState = (x: ProjectEvent, state: string) => {
    const f = new FormData();
    f.set("id", x.id);
    f.set("state", state);
    startTx(async () => {
      const res: State = await setEventState(null, f);
      if (res?.error) toast.error(res.error);
      else router.refresh();
    });
  };
  const detailActions = (x: ProjectEvent): RecordAction[] =>
    !canManage
      ? []
      : EVENT_STATES.filter((s) => s !== x.status).map((s) => ({
          label: t("m.projects.markState", { state: s }, `Mark ${s}`),
          icon: s === "Done" ? "Check" : "ArrowRight",
          primary: s === "Done",
          on: () => setState(x, s),
        }));

  const row = (x: ProjectEvent, compact?: boolean) => (
    <ListRow
      key={x.id}
      icon="CalendarDays"
      title={x.title}
      sub={compact ? x.event_date : `${x.event_date} · ${x.department} · ${x.owner ?? "—"}`}
      right={<StatusChip status={x.status} />}
      onClick={() => setDetail(x)}
    />
  );
  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="projects" active="calendar" canManage={canManage} />
      <NormalizedList
        k="pcal"
        items={items}
        fields={FIELDS}
        search={(x) => `${x.title} ${x.sub ?? ""} ${x.department} ${x.owner ?? ""} ${x.event_date}`}
        searchPlaceholder={t("m.projects.cal.search", undefined, "Search project calendar…")}
        renderRow={row}
        onRow={setDetail}
        views={["calendar", "list", "table"]}
        initialView="calendar"
        dateField="date"
        pill={{ get: (x) => x.department }}
        empty={{
          cols: [
            t("m.projects.cal.col.event", undefined, "Event"),
            t("m.projects.cal.col.when", undefined, "When"),
            t("m.projects.col.status", undefined, "Status"),
          ],
          title: t("m.projects.cal.empty", undefined, "No project events"),
          hint: t("m.projects.cal.emptyHint", undefined, "The project schedule shows here."),
        }}
      />
      {detail && (
        <RecordDetail
          title={detail.title}
          icon="CalendarDays"
          status={{ tone: STATUS_TONE[detail.status] ?? "neutral", label: detail.status }}
          fields={[
            { k: t("m.projects.cal.col.when", undefined, "When"), v: detail.event_date },
            { k: t("m.projects.col.department", undefined, "Department"), v: detail.department },
            { k: t("m.projects.col.phase", undefined, "Phase"), v: detail.phase },
            { k: t("m.projects.col.coordinate", undefined, "Coordinate"), v: `${detail.dept_code}×${detail.phase}` },
            { k: t("m.projects.col.xpmsAtom", undefined, "XPMS Atom"), v: detail.xpms_atom_id },
            { k: t("m.projects.col.owner", undefined, "Owner"), v: detail.owner ?? "—" },
            ...(detail.sub ? [{ k: t("m.projects.col.notes", undefined, "Notes"), v: detail.sub, full: true }] : []),
          ]}
          actions={detailActions(detail)}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
