"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useT } from "@/lib/i18n/LocaleProvider";
import { rescheduleActivity } from "./actions";

/**
 * A draggable event block on the unified-schedule grid. Only `events`-sourced
 * activities (the writable schedule store) are draggable; drag horizontally to
 * shift the activity in time (15-min snap), release to commit via the
 * `rescheduleActivity` server action — guardrails run server-side. A zero-drag
 * release is treated as a click and navigates to the record. A warn-level
 * guardrail raises a DS ConfirmDialog (override); an error raises an
 * acknowledge dialog and reverts. Non-event blocks render as plain links.
 */
export function ScheduleBlock({
  eventId,
  startIso,
  endIso,
  leftPx,
  widthPx,
  colWidth,
  label,
  kindLabel,
  toneClass,
  href,
  conflicted,
}: {
  eventId: string;
  startIso: string;
  endIso: string;
  leftPx: number;
  widthPx: number;
  colWidth: number;
  label: string;
  kindLabel: string | null;
  toneClass: string;
  href: string;
  conflicted: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [dx, setDx] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [warnPrompt, setWarnPrompt] = React.useState<{ start: string; end: string; msg: string } | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const drag = React.useRef<{ startX: number; moved: boolean } | null>(null);

  const snapHours = (px: number) => Math.round((px / colWidth) * 4) / 4; // 15-min snap

  const submit = React.useCallback(
    async (start: string, end: string, override: boolean) => {
      const fd = new FormData();
      fd.set("id", eventId);
      fd.set("starts_at", start);
      fd.set("ends_at", end);
      if (override) fd.set("override", "1");
      return rescheduleActivity(null, fd);
    },
    [eventId],
  );

  function onPointerDown(e: React.PointerEvent) {
    if (pending) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { startX: e.clientX, moved: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const delta = e.clientX - drag.current.startX;
    if (Math.abs(delta) > 3) drag.current.moved = true;
    setDx(delta);
  }
  async function onPointerUp() {
    const state = drag.current;
    drag.current = null;
    const delta = dx;
    setDx(0);
    if (!state) return;
    if (!state.moved) {
      router.push(href); // treated as a click
      return;
    }
    const deltaHours = snapHours(delta);
    if (deltaHours === 0) return;
    const shiftMs = deltaHours * 3_600_000;
    const newStart = new Date(new Date(startIso).getTime() + shiftMs).toISOString();
    const newEnd = new Date(new Date(endIso).getTime() + shiftMs).toISOString();

    setPending(true);
    try {
      const res = await submit(newStart, newEnd, false);
      if (res && "warning" in res && res.warning) {
        setWarnPrompt({ start: newStart, end: newEnd, msg: res.warning });
        return;
      }
      if (res && "error" in res && res.error) {
        setErrorMsg(res.error);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={(e) => {
          if (e.key === "Enter") router.push(href);
        }}
        className={`absolute top-1.5 bottom-1.5 cursor-grab touch-none overflow-hidden rounded border px-2 py-1 text-[11px] select-none active:cursor-grabbing ${
          conflicted ? "border-[var(--p-danger)]" : "border-[var(--p-border)]"
        } bg-[var(--p-surface)] ${pending ? "opacity-60" : ""}`}
        style={{ left: leftPx + dx, width: widthPx }}
        title={
          conflicted
            ? `${label} — ${t("console.schedule.conflictDrag", undefined, "guardrail conflict · drag to reschedule")}`
            : `${label} · ${t("console.schedule.dragHint", undefined, "drag to reschedule")}`
        }
      >
        <span className={`me-1 inline-block h-1.5 w-1.5 rounded-sm ${toneClass}`} />
        <span className="font-medium">{label}</span>
        {kindLabel && <span className="ms-1 text-[var(--p-text-3)]">{kindLabel}</span>}
      </div>

      {/* Warn-level guardrail → explicit override. */}
      <ConfirmDialog
        open={warnPrompt !== null}
        onOpenChange={(o) => {
          if (!o) {
            setWarnPrompt(null);
            setPending(false);
          }
        }}
        title={t("console.schedule.warnHead", undefined, "Guardrail warning")}
        description={warnPrompt?.msg}
        confirmLabel={t("console.schedule.override", undefined, "Reschedule anyway")}
        onConfirm={async () => {
          if (!warnPrompt) return;
          const res = await submit(warnPrompt.start, warnPrompt.end, true);
          setWarnPrompt(null);
          setPending(false);
          if (res && "error" in res && res.error) {
            setErrorMsg(res.error);
            return;
          }
          router.refresh();
        }}
      />

      {/* Error-level guardrail (or write failure) → acknowledge + revert. */}
      <ConfirmDialog
        open={errorMsg !== null}
        onOpenChange={(o) => {
          if (!o) setErrorMsg(null);
        }}
        tone="danger"
        title={t("console.schedule.cantReschedule", undefined, "Cannot reschedule")}
        description={errorMsg ?? undefined}
        confirmLabel={t("common.ok", undefined, "OK")}
        cancelLabel={t("common.dismiss", undefined, "Dismiss")}
        onConfirm={() => setErrorMsg(null)}
      />
    </>
  );
}
