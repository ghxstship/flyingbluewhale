"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ActionBar,
  EmptySkeleton,
  GroupedList,
  KIcon,
  ProgressRing,
  SwipeRow,
  UndoBar,
  useUndo,
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

type View = "list" | "board" | "table";

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

const PRI_RANK: Record<KitTask["priority"], number> = { High: 0, Medium: 1, Low: 2 };

/** Stable colour per state for the board lane dots. */
const STATE_DOT: Record<TaskState, string> = {
  todo: "var(--p-text-3)",
  in_progress: "var(--p-info)",
  blocked: "var(--p-warning)",
  review: "var(--p-info)",
  done: "var(--p-success)",
};

export function TasksList({ tasks, labels: L }: { tasks: KitTask[]; labels: TasksLabels }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("list");
  const [group, setGroup] = useState("none");
  const [sort, setSort] = useState("due");
  const [states, setStates] = useState<Set<TaskState>>(new Set());
  const [showCompleted, setShowCompleted] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
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

  const entries = useMemo(() => {
    return tasks
      .filter((t) => states.size === 0 || states.has(stateOverride.get(t.id) ?? t.state))
      .filter((t) => showCompleted || (stateOverride.get(t.id) ?? t.state) !== "done")
      .filter((t) => showArchived || !(archOverride.get(t.id) ?? t.archived))
      .filter((t) => !query || (t.title + " " + t.sub).toLowerCase().includes(query.toLowerCase()))
      .slice()
      .sort((a, b) => {
        if (sort === "name") return a.title.localeCompare(b.title);
        if (sort === "priority") return PRI_RANK[a.priority] - PRI_RANK[b.priority];
        if (sort === "status") return (stateOverride.get(a.id) ?? a.state).localeCompare(stateOverride.get(b.id) ?? b.state);
        if (sort === "assignee") return a.assignee.localeCompare(b.assignee);
        return a.due.localeCompare(b.due);
      });
  }, [tasks, states, showCompleted, showArchived, query, sort, stateOverride, archOverride]);

  const filterActive = states.size + (showCompleted ? 0 : 1) + (showArchived ? 1 : 0);

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

  const bcard = (t: KitTask) => (
    <div
      className="bcard"
      key={t.id}
      role="button"
      tabIndex={0}
      onClick={() => open(t.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(t.id);
        }
      }}
      style={{ cursor: "pointer" }}
    >
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
    </div>
  );

  // Grouping.
  const grouped = useMemo(() => {
    if (group === "none") return null;
    const map: Record<string, KitTask[]> = {};
    if (group === "status") {
      entries.forEach((t) => {
        (map[t.state] = map[t.state] || []).push(t);
      });
      return TASK_STATES.filter((s) => map[s]).map((s) => [stateLabel[s], map[s]!] as [string, KitTask[]]);
    }
    if (group === "priority") {
      entries.forEach((t) => {
        (map[t.priority] = map[t.priority] || []).push(t);
      });
      return (["High", "Medium", "Low"] as const)
        .filter((p) => map[p])
        .map((p) => [p, map[p]!] as [string, KitTask[]]);
    }
    // assignee
    entries.forEach((t) => {
      (map[t.assignee] = map[t.assignee] || []).push(t);
    });
    return Object.keys(map)
      .sort()
      .map((a) => [a, map[a]!] as [string, KitTask[]]);
  }, [entries, group, stateLabel]);

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{L.eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {L.title}
      </h1>

      <ActionBar<KitTask>
        k="tk"
        query={query}
        setQuery={setQuery}
        placeholder={L.search}
        view={view}
        setView={(v) => setView(v as View)}
        views={["list", "board", "table"]}
        group={group}
        setGroup={setGroup}
        groupOpts={[
          ["none", L.groupNone],
          ["status", L.groupStatus],
          ["priority", L.groupPriority],
          ["assignee", L.groupAssignee],
        ]}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["due", L.sortDue],
          ["priority", L.sortPriority],
          ["name", L.sortName],
          ["status", L.sortStatus],
          ["assignee", L.sortAssignee],
        ]}
        filterActive={filterActive}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <>
            <div className="wl" style={{ marginBottom: 8 }}>
              {L.filterStatus}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
              {TASK_STATES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`chip ${states.has(s) ? "on" : ""}`}
                  onClick={() =>
                    setStates((prev) => {
                      const n = new Set(prev);
                      if (n.has(s)) n.delete(s);
                      else n.add(s);
                      return n;
                    })
                  }
                >
                  {stateLabel[s]}
                </button>
              ))}
            </div>
            <label
              style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={() => setShowCompleted((v) => !v)}
              />
              <span className="wl">{L.showCompleted}</span>
            </label>
            <label
              style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={showArchived}
                onChange={() => setShowArchived((v) => !v)}
              />
              <span className="wl">{L.showArchived}</span>
            </label>
            <button
              type="button"
              className="pill"
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
              onClick={() => {
                setStates(new Set());
                setShowCompleted(true);
                setShowArchived(false);
              }}
            >
              {L.reset}
            </button>
          </>
        }
      />

      {view === "list" &&
        (grouped ? (
          <GroupedList<KitTask>
            skey="tk"
            groups={grouped}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            renderRow={(t) => row(t)}
          />
        ) : (
          entries.map((t) => row(t))
        ))}

      {view === "board" && (
        <>
          <div className="board">
            {TASK_STATES.map((s) => {
              const es = entries.filter((t) => stateOf(t) === s);
              return (
                <div className="bcol" key={s}>
                  <div className="bcol-h">
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATE_DOT[s] }} />
                    {stateLabel[s]}
                    <span className="cnt">{es.length}</span>
                  </div>
                  <div className="bcol-body">
                    {es.map(bcard)}
                    {!es.length && <div className="bcol-empty">{L.noTasksInLane}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="swipehint">
            <KIcon name="MoveHorizontal" size={13} /> {L.swipeHint}
          </div>
        </>
      )}

      {view === "table" && (
        <div className="dtbl">
          <div className="dtbl-head">
            <span>{L.colTask}</span>
            <span className="sp" />
            <span>{L.colDue}</span>
          </div>
          {entries.map((t) => (
            <div
              className="dtbl-row"
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => open(t.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  open(t.id);
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <span className="pri-dot" style={{ background: PRI_COLOR[t.priority] }} title={t.priority} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="dt-title">{t.title}</div>
                <div className="dt-meta">
                  <span className={badgeClass(t.state)}>{stateLabel[t.state]}</span>
                </div>
              </div>
              <div className="dt-due">
                {t.due}
                <KIcon name="ChevronRight" size={15} style={{ color: "var(--p-text-3)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kit 31 (live-test resolution #16): empty states keep the view's
          structure visible — column headers + ghost rows (EmptySkeleton).
          Exemplar adoption; the remaining lists convert in the follow-up. */}
      {!entries.length && (
        <EmptySkeleton cols={[L.colTask, L.groupStatus, L.colDue]} title={L.empty} hint={L.emptyBody} />
      )}

      <UndoBar undo={undo} onUndo={clearUndo} undoLabel={L.undo} />

      {/* Kit FAB: New Task (CREATE map, runtime/app.jsx). */}
      <Link href="/m/tasks/new" className="fab" aria-label={L.newTask}>
        <KIcon name="Plus" size={24} />
      </Link>
    </div>
  );
}
