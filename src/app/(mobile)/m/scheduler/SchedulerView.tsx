"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  EmptySkeleton,
  Fab,
  FORMS,
  FormScreen,
  KIcon,
  Sheet,
  SwipeRow,
  UndoBar,
  useUndo,
  type FormDef,
} from "@/components/mobile/kit";
import { HubChrome } from "@/components/mobile/HubChrome";
import { useT, useFormatters } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";
import { fmtPosition } from "@/lib/mobile/fmt-position";
import { toFormData } from "@/lib/mobile/form-data";
import { assignShift, createShift, publishShifts, removeShifts, restoreShifts, type SeatSnapshot } from "./actions";

/**
 * Shift Scheduler client — kit 33 v3.0 (runtime/app.jsx:4380).
 *
 * Three views over the same real `shifts` seat window (a kit "shift" = one seat
 * GROUP sharing role × area × time; the seats underneath are real per-person
 * rows, so every mutation lands on the store the time clock and payroll read):
 *   • Schedule — day strip · Coverage/Open/Est.Labor/OT stat grid · shift-group
 *     rows (SwipeRow Assign · Publish · Remove-with-undo) with hours/rate/
 *     confirmation meta · Publish Day · New Shift.
 *   • Coverage — hourly coverage bars (have vs needed per hour).
 *   • On Now — live attendance board derived from real check-in state.
 * Plus a smart Assign Crew sheet (availability · OT guard · post-as-open-shift)
 * and an overflow (Auto-Fill Open · Copy Last Week · Apply Template). The full
 * scheduling engine stays in ATLVS; this is the field window.
 */

export type SchedDay = { key: string; label: string };
export type PoolMember = { id: string; name: string; role: string | null };
export type SchedSlot = {
  id: string;
  dayKey: string;
  role: string;
  area: string;
  start: string;
  end: string;
  startsAt: string;
  endsAt: string;
  venueId: string | null;
  zoneId: string | null;
  crewId: string | null;
  crewName: string | null;
  published: boolean;
  checkedIn: boolean;
  rateCents: number | null;
  notes: string | null;
};

type ShiftGroup = {
  key: string;
  role: string;
  area: string;
  start: string;
  end: string;
  rateCents: number | null;
  seats: SchedSlot[];
  crew: SchedSlot[];
  openSeats: SchedSlot[];
  draftIds: string[];
  published: boolean;
};

type SchedView = "shifts" | "coverage" | "live";

function groupSlots(slots: SchedSlot[]): ShiftGroup[] {
  const mp = new Map<string, SchedSlot[]>();
  for (const s of slots) {
    const key = [s.role, s.startsAt, s.endsAt, s.zoneId ?? "", s.venueId ?? ""].join("|");
    const arr = mp.get(key) ?? [];
    arr.push(s);
    mp.set(key, arr);
  }
  return [...mp.entries()].map(([key, seats]) => {
    const crew = seats.filter((s) => s.crewId);
    const openSeats = seats.filter((s) => !s.crewId);
    const draftIds = seats.filter((s) => !s.published).map((s) => s.id);
    const first = seats[0]!;
    return {
      key,
      role: first.role,
      area: first.area,
      start: first.start,
      end: first.end,
      rateCents: first.rateCents,
      seats,
      crew,
      openSeats,
      draftIds,
      published: draftIds.length === 0,
    };
  });
}

/** Parse an "HH:MM" display time to a fractional hour. */
function hourOf(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return (parseInt(h ?? "0", 10) || 0) + (parseInt(m ?? "0", 10) || 0) / 60;
}
/** Shift length in hours, wrapping past midnight. */
function groupHours(g: { start: string; end: string }): number {
  let dur = hourOf(g.end) - hourOf(g.start);
  if (dur <= 0) dur += 24;
  return dur;
}
export function SchedulerView({
  days,
  slots,
  pool,
  areaOptions,
}: {
  /** Kept for the server page's call shape; the hub chrome owns the title now. */
  eyebrow?: string;
  days: SchedDay[];
  slots: SchedSlot[];
  pool: PoolMember[];
  areaOptions: string[];
}) {
  const t = useT();
  const fmt = useFormatters();
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const { undo, withUndo, clearUndo } = useUndo();

  const [view, setView] = useState<SchedView>("shifts");
  const [day, setDay] = useState<string>(days[0]?.key ?? "");
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [assignKey, setAssignKey] = useState<string | null>(null);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formPending, startFormTransition] = useTransition();

  const live = useMemo(() => slots.filter((s) => !gone.has(s.id)), [slots, gone]);
  const dayGroups = useMemo(() => groupSlots(live.filter((s) => s.dayKey === day)), [live, day]);
  const openByDay = useMemo(() => {
    const mp = new Map<string, number>();
    for (const s of live) if (!s.crewId) mp.set(s.dayKey, (mp.get(s.dayKey) ?? 0) + 1);
    return mp;
  }, [live]);

  const filled = dayGroups.reduce((n, g) => n + g.crew.length, 0);
  const need = dayGroups.reduce((n, g) => n + g.seats.length, 0);
  const unpub = dayGroups.filter((g) => !g.published).length;
  const busyToday = useMemo(() => {
    const set = new Set<string>();
    for (const s of live) if (s.dayKey === day && s.crewId) set.add(s.crewId);
    return set;
  }, [live, day]);

  // Est. labor for the day = Σ (filled seat hours × rate).
  const dayCost = useMemo(
    () => dayGroups.reduce((sum, g) => sum + g.crew.length * groupHours(g) * ((g.rateCents ?? 0) / 100), 0),
    [dayGroups],
  );
  // Per-crew day-hours drive both the OT stat and the assign-sheet OT guard.
  const crewDayHours = useMemo(() => {
    const mp = new Map<string, number>();
    for (const g of dayGroups) {
      const h = groupHours(g);
      for (const seat of g.crew) if (seat.crewId) mp.set(seat.crewId, (mp.get(seat.crewId) ?? 0) + h);
    }
    return mp;
  }, [dayGroups]);
  const otCount = useMemo(() => [...crewDayHours.values()].filter((h) => h > 8).length, [crewDayHours]);

  // Coverage-by-hour across the day's span.
  const coverage = useMemo(() => {
    if (!dayGroups.length) return [] as { hh: number; need: number; have: number }[];
    const ranges = dayGroups.map((g) => {
      const s = Math.floor(hourOf(g.start));
      const eRaw = Math.ceil(hourOf(g.end));
      const e = eRaw <= s ? eRaw + 24 : eRaw;
      return { s, e, seats: g.seats.length, filled: g.crew.length };
    });
    const minH = Math.min(...ranges.map((r) => r.s));
    const maxH = Math.max(...ranges.map((r) => r.e));
    const rows: { hh: number; need: number; have: number }[] = [];
    for (let hh = minH; hh < maxH; hh++) {
      let nd = 0;
      let hv = 0;
      for (const r of ranges)
        if (hh >= r.s && hh < r.e) {
          nd += r.seats;
          hv += r.filled;
        }
      if (nd > 0) rows.push({ hh: hh % 24, need: nd, have: hv });
    }
    return rows;
  }, [dayGroups]);

  // On Now board — derived from real check-in state (no wall-clock: an assigned
  // seat is either checked-in "On Shift" or "Scheduled").
  const attendance = useMemo(
    () =>
      live
        .filter((s) => s.dayKey === day && s.crewId)
        .map((s) => ({
          id: s.id,
          name: s.crewName ?? "—",
          role: s.role,
          shift: `${s.start}–${s.end}`,
          state: s.checkedIn ? ("in" as const) : ("scheduled" as const),
        })),
    [live, day],
  );
  const onShiftN = attendance.filter((a) => a.state === "in").length;
  const scheduledN = attendance.filter((a) => a.state === "scheduled").length;

  const assignGroup = assignKey ? (dayGroups.find((g) => g.key === assignKey) ?? null) : null;

  const doAssign = (group: ShiftGroup, crewId: string, crewName: string) => {
    const seat = group.openSeats[0];
    if (!seat) return;
    setAssignKey(null);
    startTransition(async () => {
      const res = await assignShift(seat.id, crewId);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(t("m.scheduler.assigned", { name: crewName, role: group.role }, `Assigned · ${crewName} → ${group.role}`));
        router.refresh();
      }
    });
  };

  const doPublish = (ids: string[], dayPublish: boolean) => {
    startTransition(async () => {
      const res = await publishShifts(ids);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(
          dayPublish
            ? t("m.scheduler.dayPublished", undefined, "Day Published · All Crew Notified")
            : t("m.scheduler.published", undefined, "Published · Crew Notified"),
        );
        router.refresh();
      }
    });
  };

  const doRemove = (group: ShiftGroup) => {
    const ids = group.seats.map((s) => s.id);
    const snapshot: SeatSnapshot[] = group.seats.map((s) => ({
      role: s.role,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      venueId: s.venueId,
      zoneId: s.zoneId,
      crewMemberId: s.crewId,
      published: s.published,
      hourlyRateCents: s.rateCents,
      notes: s.notes,
    }));
    setGone((prev) => new Set([...prev, ...ids]));
    startTransition(async () => {
      const res = await removeShifts(ids);
      if (res?.error) {
        setGone((prev) => {
          const n = new Set(prev);
          for (const id of ids) n.delete(id);
          return n;
        });
        toast.error(res.error);
        return;
      }
      withUndo(t("m.scheduler.removed", { role: group.role }, `Removed · ${group.role}`), () => {
        setGone((prev) => {
          const n = new Set(prev);
          for (const id of ids) n.delete(id);
          return n;
        });
        void restoreShifts(snapshot).then((r) => {
          if (r?.error) toast.error(r.error);
          router.refresh();
        });
      });
      router.refresh();
    });
  };

  // Auto-Fill Open — pair each open seat on the day with a distinct free pool
  // member (1:1, so nobody is double-booked) and assign for real.
  const autoFill = () => {
    setOverflowOpen(false);
    const openSeats = dayGroups.flatMap((g) => g.openSeats);
    const free = pool.filter((p) => !busyToday.has(p.id));
    const pairs = openSeats.slice(0, free.length).map((seat, i) => ({ seatId: seat.id, crewId: free[i]!.id }));
    if (!pairs.length) {
      toast.error(t("m.scheduler.autoFillNone", undefined, "No open seats or nobody free to fill them."));
      return;
    }
    startTransition(async () => {
      for (const p of pairs) {
        const res = await assignShift(p.seatId, p.crewId);
        if (res?.error) {
          toast.error(res.error);
          router.refresh();
          return;
        }
      }
      toast.success(t("m.scheduler.autoFilled", { count: pairs.length }, `Auto-filled · ${pairs.length} seats assigned`));
      router.refresh();
    });
  };

  // Post As Open Shift — publish the group's open seats so crew can claim them
  // from the Job Board (an open published seat is a claimable shift).
  const postAsOpenShift = (group: ShiftGroup) => {
    const ids = group.openSeats.filter((s) => !s.published).map((s) => s.id);
    setAssignKey(null);
    if (!ids.length) {
      toast.error(t("m.scheduler.postNone", undefined, "No open seats to post."));
      return;
    }
    startTransition(async () => {
      const res = await publishShifts(ids);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(t("m.scheduler.posted", undefined, "Posted As Open Shift · Claimable In Jobs"));
        router.refresh();
      }
    });
  };

  // FORMS.shift with the org's real Area / Zone options and the selected
  // day prefilled (defs are static; the dynamic parts are injected here).
  const shiftDef: FormDef = useMemo(() => {
    const base = FORMS.shift!;
    return { ...base, fields: base.fields.map((f) => (f.id === "area" ? { ...f, options: areaOptions } : f)) };
  }, [areaOptions]);

  function onNewShift(_def: FormDef, vals: Record<string, unknown>) {
    if (formPending) return;
    const fd = toFormData(vals);
    startFormTransition(async () => {
      const res = await createShift(null, fd);
      if (res?.error) {
        setFormError(res.error);
        return;
      }
      setFormError(null);
      setFormOpen(false);
      const picked = typeof vals.date === "string" && days.some((d) => d.key === vals.date) ? (vals.date as string) : null;
      if (picked) setDay(picked);
      toast.success(t("m.scheduler.added", undefined, "Shift Added"));
      router.refresh();
    });
  }

  const dayLabel = days.find((d) => d.key === day)?.label ?? day;

  const VIEWS: [SchedView, string, string][] = [
    ["shifts", t("m.scheduler.view.schedule", undefined, "Schedule"), "CalendarDays"],
    ["coverage", t("m.scheduler.view.coverage", undefined, "Coverage"), "ChartNoAxesColumn"],
    ["live", t("m.scheduler.view.onNow", undefined, "On Now"), "Activity"],
  ];

  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="workforce" active="schedule" canManage />
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <button
          type="button"
          className="pill ico"
          aria-label={t("m.scheduler.overflow", undefined, "Scheduler actions")}
          onClick={() => setOverflowOpen(true)}
        >
          <KIcon name="EllipsisVertical" size={16} />
        </button>
      </div>

      <div className="seg2" style={{ margin: "12px 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
        {VIEWS.map(([v, label, ic]) => (
          <button
            key={v}
            type="button"
            className={view === v ? "on" : ""}
            onClick={() => setView(v)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <KIcon name={ic} size={14} /> {label}
          </button>
        ))}
      </div>

      {view !== "live" && (
        <div className="chips" style={{ paddingBottom: 10 }}>
          {days.map((d) => {
            const gap = openByDay.get(d.key) ?? 0;
            return (
              <button key={d.key} type="button" className={`chip ${day === d.key ? "on" : ""}`} onClick={() => setDay(d.key)}>
                {d.label}
                {gap > 0 && (
                  <span style={{ marginLeft: 5, fontWeight: 800, color: day === d.key ? "inherit" : "var(--p-warning)" }}>
                    ·{gap}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {view === "shifts" && (
        <>
          <div className="rec-grid" style={{ marginBottom: 12 }}>
            <div className="rec-cell">
              <div className="rec-k">{t("m.scheduler.stat.coverage", undefined, "Coverage")}</div>
              <div className="rec-v" style={{ color: filled >= need ? "var(--p-success)" : "var(--p-warning)" }}>
                {filled}/{need}
              </div>
            </div>
            <div className="rec-cell">
              <div className="rec-k">{t("m.scheduler.stat.openSlots", undefined, "Open Slots")}</div>
              <div className="rec-v" style={{ color: need - filled > 0 ? "var(--p-warning)" : "var(--p-text-1)" }}>
                {Math.max(need - filled, 0)}
              </div>
            </div>
            <div className="rec-cell">
              <div className="rec-k">{t("m.scheduler.stat.labor", undefined, "Est. Labor")}</div>
              <div className="rec-v">{fmt.money(Math.round(dayCost * 100))}</div>
            </div>
            <div className="rec-cell">
              <div className="rec-k">{t("m.scheduler.stat.ot", undefined, "OT Flags")}</div>
              <div className="rec-v" style={{ color: otCount > 0 ? "var(--p-danger)" : "var(--p-text-1)" }}>
                {otCount}
              </div>
            </div>
          </div>

          {dayGroups.map((g) => {
            const gap = g.openSeats.length;
            const confirmed = g.crew.filter((s) => s.checkedIn).length;
            return (
              <SwipeRow
                key={g.key}
                actions={[
                  ...(gap > 0
                    ? [
                        {
                          icon: "UserRoundPlus",
                          label: t("m.scheduler.assign", undefined, "Assign"),
                          tone: "ok" as const,
                          on: () => setAssignKey(g.key),
                        },
                      ]
                    : []),
                  ...(!g.published
                    ? [
                        {
                          icon: "Send",
                          label: t("m.scheduler.publish", undefined, "Publish"),
                          tone: "info" as const,
                          on: () => doPublish(g.draftIds, false),
                        },
                      ]
                    : []),
                  {
                    icon: "Trash2",
                    label: t("m.scheduler.remove", undefined, "Remove"),
                    tone: "danger" as const,
                    on: () => doRemove(g),
                  },
                ]}
              >
                <div className="item" style={{ margin: 0, display: "block" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                    <span className="bar" style={{ background: gap > 0 ? "var(--p-warning)" : "var(--p-success)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t">{fmtPosition(g.role)}</div>
                      <div className="s">
                        {g.area} ·{" "}
                        <span style={{ fontFamily: "var(--p-mono)" }}>
                          {g.start}–{g.end}
                        </span>
                      </div>
                    </div>
                    <span className={`ps-badge ${g.published ? "ps-badge--ok" : "ps-badge--neutral"}`}>
                      {g.published
                        ? t("m.scheduler.badge.published", undefined, "Published")
                        : t("m.scheduler.badge.draft", undefined, "Draft")}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      paddingLeft: 13,
                      marginBottom: 8,
                    }}
                  >
                    <span className="sched-meta">
                      <KIcon name="Clock" size={11} /> {groupHours(g).toFixed(groupHours(g) % 1 ? 1 : 0)}h
                    </span>
                    {g.rateCents != null && (
                      <span className="sched-meta">
                        <KIcon name="Banknote" size={11} /> ${(g.rateCents / 100).toFixed(0)}/hr
                      </span>
                    )}
                    {g.published && g.crew.length > 0 && (
                      <span
                        className="sched-meta"
                        style={{ color: confirmed >= g.crew.length ? "var(--p-success)" : "var(--p-text-3)" }}
                      >
                        <KIcon name="CheckCheck" size={11} /> {confirmed}/{g.crew.length}{" "}
                        {t("m.scheduler.confirmed", undefined, "confirmed")}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingLeft: 13 }}>
                    {g.crew.map((s) => (
                      <span className="vchip" key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        {g.published && (
                          <span
                            className="att-dot"
                            style={{
                              width: 6,
                              height: 6,
                              background: s.checkedIn ? "var(--p-success)" : "var(--p-warning)",
                            }}
                          />
                        )}
                        {s.crewName}
                      </span>
                    ))}
                    {gap > 0 && (
                      <button type="button" className="pill" onClick={() => setAssignKey(g.key)}>
                        <KIcon name="Plus" size={12} /> {t("m.scheduler.open", { count: gap }, `${gap} Open`)}
                      </button>
                    )}
                  </div>
                </div>
              </SwipeRow>
            );
          })}

          {dayGroups.length === 0 && (
            <EmptySkeleton
              cols={[
                t("m.scheduler.colShift", undefined, "Shift"),
                t("m.scheduler.colCrew", undefined, "Crew"),
                t("m.scheduler.colStatus", undefined, "Status"),
              ]}
              title={t("m.scheduler.emptyTitle", undefined, "No Shifts This Day")}
              hint={t("m.scheduler.emptyHint", undefined, "Build shifts here or apply a Schedule template.")}
              action={
                <button type="button" className="ps-btn ps-btn--cta ps-btn--sm" onClick={() => setFormOpen(true)}>
                  {t("m.scheduler.newShift", undefined, "New Shift")}
                </button>
              }
            />
          )}

          {dayGroups.length > 0 && (
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="ps-btn ps-btn--cta"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setFormOpen(true)}
              >
                <KIcon name="Plus" size={16} /> {t("m.scheduler.newShift", undefined, "New Shift")}
              </button>
              {unpub > 0 && (
                <button
                  type="button"
                  className="ps-btn ps-btn--secondary"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() =>
                    doPublish(
                      dayGroups.flatMap((g) => g.draftIds),
                      true,
                    )
                  }
                >
                  <KIcon name="Send" size={16} /> {t("m.scheduler.publishDay", undefined, "Publish Day")}
                </button>
              )}
            </div>
          )}

          <div className="hint" style={{ marginTop: 10 }}>
            {t("m.scheduler.jobBoardHint", undefined, "Open shifts can also be pushed to the Job Board from the")}{" "}
            <Link href="/m/roster" style={{ color: "var(--p-accent-text)", fontWeight: 600 }}>
              {t("m.scheduler.jobBoardHintLink", undefined, "Project Roster")}
            </Link>
          </div>
        </>
      )}

      {view === "coverage" && (
        <>
          <div className="rec-grid" style={{ marginBottom: 12 }}>
            <div className="rec-cell">
              <div className="rec-k">{t("m.scheduler.stat.scheduled", undefined, "Scheduled")}</div>
              <div className="rec-v">{filled}</div>
            </div>
            <div className="rec-cell">
              <div className="rec-k">{t("m.scheduler.stat.required", undefined, "Required")}</div>
              <div className="rec-v">{need}</div>
            </div>
            <div className="rec-cell">
              <div className="rec-k">{t("m.scheduler.stat.gaps", undefined, "Gaps")}</div>
              <div className="rec-v" style={{ color: need - filled > 0 ? "var(--p-warning)" : "var(--p-success)" }}>
                {Math.max(need - filled, 0)}
              </div>
            </div>
          </div>
          {coverage.length > 0 ? (
            <>
              <div className="sech" style={{ marginTop: 4 }}>
                <h2>{t("m.scheduler.coverageByHour", undefined, "Coverage By Hour")}</h2>
              </div>
              {coverage.map(({ hh, need: nd, have: hv }) => {
                const ok = hv >= nd;
                return (
                  <div className="cov-row" key={hh}>
                    <span className="cov-h">{String(hh).padStart(2, "0")}:00</span>
                    <span className="cov-track">
                      <span
                        className="cov-fill"
                        style={{ width: `${Math.min(hv / nd, 1) * 100}%`, background: ok ? "var(--p-success)" : "var(--p-warning)" }}
                      />
                    </span>
                    <span className="cov-n" style={{ color: ok ? "var(--p-text-2)" : "var(--p-warning)" }}>
                      {hv}/{nd}
                    </span>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="nav-empty">{t("m.scheduler.coverageEmpty", { day: dayLabel }, `No shifts scheduled for ${dayLabel}.`)}</div>
          )}
        </>
      )}

      {view === "live" && (
        <>
          <div className="rec-grid" style={{ marginBottom: 12 }}>
            <div className="rec-cell">
              <div className="rec-k">{t("m.scheduler.stat.onShift", undefined, "On Shift")}</div>
              <div className="rec-v" style={{ color: "var(--p-success)" }}>
                {onShiftN}
              </div>
            </div>
            <div className="rec-cell">
              <div className="rec-k">{t("m.scheduler.stat.scheduledLive", undefined, "Scheduled")}</div>
              <div className="rec-v" style={{ color: "var(--p-warning)" }}>
                {scheduledN}
              </div>
            </div>
            <div className="rec-cell">
              <div className="rec-k">{t("m.scheduler.stat.openLive", undefined, "Open")}</div>
              <div className="rec-v">{Math.max(need - filled, 0)}</div>
            </div>
          </div>
          {attendance.length > 0 ? (
            attendance.map((a) => {
              const c = a.state === "in" ? "success" : "text-3";
              const label = a.state === "in" ? t("m.scheduler.onShift", undefined, "On Shift") : t("m.scheduler.scheduled", undefined, "Scheduled");
              return (
                <div className="item" key={a.id} style={{ alignItems: "center" }}>
                  <span className="att-dot" style={{ background: `var(--p-${c})` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t">{a.name}</div>
                    <div className="s">
                      {fmtPosition(a.role)} · <span style={{ fontFamily: "var(--p-mono)" }}>{a.shift}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: `var(--p-${c})`, flex: "none" }}>{label}</div>
                </div>
              );
            })
          ) : (
            <div className="nav-empty">{t("m.scheduler.liveEmpty", undefined, "No crew assigned for this day yet.")}</div>
          )}
        </>
      )}

      {assignGroup && (
        <Sheet
          icon="UserRoundPlus"
          title={t("m.scheduler.assignTitle", undefined, "Assign Crew")}
          sub={`${fmtPosition(assignGroup.role)} · ${dayLabel} · ${t(
            "m.scheduler.openSeats",
            { count: assignGroup.openSeats.length },
            `${assignGroup.openSeats.length} Open`,
          )}`}
          closeLabel={t("m.scheduler.assignClose", undefined, "Close")}
          onClose={() => setAssignKey(null)}
        >
          <button
            type="button"
            className="viewall"
            style={{ marginBottom: 12 }}
            onClick={() => postAsOpenShift(assignGroup)}
          >
            <KIcon name="Megaphone" size={15} /> {t("m.scheduler.postOpen", undefined, "Post As Open Shift")}
          </button>
          <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
            {pool
              .filter((p) => !assignGroup.seats.some((s) => s.crewId === p.id))
              .sort((a, b) => Number(busyToday.has(a.id)) - Number(busyToday.has(b.id)) || a.name.localeCompare(b.name))
              .map((p) => {
                const onShift = busyToday.has(p.id);
                const ot = (crewDayHours.get(p.id) ?? 0) + groupHours(assignGroup) > 8;
                return (
                  <div className="item" key={p.id} style={{ alignItems: "center", opacity: onShift ? 0.72 : 1 }}>
                    <span className="avatar-sm">
                      {p.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t" style={{ fontSize: 13.5 }}>{p.name}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        <span
                          className="sched-tag"
                          style={{
                            color: `var(--p-${onShift ? "warning" : "success"})`,
                            background: `color-mix(in oklab, var(--p-${onShift ? "warning" : "success"}) 14%, transparent)`,
                          }}
                        >
                          {onShift ? t("m.scheduler.onShift", undefined, "On Shift") : t("m.scheduler.available", undefined, "Available")}
                        </span>
                        {p.role && <span className="sched-meta">{fmtPosition(p.role)}</span>}
                        {ot && (
                          <span className="job-flag">
                            <KIcon name="TriangleAlert" size={11} /> {t("m.scheduler.otRisk", undefined, "OT risk")}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="pill"
                      style={{ flex: "none" }}
                      onClick={() => doAssign(assignGroup, p.id, p.name)}
                    >
                      <KIcon name="Plus" size={13} /> {t("m.scheduler.add", undefined, "Add")}
                    </button>
                  </div>
                );
              })}
            {pool.filter((p) => !assignGroup.seats.some((s) => s.crewId === p.id)).length === 0 && (
              <div className="s" style={{ padding: "12px 4px" }}>
                {t("m.scheduler.poolEmpty", undefined, "Nobody left to assign. Add crew from the Project Roster.")}
              </div>
            )}
          </div>
        </Sheet>
      )}

      {overflowOpen && (
        <Sheet
          icon="CalendarCog"
          title={t("m.scheduler.overflowTitle", undefined, "Scheduler Actions")}
          closeLabel={t("m.scheduler.assignClose", undefined, "Close")}
          onClose={() => setOverflowOpen(false)}
        >
          <button type="button" className="item tap" style={{ width: "100%", textAlign: "left" }} onClick={autoFill}>
            <span className="more-ic">
              <KIcon name="Sparkles" size={16} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{t("m.scheduler.autoFill", undefined, "Auto-Fill Open")}</div>
              <div className="s">{t("m.scheduler.autoFillSub", undefined, "Assign free crew to every open seat")}</div>
            </div>
          </button>
          <button
            type="button"
            className="item tap"
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => {
              setOverflowOpen(false);
              toast.info(t("m.scheduler.atlvsOnly", undefined, "Managed in ATLVS · open the console scheduler"));
            }}
          >
            <span className="more-ic">
              <KIcon name="Copy" size={16} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{t("m.scheduler.copyWeek", undefined, "Copy Last Week")}</div>
              <div className="s">{t("m.scheduler.copyWeekSub", undefined, "Clone the prior week's shifts as drafts")}</div>
            </div>
          </button>
          <button
            type="button"
            className="item tap"
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => {
              setOverflowOpen(false);
              toast.info(t("m.scheduler.atlvsOnly", undefined, "Managed in ATLVS · open the console scheduler"));
            }}
          >
            <span className="more-ic">
              <KIcon name="LayoutTemplate" size={16} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{t("m.scheduler.applyTemplate", undefined, "Apply Template")}</div>
              <div className="s">{t("m.scheduler.applyTemplateSub", undefined, "Load a saved shift pattern")}</div>
            </div>
          </button>
        </Sheet>
      )}

      <Fab label={t("m.scheduler.newShift", undefined, "New Shift")} onClick={() => setFormOpen(true)} />

      {formOpen && (
        <>
          {/* FormScreen is its own fixed overlay — the error must float above
              it or a failed submit reads as a dead button. */}
          {formError && (
            <div
              className="ps-alert ps-alert--danger"
              role="alert"
              style={{ position: "fixed", top: 12, left: 18, right: 18, zIndex: 46 }}
            >
              {formError}
            </div>
          )}
          <FormScreen def={shiftDef} initial={{ date: day }} onClose={() => setFormOpen(false)} onSubmit={onNewShift} />
        </>
      )}

      <UndoBar undo={undo} onUndo={clearUndo} undoLabel={t("m.scheduler.undo", undefined, "Undo")} />
    </div>
  );
}
