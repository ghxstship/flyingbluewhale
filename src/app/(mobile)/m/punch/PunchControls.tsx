"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";
import { clockIn, clockOut } from "../clock/actions";

/** Format elapsed milliseconds as H:MM:SS. */
function fmtElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * COMPVSS · Punch controls — a running shift timer with punch in / punch out,
 * backed by `time_entries` via the shared `clockIn` / `clockOut` server actions
 * (one open entry per user, server-enforced). The timer ticks client-side from
 * the open entry's `started_at`.
 */
export function PunchControls({ openStartedAt }: { openStartedAt: string | null }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState<number>(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  const punchedIn = !!openStartedAt;

  useEffect(() => {
    if (!punchedIn) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [punchedIn]);

  const elapsed = punchedIn ? fmtElapsed(now - new Date(openStartedAt!).getTime()) : "00:00:00";

  const punch = (fn: typeof clockIn | typeof clockOut) => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      <div className="te-clock">
        <div className="tcv">{elapsed}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {punchedIn ? (
            <button type="button" className="ps-btn ps-btn--danger ps-btn--lg" disabled={pending} onClick={() => punch(clockOut)}>
              {t("m.punch.out", undefined, "Punch Out")}
            </button>
          ) : (
            <button
              type="button"
              className="ps-btn ps-btn--cta ps-btn--lg"
              disabled={pending}
              style={{ background: "var(--p-success)", borderColor: "var(--p-success)", color: "var(--p-on-strong)" }}
              onClick={() => punch(clockIn)}
            >
              {t("m.punch.in", undefined, "Punch In")}
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginTop: 10 }}>
          {error}
        </div>
      )}
    </>
  );
}
