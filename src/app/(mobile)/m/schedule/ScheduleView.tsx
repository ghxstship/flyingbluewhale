"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ActionBar,
  DataView,
  GroupedTree,
  KIcon,
  Sheet,
  advBar,
  applyModel,
  dataPills,
  emptyViewCtl,
  groupTree,
  type FieldDef,
  type ViewCtl,
} from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { EmptySkeleton } from "@/components/mobile/kit";
import { useFormatters, useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";
import { requestSwap } from "@/components/workforce/swap-action";
import { remindEvent } from "./actions";

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

/**
 * Event quick-look — kit 32 Drawer System (v2.8) candidate: tap an event row
 * → CONTEXT drawer (title · time · area) with Swap / Remind before any full
 * detail. Swap routes into the existing shift-swap flow (`requestSwap`)
 * when the viewer has their OWN shift that day; Remind writes a real
 * `notifications` row (`remindEvent`) — no reminder infra is faked.
 */
function EventQuickLook({
  ev,
  typeLabel,
  swapShiftId,
  onClose,
}: {
  ev: SchedEvent;
  typeLabel: string;
  swapShiftId: string | null;
  onClose: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const [swapOpen, setSwapOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const remind = () => {
    if (pending) return;
    const fd = new FormData();
    fd.set("eventId", ev.id);
    startTransition(async () => {
      const res = await remindEvent(null, fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(t("m.schedule.quicklook.remindDone", undefined, "Reminder Saved"), {
        description: t(
          "m.schedule.quicklook.remindDoneBody",
          undefined,
          "Pinned to your notifications with a link back here.",
        ),
      });
      onClose();
    });
  };

  const sendSwap = () => {
    if (pending || !swapShiftId) return;
    const fd = new FormData();
    fd.set("shiftId", swapShiftId);
    fd.set("revalidate", "/m/schedule");
    if (reason.trim()) fd.set("reason", reason.trim());
    startTransition(async () => {
      const res = await requestSwap(null, fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(t("m.schedule.quicklook.swapSent", undefined, "Swap Requested"), {
        description: t(
          "m.schedule.quicklook.swapSentBody",
          undefined,
          "Your manager sees it on the approvals queue.",
        ),
      });
      onClose();
    });
  };

  return (
    <Sheet
      icon="CalendarDays"
      title={ev.name}
      sub={`${typeLabel} · ${ev.time}`}
      closeLabel={t("m.schedule.quicklook.close", undefined, "Close")}
      onClose={onClose}
    >
      <div className="item" style={{ marginTop: 0 }}>
        <KIcon name="Clock" size={17} style={{ color: "var(--p-text-2)", flex: "none" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{ev.time}</div>
          <div className="s">{ev.sub}</div>
        </div>
        <span className={badgeClass(ev.tone)}>{ev.state}</span>
      </div>

      {swapOpen && swapShiftId ? (
        <div className="item" style={{ display: "block" }}>
          <label className="wl" htmlFor="ql-swap-reason" style={{ display: "block", marginBottom: 6 }}>
            {t("m.schedule.quicklook.swapReason", undefined, "Why can't you make it?")}
          </label>
          <textarea
            id="ql-swap-reason"
            className="ps-input"
            rows={2}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="ps-btn ps-btn--secondary"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => setSwapOpen(false)}
            >
              {t("m.schedule.quicklook.swapCancel", undefined, "Back")}
            </button>
            <button
              type="button"
              className="ps-btn ps-btn--cta"
              style={{ flex: 2, justifyContent: "center" }}
              disabled={pending}
              onClick={sendSwap}
            >
              <KIcon name="ArrowLeftRight" size={15} />{" "}
              {pending
                ? t("m.schedule.quicklook.swapSending", undefined, "Sending…")
                : t("m.schedule.quicklook.swapSend", undefined, "Request Swap")}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          {swapShiftId && (
            <button
              type="button"
              className="ps-btn ps-btn--secondary ps-btn--lg"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => setSwapOpen(true)}
            >
              <KIcon name="ArrowLeftRight" size={15} /> {t("m.schedule.quicklook.swap", undefined, "Swap")}
            </button>
          )}
          <button
            type="button"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ flex: 1, justifyContent: "center" }}
            disabled={pending}
            onClick={remind}
          >
            <KIcon name="BellRing" size={15} /> {t("m.schedule.quicklook.remind", undefined, "Remind")}
          </button>
        </div>
      )}
      {!swapShiftId && (
        <p className="hint" style={{ marginTop: 8 }}>
          {t(
            "m.schedule.quicklook.noSwapHint",
            undefined,
            "Swap appears when one of your own shifts lands on this day.",
          )}
        </p>
      )}
    </Sheet>
  );
}

export function ScheduleView({
  events,
  labels,
  myShiftByDay = {},
}: {
  events: SchedEvent[];
  labels: Labels;
  /** dateKey → the viewer's own shift id that day — powers the Swap action
   *  in the event quick-look drawer. */
  myShiftByDay?: Record<string, string>;
}) {
  const fmt = useFormatters();
  const [openEvent, setOpenEvent] = useState<SchedEvent | null>(null);
  const [ctl, setCtl] = useState<ViewCtl>(() => emptyViewCtl("list"));
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [calDay, setCalDay] = useState<string | null>(null);
  const patch = (p: Partial<ViewCtl>) => setCtl((c) => ({ ...c, ...p }));
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

  const typeLabelOf = (e: SchedEvent) => typeMeta[e.type].label;

  const FIELDS = useMemo<FieldDef<SchedEvent>[]>(
    () => [
      { id: "name", label: labels.colEvent, type: "text", get: (e) => e.name },
      { id: "type", label: labels.colType, type: "select", options: Object.values(typeMeta).map((m) => m.label), get: (e) => typeMeta[e.type].label },
      { id: "time", label: labels.colTime, type: "text", get: (e) => e.time },
      { id: "sub", label: labels.colDetail, type: "text", get: (e) => e.sub },
      { id: "state", label: labels.colStatus, type: "select", get: (e) => e.state },
    ],
    [labels, typeMeta],
  );

  // Type pills pre-filter + search; drawer sort/filter/group via the schema.
  // Default order is by time (the original list default).
  const filtered = useMemo(() => {
    const q = ctl.q.trim().toLowerCase();
    let out = [...events].sort((a, b) => String(a.time).localeCompare(String(b.time)));
    if (q) out = out.filter((e) => (e.name + " " + e.sub).toLowerCase().includes(q));
    if (ctl.filters.size) out = out.filter((e) => ctl.filters.has(typeMeta[e.type].label));
    return applyModel(out, FIELDS, ctl.filterModel, ctl.sortRules);
  }, [events, ctl.q, ctl.filters, ctl.filterModel, ctl.sortRules, typeMeta, FIELDS]);

  const tree = useMemo(() => groupTree(filtered, FIELDS, ctl.groupLevels), [filtered, ctl.groupLevels, FIELDS]);

  const pills = dataPills(
    events,
    typeLabelOf,
    ctl.filters,
    (v) => {
      const n = new Set(ctl.filters);
      if (n.has(v)) n.delete(v);
      else n.add(v);
      patch({ filters: n });
    },
    Object.values(typeMeta).map((m) => m.label),
  );

  const eventRow = (e: SchedEvent) => {
    const m = typeMeta[e.type];
    return (
      <button
        type="button"
        className="item tap"
        key={e.id}
        style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
        onClick={() => setOpenEvent(e)}
      >
        {/* `state` is the display label (title-cased, locale-translated later);
            tone is the stable signal — "ok" is the live mapping. Comparing the
            label to the raw enum ("live") never matched. */}
        <span className="bar" style={{ background: m.c, opacity: e.tone === "ok" ? 1 : 0.55 }} />
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
      </button>
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
      filtered
        .filter((e) => e.dateKey === activeDay)
        .slice()
        .sort((a, b) => String(a.time).localeCompare(String(b.time))),
    [filtered, activeDay],
  );

  return (
    <>
      <ActionBar<SchedEvent>
        {...advBar(ctl, patch, FIELDS, ["list", "calendar", "table"])}
        k="sc"
        query={ctl.q}
        setQuery={(q) => patch({ q })}
        placeholder={labels.search}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        pills={pills}
        onPillsClear={() => patch({ filters: new Set() })}
      />

      {ctl.view !== "calendar" &&
        (filtered.length === 0 ? (
          <EmptySkeleton cols={[labels.colEvent, labels.colType, labels.colTime]} title={labels.empty} hint={labels.emptyBody} />
        ) : tree ? (
          <GroupedTree skey="sc" tree={tree} collapsed={collapsed} setCollapsed={setCollapsed} renderRow={(e) => eventRow(e as SchedEvent)} />
        ) : (
          <DataView view={ctl.view} items={filtered} fields={FIELDS} renderRow={(e) => eventRow(e)} onRow={setOpenEvent} />
        ))}

      {ctl.view === "calendar" && (
        <>
          <div className="weekstrip">
            {(days.length ? days : [activeDay]).map((d) => {
              const cnt = filtered.filter((e) => e.dateKey === d).length;
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
                    <button
                      type="button"
                      className="dc-ev"
                      onClick={() => setOpenEvent(e)}
                      style={{
                        borderLeftColor: m.c,
                        background: `color-mix(in oklab, ${m.c} 10%, var(--p-surface))`,
                        textAlign: "left",
                        cursor: "pointer",
                        font: "inherit",
                        width: "100%",
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
                    </button>
                  </div>
                );
              })
            ) : (
              <EmptyState title={labels.emptyDay} description={labels.emptyDayBody} />
            )}
          </div>
        </>
      )}

      {openEvent && (
        <EventQuickLook
          ev={openEvent}
          typeLabel={typeMeta[openEvent.type].label}
          swapShiftId={myShiftByDay[openEvent.dateKey] ?? null}
          onClose={() => setOpenEvent(null)}
        />
      )}
    </>
  );
}
