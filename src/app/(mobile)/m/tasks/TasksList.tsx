"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionBar, GroupedList, KIcon, SwipeRow } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  PRI_COLOR,
  TASK_STATES,
  stateTone,
  type KitTask,
  type TaskState,
} from "./_shared";

export type TasksLabels = {
  eyebrow: string;
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
  filterStatus: string;
  showCompleted: string;
  reset: string;
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
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("list");
  const [group, setGroup] = useState("none");
  const [sort, setSort] = useState("due");
  const [states, setStates] = useState<Set<TaskState>>(new Set());
  const [showCompleted, setShowCompleted] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

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
      .filter((t) => states.size === 0 || states.has(t.state))
      .filter((t) => showCompleted || t.state !== "done")
      .filter((t) => !query || (t.title + " " + t.sub).toLowerCase().includes(query.toLowerCase()))
      .slice()
      .sort((a, b) => {
        if (sort === "name") return a.title.localeCompare(b.title);
        if (sort === "priority") return PRI_RANK[a.priority] - PRI_RANK[b.priority];
        return a.due.localeCompare(b.due);
      });
  }, [tasks, states, showCompleted, query, sort]);

  const filterActive = states.size + (showCompleted ? 0 : 1);

  const open = (id: string) => router.push(`/m/tasks/${id}`);

  const row = (t: KitTask) => (
    <SwipeRow
      key={t.id}
      onClick={() => open(t.id)}
      actions={[{ icon: "ArrowRight", label: L.colTask, tone: "info", on: () => open(t.id) }]}
    >
      <div className="item" style={{ width: "100%" }}>
        <span
          style={{ width: 8, height: 8, borderRadius: 2, background: PRI_COLOR[t.priority], flex: "none" }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="t">{t.title}</div>
          <div className="s">{t.sub || t.assignee}</div>
        </div>
        <span className="sp" />
        <span style={{ textAlign: "right" }}>
          <span className={badgeClass(t.state)}>{stateLabel[t.state]}</span>
          <div className="time" style={{ marginTop: 6, color: "var(--p-text-3)" }}>
            {t.due}
          </div>
        </span>
      </div>
    </SwipeRow>
  );

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
            <button
              type="button"
              className="pill"
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
              onClick={() => {
                setStates(new Set());
                setShowCompleted(true);
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
              const es = entries.filter((t) => t.state === s);
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

      {!entries.length && <EmptyState title={L.empty} description={L.emptyBody} />}
    </div>
  );
}
