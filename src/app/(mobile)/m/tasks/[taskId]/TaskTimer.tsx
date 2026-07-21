"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";
import { startTaskTimer, stopTaskTimer } from "./actions";

/** HH:MM:SS elapsed since an ISO instant. */
function elapsed(fromIso: string | null): string {
  if (!fromIso) return "00:00:00";
  const total = Math.max(0, Math.floor((Date.now() - new Date(fromIso).getTime()) / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/** Compact "Xh Ym" / "Ym" from a minute count. */
function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Per-task time tracker (kit prototype task-detail "Time tracked" widget).
 * `loggedMinutes` is the sum of this user's CLOSED task-timer entries; when a
 * timer is running, `openSince` drives a live counter. Start/Stop hit the
 * server actions, which log to time_entries with activity_category='task' —
 * isolated from the shift clock and from payroll compilation.
 */
export function TaskTimer({
  taskId,
  loggedMinutes,
  openSince,
  canTrack,
}: {
  taskId: string;
  loggedMinutes: number;
  openSince: string | null;
  canTrack: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [pending, startPending] = useTransition();
  const running = openSince != null;

  // Stable SSR placeholder — computing elapsed() in the initializer would
  // hydration-mismatch when the second ticks over (React #418). The effect
  // sets the real value on mount, client-side.
  const [now, setNow] = useState("00:00:00");
  useEffect(() => {
    if (!openSince) {
      setNow("00:00:00");
      return;
    }
    setNow(elapsed(openSince));
    const id = setInterval(() => setNow(elapsed(openSince)), 1000);
    return () => clearInterval(id);
  }, [openSince]);

  const toggle = () => {
    if (pending) return;
    startPending(async () => {
      const res = running ? await stopTaskTimer(taskId) : await startTaskTimer(taskId);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        running
          ? t("m.tasks.timer.logged", undefined, "Time logged")
          : t("m.tasks.timer.started", undefined, "Timer started"),
      );
      router.refresh();
    });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            fontFamily: "var(--p-mono-data)",
            fontSize: 22,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: running ? "var(--p-success)" : "var(--p-text-1)",
          }}
        >
          {running ? now : fmtMinutes(loggedMinutes)}
        </div>
        <span className="sp" />
        {canTrack ? (
          <button
            type="button"
            className={running ? "ps-btn ps-btn--danger ps-btn--sm" : "ps-btn ps-btn--cta ps-btn--sm"}
            disabled={pending}
            onClick={toggle}
          >
            <KIcon name={running ? "PauseCircle" : "Play"} size={13} />{" "}
            {running
              ? t("m.tasks.timer.stop", undefined, "Stop & Log")
              : t("m.tasks.timer.start", undefined, "Start")}
          </button>
        ) : null}
      </div>
      {loggedMinutes > 0 && (
        <div className="s" style={{ marginTop: 6, color: "var(--p-text-3)" }}>
          {t("m.tasks.timer.total", { total: fmtMinutes(loggedMinutes) }, `${fmtMinutes(loggedMinutes)} logged`)}
          {running ? ` · ${t("m.tasks.timer.running", undefined, "running now")}` : ""}
        </div>
      )}
    </div>
  );
}
