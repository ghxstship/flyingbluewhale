"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ActionBar,
  DataTable,
  GroupedList,
  type FieldDef,
} from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { EmptySkeleton } from "@/components/mobile/kit";
import { useFormatters } from "@/lib/i18n/LocaleProvider";

/** Plain event shape handed down from the server page. */
export type SchedEvent = {
  id: string;
  name: string;
  type: "shift" | "meeting" | "training" | "ros";
  time: string;
  dateKey: string;
  sub: string;
  state: string;
  tone: "ok" | "info" | "warn" | "neutral" | "danger";
};

type Labels = {
  search: string;
  empty: string;
  emptyBody: string;
  emptyDay: string;
  emptyDayBody: string;
  typeShift: string;
  typeMeeting: string;
  typeTraining: string;
  typeRos: string;
  groupNone: string;
  groupType: string;
  sortTime: string;
  sortName: string;
  filterType: string;
  reset: string;
  colEvent: string;
  colType: string;
  colTime: string;
  colDetail: string;
  colStatus: string;
};

type View = "list" | "calendar" | "table";

function badgeClass(tone: SchedEvent["tone"]): string {
  switch (tone) {
    case "ok":
      return "ps-badge ps-badge--ok";
    case "info":
      return "ps-badge ps-badge--info";
    case "warn":
      return "ps-badge ps-badge--warn";
    case "danger":
      return "ps-badge ps-badge--danger";
    default:
      return "ps-badge ps-badge--neutral";
  }
}

export function ScheduleView({ events, labels }: { events: SchedEvent[]; labels: Labels }) {
  const fmt = useFormatters();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("list");
  const [group, setGroup] = useState("none");
  const [sort, setSort] = useState("time");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [calDay, setCalDay] = useState<string | null>(null);
  // `todayKey` is empty until mount — deriving today from `new Date()` during
  // render runs at different instants on server vs client and flips the
  // "today" highlight, hydration-mismatching (React #418). The highlight is a
  // client-only adornment that appears after mount.
  const [todayKey, setTodayKey] = useState("");
  useEffect(() => setTodayKey(new Date().toISOString().slice(0, 10)), []);

  // The kit's per-type metadata: accent color drives the bar + tag tint.
  const typeMeta = useMemo(
    () => ({
      shift: { label: labels.typeShift, c: "var(--p-accent)" },
      meeting: { label: labels.typeMeeting, c: "var(--p-info)" },
      training: { label: labels.typeTraining, c: "var(--p-success)" },
      ros: { label: labels.typeRos, c: "var(--p-warning)" },
    }),
    [labels],
  );

  const evs = useMemo(() => {
    return events
      .filter((e) => types.size === 0 || types.has(e.type))
      .filter((e) => !query || (e.name + " " + e.sub).toLowerCase().includes(query.toLowerCase()))
      .slice()
      .sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name)
          : sort === "type"
            ? a.type.localeCompare(b.type)
            : String(a.time).localeCompare(String(b.time)),
      );
  }, [events, types, query, sort]);

  const grouped = useMemo(() => {
    if (group === "type") {
      const m: Record<string, SchedEvent[]> = {};
      evs.forEach((e) => {
        (m[e.type] = m[e.type] || []).push(e);
      });
      return (Object.keys(typeMeta) as Array<keyof typeof typeMeta>)
        .filter((k) => m[k])
        .map((k) => [typeMeta[k].label, m[k]!] as [string, SchedEvent[]]);
    }
    if (group === "state") {
      const m: Record<string, SchedEvent[]> = {};
      evs.forEach((e) => {
        (m[e.state] = m[e.state] || []).push(e);
      });
      return Object.keys(m)
        .sort()
        .map((k) => [k, m[k]!] as [string, SchedEvent[]]);
    }
    return null;
  }, [evs, group, typeMeta]);

  const eventRow = (e: SchedEvent) => {
    const m = typeMeta[e.type];
    return (
      <div className="item" key={e.id}>
        <span className="bar" style={{ background: m.c, opacity: e.state === "live" ? 1 : 0.55 }} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <span
              className="typetag"
              style={{ background: `color-mix(in oklab, ${m.c} 16%, transparent)`, color: m.c }}
            >
              {m.label}
            </span>
          </div>
          <div className="t">{e.name}</div>
          <div className="s">{e.sub}</div>
        </div>
        <span className="sp" />
        <span style={{ textAlign: "right" }}>
          <span className={badgeClass(e.tone)}>{e.state}</span>
          <div className="time" style={{ marginTop: 6 }}>
            {e.time}
          </div>
        </span>
      </div>
    );
  };

  // Calendar view — week strip built from the distinct event days (or just
  // today when there's no data). Selecting a day filters the agenda.
  const days = useMemo(() => {
    const set = new Set(events.map((e) => e.dateKey).filter(Boolean));
    return Array.from(set).sort();
  }, [events]);

  const activeDay = calDay ?? days[0] ?? "";
  const dayEvents = useMemo(
    () =>
      evs
        .filter((e) => e.dateKey === activeDay)
        .slice()
        .sort((a, b) => String(a.time).localeCompare(String(b.time))),
    [evs, activeDay],
  );

  const tableFields: FieldDef<SchedEvent>[] = [
    { id: "name", label: labels.colEvent, type: "text", get: (e) => e.name },
    { id: "type", label: labels.colType, type: "text", get: (e) => typeMeta[e.type].label },
    { id: "time", label: labels.colTime, type: "text", get: (e) => e.time },
    { id: "sub", label: labels.colDetail, type: "text", get: (e) => e.sub },
    { id: "state", label: labels.colStatus, type: "text", get: (e) => e.state },
  ];

  return (
    <>
      <ActionBar<SchedEvent>
        k="sc"
        query={query}
        setQuery={setQuery}
        placeholder={labels.search}
        view={view}
        setView={(v) => setView(v as View)}
        views={["list", "calendar", "table"]}
        group={group}
        setGroup={setGroup}
        groupOpts={[
          ["none", labels.groupNone],
          ["type", labels.groupType],
          ["state", labels.colStatus],
        ]}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["time", labels.sortTime],
          ["name", labels.sortName],
          ["type", labels.colType],
        ]}
        filterActive={types.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <>
            <div className="wl" style={{ marginBottom: 8 }}>
              {labels.filterType}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
              {(Object.entries(typeMeta) as Array<[string, { label: string }]>).map(([id, m]) => (
                <button
                  key={id}
                  type="button"
                  className={`chip ${types.has(id) ? "on" : ""}`}
                  onClick={() =>
                    setTypes((prev) => {
                      const n = new Set(prev);
                      if (n.has(id)) n.delete(id);
                      else n.add(id);
                      return n;
                    })
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="pill"
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
              onClick={() => setTypes(new Set())}
            >
              {labels.reset}
            </button>
          </>
        }
      />

      {view === "table" && <DataTable<SchedEvent> fields={tableFields} items={evs} />}

      {view === "list" &&
        (grouped ? (
          <GroupedList<SchedEvent>
            skey="sc"
            groups={grouped}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            renderRow={(e) => eventRow(e)}
          />
        ) : (
          evs.map((e) => eventRow(e))
        ))}
      {view === "list" && !evs.length && (
        <EmptySkeleton cols={[labels.colEvent, labels.colType, labels.colTime]} title={labels.empty} hint={labels.emptyBody} />
      )}

      {view === "calendar" && (
        <>
          <div className="weekstrip">
            {(days.length ? days : [activeDay]).map((d) => {
              const cnt = evs.filter((e) => e.dateKey === d).length;
              // d is the dateKey; when empty (no event days) fall back to the
              // post-mount today key so the lone strip cell still labels a day.
              const key = d || todayKey;
              const dt = key ? new Date(key + "T00:00:00") : null;
              const dow = dt ? fmt.dateParts(dt, { weekday: "short" }).toUpperCase() : "";
              const dnum = dt ? dt.getDate() : "";
              const isToday = key !== "" && key === todayKey;
              return (
                <button
                  key={d || "today"}
                  type="button"
                  className={`wday ${activeDay === d ? "on" : ""}`}
                  onClick={() => setCalDay(d)}
                >
                  <span className="wd">{dow}</span>
                  <span className="wn" data-today={isToday ? "1" : undefined}>
                    {dnum}
                  </span>
                  <span className="wdots">
                    {Array.from({ length: Math.min(cnt, 3) }).map((_, k) => (
                      <i key={k} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="daycal">
            {dayEvents.length ? (
              dayEvents.map((e) => {
                const m = typeMeta[e.type];
                return (
                  <div className="dc-row" key={e.id}>
                    <div className="dc-time">{e.time}</div>
                    <div
                      className="dc-ev"
                      style={{
                        borderLeftColor: m.c,
                        background: `color-mix(in oklab, ${m.c} 10%, var(--p-surface))`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span
                          className="typetag"
                          style={{
                            background: `color-mix(in oklab, ${m.c} 16%, transparent)`,
                            color: m.c,
                          }}
                        >
                          {m.label}
                        </span>
                      </div>
                      <div className="t">{e.name}</div>
                      <div className="s">{e.sub}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState title={labels.emptyDay} description={labels.emptyDayBody} />
            )}
          </div>
        </>
      )}
    </>
  );
}
