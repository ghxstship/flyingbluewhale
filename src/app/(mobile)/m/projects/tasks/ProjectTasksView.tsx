"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HubChrome } from "@/components/mobile/HubChrome";
import { NormalizedList, ListRow, RecordDetail, KIcon, type FieldDef, type RecordAction } from "@/components/mobile/kit";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { ProjectTask } from "@/lib/mobile/project-xpms";
import { setTaskState, reassignTask, archiveTask, type State } from "../actions";

const TASK_STATES = ["Open", "In progress", "Blocked", "Done"] as const;

/**
 * Project Tasks — the XPMS SSOT field task dataset (all crew). One schema
 * drives list/table/board/calendar; the board (columns = phase) + group-by
 * department IS the Coordinate Matrix. `My Tasks` (/m/tasks) is the personal
 * slice of this; here every crew member's work item shows.
 */
const STATUS_TONE: Record<string, string> = {
  Open: "text-3",
  "In progress": "info",
  Blocked: "warning",
  Done: "success",
};
const PRIORITY_TONE: Record<string, string> = { High: "danger", Medium: "warning", Low: "text-3" };
const PHASE_ORDER = ["Discover", "Design", "Advance", "Procure", "Build", "Install", "Operate", "Amplify", "Close"];

function StatusChip({ status }: { status: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--p-text-2)", whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: `var(--p-${STATUS_TONE[status] ?? "text-3"})` }} />
      {status}
    </span>
  );
}

export function ProjectTasksView({ items, canManage }: { items: ProjectTask[]; canManage: boolean }) {
  const t = useT();
  const [detail, setDetail] = useState<ProjectTask | null>(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignTo, setReassignTo] = useState("");
  const [pending, startTx] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const FIELDS: FieldDef<ProjectTask>[] = [
    { id: "title", label: t("m.projects.tasks.col.task", undefined, "Task"), type: "text", get: (x) => x.title },
    { id: "status", label: t("m.projects.col.status", undefined, "Status"), type: "select", options: ["Open", "In progress", "Blocked", "Done"], get: (x) => x.status },
    { id: "priority", label: t("m.projects.col.priority", undefined, "Priority"), type: "select", options: ["High", "Medium", "Low"], get: (x) => x.priority },
    { id: "phase", label: t("m.projects.col.phase", undefined, "Phase"), type: "select", options: PHASE_ORDER, get: (x) => x.phase },
    { id: "department", label: t("m.projects.col.department", undefined, "Department"), type: "select", get: (x) => x.department },
    { id: "discipline", label: t("m.projects.col.discipline", undefined, "Discipline"), type: "select", get: (x) => x.discipline },
    { id: "coordinate", label: t("m.projects.col.coordinate", undefined, "Coordinate"), type: "text", get: (x) => x.coordinate },
    { id: "assignee", label: t("m.projects.col.assignee", undefined, "Assignee"), type: "text", get: (x) => x.assignee ?? "" },
    { id: "trade", label: t("m.projects.col.trade", undefined, "Trade"), type: "select", get: (x) => x.trade ?? "" },
    { id: "company", label: t("m.projects.col.company", undefined, "Company"), type: "text", get: (x) => x.company ?? "" },
    { id: "location", label: t("m.projects.col.location", undefined, "Location"), type: "text", get: (x) => x.location ?? "" },
    { id: "due", label: t("m.projects.col.due", undefined, "Due"), type: "text", get: (x) => x.due ?? "" },
  ];

  const fd = (o: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(o)) f.set(k, v);
    return f;
  };
  const run = (action: (p: State, f: FormData) => Promise<State>, payload: Record<string, string>, closeDetail?: boolean) => {
    startTx(async () => {
      const res = await action(null, fd(payload));
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setReassignOpen(false);
      if (closeDetail) setDetail(null);
      router.refresh();
    });
  };

  const detailActions = (x: ProjectTask): RecordAction[] => {
    if (!canManage) return [];
    const moves = TASK_STATES.filter((s) => s !== x.status).map((s) => ({
      label: t("m.projects.markState", { state: s }, `Mark ${s}`),
      icon: s === "Done" ? "Check" : s === "Blocked" ? "Ban" : "ArrowRight",
      primary: s === "Done",
      on: () => run(setTaskState, { id: x.id, state: s }),
    }));
    return [
      ...moves,
      {
        label: t("m.projects.tasks.archive", undefined, "Archive Task"),
        icon: "Archive",
        danger: true,
        confirmText: t("m.projects.tasks.archiveConfirm", undefined, "Archive this task? It leaves the active list."),
        on: () => run(archiveTask, { id: x.id }, true),
      },
    ];
  };

  const reassignSection = (x: ProjectTask) =>
    !canManage
      ? []
      : [
          {
            h: t("m.projects.col.assignee", undefined, "Assignee"),
            action: {
              label: reassignOpen
                ? t("m.projects.tasks.reassignCancel", undefined, "Cancel")
                : t("m.projects.tasks.reassign", undefined, "Reassign"),
              on: () => { setReassignOpen((o) => !o); setReassignTo(x.assignee ?? ""); },
            },
            node: reassignOpen ? (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  className="ps-input"
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  placeholder={t("m.projects.tasks.assigneePlaceholder", undefined, "Assignee name…")}
                  style={{ flex: 1 }}
                  aria-label={t("m.projects.tasks.assigneeAria", undefined, "Assignee name")}
                />
                <button
                  type="button"
                  className="ps-btn ps-btn--cta"
                  disabled={pending}
                  onClick={() => run(reassignTask, { id: x.id, assignee: reassignTo })}
                  style={{ flex: "none", justifyContent: "center" }}
                >
                  <KIcon name="Check" size={15} /> {t("m.projects.tasks.reassignSave", undefined, "Save")}
                </button>
              </div>
            ) : (
              <div className="s" style={{ color: "var(--p-text-3)" }}>
                {x.assignee ?? t("m.projects.tasks.unassigned", undefined, "Unassigned")}
              </div>
            ),
          },
        ];

  const row = (x: ProjectTask, compact?: boolean) => (
    <ListRow
      key={x.id}
      icon="ListChecks"
      iconColor={`var(--p-${PRIORITY_TONE[x.priority] ?? "text-3"})`}
      title={x.title}
      sub={
        compact
          ? `${x.coordinate} · ${x.assignee ?? "—"}`
          : `${x.coordinate} · ${x.department} · ${x.assignee ?? "—"} · ${t("m.projects.col.due", undefined, "Due")} ${x.due ?? "—"}`
      }
      right={<StatusChip status={x.status} />}
      onClick={() => setDetail(x)}
    />
  );
  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="projects" active="tasks" canManage={canManage} />
      <NormalizedList
        k="ptask"
        items={items}
        fields={FIELDS}
        search={(x) => `${x.title} ${x.sub ?? ""} ${x.assignee ?? ""} ${x.department} ${x.discipline} ${x.coordinate} ${x.trade ?? ""} ${x.company ?? ""}`}
        searchPlaceholder={t("m.projects.tasks.search", undefined, "Search project tasks…")}
        renderRow={row}
        onRow={setDetail}
        views={["list", "table", "board"]}
        statusField="phase"
        statusOrder={PHASE_ORDER}
        pill={{ get: (x) => x.priority, order: ["High", "Medium", "Low"] }}
        empty={{
          cols: [
            t("m.projects.tasks.col.task", undefined, "Task"),
            t("m.projects.col.coordinate", undefined, "Coordinate"),
            t("m.projects.col.status", undefined, "Status"),
          ],
          title: t("m.projects.tasks.empty", undefined, "No project tasks"),
          hint: t("m.projects.tasks.emptyHint", undefined, "Tasks assigned across the project show here."),
        }}
      />
      {detail && (
        <RecordDetail
          title={detail.title}
          icon="ListChecks"
          status={{ tone: STATUS_TONE[detail.status] ?? "neutral", label: detail.status }}
          fields={[
            { k: t("m.projects.col.coordinate", undefined, "Coordinate"), v: detail.coordinate },
            { k: t("m.projects.col.xpmsAtom", undefined, "XPMS Atom"), v: detail.xpms_atom_id },
            { k: t("m.projects.col.department", undefined, "Department"), v: detail.department },
            { k: t("m.projects.col.discipline", undefined, "Discipline"), v: detail.discipline },
            { k: t("m.projects.col.category", undefined, "Category"), v: detail.category },
            { k: t("m.projects.col.phase", undefined, "Phase"), v: detail.phase },
            { k: t("m.projects.col.priority", undefined, "Priority"), v: detail.priority },
            { k: t("m.projects.col.assignee", undefined, "Assignee"), v: detail.assignee ?? "—" },
            { k: t("m.projects.col.trade", undefined, "Trade"), v: detail.trade ?? "—" },
            { k: t("m.projects.col.company", undefined, "Company"), v: detail.company ?? "—" },
            { k: t("m.projects.col.location", undefined, "Location"), v: detail.location ?? "—" },
            { k: t("m.projects.col.due", undefined, "Due"), v: detail.due ?? "—" },
            ...(detail.sub ? [{ k: t("m.projects.col.notes", undefined, "Notes"), v: detail.sub, full: true }] : []),
          ]}
          sections={reassignSection(detail)}
          actions={detailActions(detail)}
          onClose={() => { setDetail(null); setReassignOpen(false); }}
        />
      )}
    </div>
  );
}
