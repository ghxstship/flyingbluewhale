"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Fab,
  KIcon,
  NormalizedList,
  ProgressRing,
  SwipeRow,
  UndoBar,
  useUndo,
  type FieldDef,
} from "@/components/mobile/kit";
import { useToast } from "@/lib/hooks/useToast";
import {
  PRI_COLOR,
  TASK_STATES,
  stateTone,
  type KitTask,
  type TaskState,
} from "./_shared";
import { setTaskArchived, setTaskFlag } from "./actions";
import { setTaskState } from "./[taskId]/actions";

export type TasksLabels = {
  eyebrow: string;
  newTask: string;
  title: string;
  search: string;
  empty: string;
  emptyBody: string;
  groupNone: string;
  groupStatus: string;
  groupPriority: string;
  groupAssignee: string;
  sortDue: string;
  sortPriority: string;
  sortName: string;
  sortStatus: string;
  sortAssignee: string;
  filterStatus: string;
  showCompleted: string;
  showArchived: string;
  reset: string;
  done: string;
  reopen: string;
  flag: string;
  unflag: string;
  archive: string;
  archivedTag: string;
  archivedUndo: string;
  undo: string;
  stateOpen: string;
  stateProgress: string;
  stateBlocked: string;
  stateReview: string;
  stateDone: string;
  colTask: string;
  colDue: string;
  noTasksInLane: string;
  swipeHint: string;
};

function badgeClass(s: TaskState): string {
  switch (stateTone(s)) {
    case "ok":
      return "ps-badge ps-badge--ok";
    case "warn":
      return "ps-badge ps-badge--warn";
    case "info":
      return "ps-badge ps-badge--info";
    default:
      return "ps-badge ps-badge--neutral";
  }
}

export function TasksList({ tasks, labels: L }: { tasks: KitTask[]; labels: TasksLabels }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [showCompleted, setShowCompleted] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  // Kit 31 swipe canon — optimistic row state over the server stores.
  const [stateOverride, setStateOverride] = useState<Map<string, TaskState>>(new Map());
  const [flagOverride, setFlagOverride] = useState<Map<string, boolean>>(new Map());
  const [archOverride, setArchOverride] = useState<Map<string, boolean>>(new Map());
  const { undo, withUndo, clearUndo } = useUndo();

  const stateOf = (t: KitTask): TaskState => stateOverride.get(t.id) ?? t.state;
  const isFlagged = (t: KitTask) => flagOverride.get(t.id) ?? t.flagged;
  const isArchived = (t: KitTask) => archOverride.get(t.id) ?? t.archived;

  const toggleDone = (t: KitTask) => {
    const cur = stateOf(t);
    const next: TaskState = cur === "done" ? "todo" : "done";
    setStateOverride((m) => new Map(m).set(t.id, next));
    const fd = new FormData();
    fd.set("taskId", t.id);
    fd.set("next", next);
    startTransition(async () => {
      const res = await setTaskState(null, fd);
      if (res?.error) {
        setStateOverride((m) => new Map(m).set(t.id, cur));
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  };

  const toggleFlag = (t: KitTask) => {
    const next = !isFlagged(t);
    setFlagOverride((m) => new Map(m).set(t.id, next));
    const fd = new FormData();
    fd.set("taskId", t.id);
    fd.set("on", next ? "1" : "");
    startTransition(async () => {
      const res = await setTaskFlag(null, fd);
      if (res?.error) {
        setFlagOverride((m) => new Map(m).set(t.id, !next));
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  };

  const setArchived = (t: KitTask, on: boolean, onError: () => void) => {
    const fd = new FormData();
    fd.set("taskId", t.id);
    fd.set("on", on ? "1" : "");
    startTransition(async () => {
      const res = await setTaskArchived(null, fd);
      if (res?.error) {
        onError();
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  };

  const archiveTask = (t: KitTask) => {
    setArchOverride((m) => new Map(m).set(t.id, true));
    setArchived(t, true, () => setArchOverride((m) => new Map(m).set(t.id, false)));
    withUndo(`${L.archivedUndo} · ${t.title}`, () => {
      setArchOverride((m) => new Map(m).set(t.id, false));
      setArchived(t, false, () => setArchOverride((m) => new Map(m).set(t.id, true)));
    });
  };

  const stateLabel: Record<TaskState, string> = useMemo(
    () => ({
      todo: L.stateOpen,
      in_progress: L.stateProgress,
      blocked: L.stateBlocked,
      review: L.stateReview,
      done: L.stateDone,
    }),
    [L],
  );

  // The show-completed / show-archived toggles pre-filter (override-aware);
  // NormalizedList handles search + priority pills + drawer sort/filter/group,
  // and the board (columns = task state) via the field schema.
  const baseItems = useMemo(
    () =>
      tasks
        .filter((t) => showCompleted || (stateOverride.get(t.id) ?? t.state) !== "done")
        .filter((t) => showArchived || !(archOverride.get(t.id) ?? t.archived)),
    [tasks, showCompleted, showArchived, stateOverride, archOverride],
  );

  const open = (id: string) => router.push(`/m/tasks/${id}`);

  // Kit 31 (v2.7 swipe canon): Done/Reopen (ok) · Flag/Unflag (warn) ·
  // Archive (neutral, hidden until "Show Archived", 5s undo).
  const row = (t: KitTask) => {
    const st = stateOf(t);
    const done = st === "done";
    return (
      <SwipeRow
        key={t.id}
        onClick={() => open(t.id)}
        actions={[
          {
            icon: done ? "RotateCcw" : "Check",
            label: done ? L.reopen : L.done,
            tone: "ok",
            on: () => toggleDone(t),
          },
          {
            icon: "Flag",
            label: isFlagged(t) ? L.unflag : L.flag,
            tone: "warn",
            on: () => toggleFlag(t),
          },
          { icon: "Archive", label: L.archive, tone: "neutral", on: () => archiveTask(t) },
        ]}
      >
        <div className="item" style={{ width: "100%", margin: 0 }}>
          <span
            style={{ width: 8, height: 8, borderRadius: 2, background: PRI_COLOR[t.priority], flex: "none" }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              className="t"
              style={{ textDecoration: done ? "line-through" : "none", opacity: done ? 0.55 : 1 }}
            >
              {isFlagged(t) && (
                <KIcon
                  name="Flag"
                  size={12}
                  style={{ color: "var(--p-warning)", marginRight: 5, verticalAlign: "-1px" }}
                />
              )}
              {t.title}
              {isArchived(t) && (
                <span className="time" style={{ marginLeft: 6, color: "var(--p-text-3)" }}>
                  · {L.archivedTag}
                </span>
              )}
            </div>
            <div className="s">{t.sub || t.assignee}</div>
          </div>
          <span className="sp" />
          {/* Kit 32 D4 — completion ring when a real % exists (not done). */}
          {t.percent != null && !done && (
            <ProgressRing value={t.percent} size={26} style={{ marginRight: 4 }} />
          )}
          <span style={{ textAlign: "right" }}>
            <span className={badgeClass(st)}>{stateLabel[st]}</span>
            <div className="time" style={{ marginTop: 6, color: "var(--p-text-3)" }}>
              {t.due}
            </div>
          </span>
        </div>
      </SwipeRow>
    );
  };

  // Board card CONTENT only — the DataView board-card wrapper owns the click
  // (via onRow), so no nested interactive element here.
  const bcard = (t: KitTask) => (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: PRI_COLOR[t.priority], flex: "none" }} />
        <span className="time" style={{ color: "var(--p-text-3)" }}>
          {t.priority}
        </span>
        <span style={{ flex: 1 }} />
        <span className="time" style={{ color: "var(--p-text-3)" }}>
          {t.due}
        </span>
      </div>
      <div className="t">{t.title}</div>
      <div className="s">{t.sub || t.assignee}</div>
    </>
  );

  const STATE_ORDER = TASK_STATES.map((s) => stateLabel[s]);
  const boardTone: Record<string, string> = {};
  for (const s of TASK_STATES) boardTone[stateLabel[s]] = stateTone(s);

  const FIELDS: FieldDef<KitTask>[] = [
    { id: "title", label: L.colTask, type: "text", get: (t) => t.title },
    { id: "status", label: L.groupStatus, type: "select", options: STATE_ORDER, get: (t) => stateLabel[stateOf(t)] },
    { id: "priority", label: L.groupPriority, type: "select", options: ["High", "Medium", "Low"], get: (t) => t.priority },
    { id: "assignee", label: L.groupAssignee, type: "text", get: (t) => t.assignee },
    { id: "due", label: L.colDue, type: "text", get: (t) => t.due },
  ];

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{L.eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {L.title}
      </h1>

      {/* View toggles the drawer can't model: show-completed / show-archived. */}
      <div className="chips" style={{ paddingBottom: 8 }}>
        <button type="button" className={`chip ${showCompleted ? "on" : ""}`} onClick={() => setShowCompleted((v) => !v)}>
          {L.showCompleted}
        </button>
        <button type="button" className={`chip ${showArchived ? "on" : ""}`} onClick={() => setShowArchived((v) => !v)}>
          {L.showArchived}
        </button>
      </div>

      <NormalizedList
        k="tk"
        items={baseItems}
        fields={FIELDS}
        search={(t) => `${t.title} ${t.sub} ${t.assignee}`}
        searchPlaceholder={L.search}
        renderRow={(t) => row(t)}
        gallery={bcard}
        onRow={(t) => open(t.id)}
        views={["list", "board", "table"]}
        statusField="status"
        statusOrder={STATE_ORDER}
        boardTone={boardTone}
        pill={{ get: (t) => t.priority, order: ["High", "Medium", "Low"] }}
        empty={{ cols: [L.colTask, L.groupStatus, L.colDue], title: L.empty, hint: L.emptyBody }}
      />

      <UndoBar undo={undo} onUndo={clearUndo} undoLabel={L.undo} />

      {/* Kit FAB: New Task (CREATE map, runtime/app.jsx). */}
      <Fab href="/m/tasks/new" label={L.newTask} />
    </div>
  );
}
