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
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";
import { fmtPosition } from "@/lib/mobile/fmt-position";
import { toFormData } from "@/lib/mobile/form-data";
import { assignShift, createShift, publishShifts, removeShifts, restoreShifts, type SeatSnapshot } from "./actions";

/**
 * Kit 32 v2.9 · Shift Scheduler client (runtime/app.jsx:4266).
 *
 * Day strip (open-seat count per chip) → coverage stat grid → shift-group
 * rows (SwipeRow: Assign · Publish · Remove-with-undo) → Publish Day +
 * New Shift. A kit "shift" renders one row per seat GROUP (role × area ×
 * time); the seats underneath are real per-person `shifts` rows, so every
 * mutation here lands on the same store the time clock and payroll read.
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
  seats: SchedSlot[];
  crew: SchedSlot[];
  openSeats: SchedSlot[];
  draftIds: string[];
  published: boolean;
};

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
      seats,
      crew,
      openSeats,
      draftIds,
      published: draftIds.length === 0,
    };
  });
}

export function SchedulerView({
  eyebrow,
  days,
  slots,
  pool,
  areaOptions,
}: {
  eyebrow: string;
  days: SchedDay[];
  slots: SchedSlot[];
  pool: PoolMember[];
  areaOptions: string[];
}) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const { undo, withUndo, clearUndo } = useUndo();

  const [day, setDay] = useState<string>(days[0]?.key ?? "");
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [assignKey, setAssignKey] = useState<string | null>(null);
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
  const poolFree = pool.filter((p) => !busyToday.has(p.id)).length;

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

  return (
    <div className="screen screen-anim">
      <Link href="/m/more" className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {t("m.scheduler.back", undefined, "More")}
      </Link>
      <div className="scr-eye">{eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.scheduler.title", undefined, "Shift Scheduler")}
      </h1>

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

      <div className="rec-grid" style={{ marginBottom: 12 }}>
        <div className="rec-cell">
          <div className="rec-k">{t("m.scheduler.stat.shifts", undefined, "Shifts")}</div>
          <div className="rec-v">{dayGroups.length}</div>
        </div>
        <div className="rec-cell">
          <div className="rec-k">{t("m.scheduler.stat.coverage", undefined, "Coverage")}</div>
          <div className="rec-v" style={{ color: filled >= need ? "var(--p-success)" : "var(--p-warning)" }}>
            {filled}/{need}
          </div>
        </div>
        <div className="rec-cell">
          <div className="rec-k">{t("m.scheduler.stat.unpublished", undefined, "Unpublished")}</div>
          <div className="rec-v">{unpub}</div>
        </div>
        <div className="rec-cell">
          <div className="rec-k">{t("m.scheduler.stat.poolFree", undefined, "Pool Free")}</div>
          <div className="rec-v">{poolFree}</div>
        </div>
      </div>

      {dayGroups.map((g) => {
        const gap = g.openSeats.length;
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
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingLeft: 13 }}>
                {g.crew.map((s) => (
                  <span className="vchip" key={s.id}>
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
          <div style={{ maxHeight: "55vh", overflowY: "auto" }}>
            {pool
              .filter((p) => !assignGroup.seats.some((s) => s.crewId === p.id))
              .sort((a, b) => Number(busyToday.has(a.id)) - Number(busyToday.has(b.id)) || a.name.localeCompare(b.name))
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="item tap"
                  style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
                  onClick={() => doAssign(assignGroup, p.id, p.name)}
                >
                  <span className="more-ic">
                    <KIcon name="User" size={16} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t">{p.name}</div>
                    {p.role && <div className="s">{fmtPosition(p.role)}</div>}
                  </div>
                  {busyToday.has(p.id) && (
                    <span className="ps-badge ps-badge--warn">{t("m.scheduler.onShift", undefined, "On Shift")}</span>
                  )}
                </button>
              ))}
            {pool.filter((p) => !assignGroup.seats.some((s) => s.crewId === p.id)).length === 0 && (
              <div className="s" style={{ padding: "12px 4px" }}>
                {t("m.scheduler.poolEmpty", undefined, "Nobody left to assign. Add crew from the Project Roster.")}
              </div>
            )}
          </div>
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
