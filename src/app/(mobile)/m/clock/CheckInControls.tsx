"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { clockIn, clockOut } from "./actions";

/** Format an elapsed millisecond span as HH:MM:SS. */
function elapsed(fromIso: string | null): string {
  if (!fromIso) return "00:00:00";
  const ms = Math.max(0, Date.now() - new Date(fromIso).getTime());
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**
 * The running time-clock face. Mirrors the kit `.te-clock` block: a live
 * HH:MM:SS counter ticking from the open entry's `started_at`, a zone
 * line, and a single clock-in / clock-out CTA wired to the surviving
 * `clockIn` / `clockOut` server actions.
 */
export function CheckInControls({
  openSince,
  zoneName,
}: {
  openSince: string | null;
  zoneName: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => elapsed(openSince));

  const clockedIn = openSince != null;

  // Tick the visible counter every second while on the clock.
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
    setError(null);
    start(async () => {
      const res = clockedIn ? await clockOut() : await clockIn();
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="te-clock">
      <div className="wl" style={{ justifyContent: "center" }}>
        <KIcon name="MapPin" size={12} style={{ color: "var(--p-success)" }} />{" "}
        {zoneName ?? t("m.clock.noZone", undefined, "No Zone Set")}
      </div>
      <div className="tcv">{now}</div>
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button
          type="button"
          className={clockedIn ? "ps-btn ps-btn--danger ps-btn--lg" : "ps-btn ps-btn--cta ps-btn--lg"}
          disabled={pending}
          onClick={toggle}
        >
          {pending
            ? t("m.clock.working", undefined, "Working…")
            : clockedIn
              ? t("m.clock.clockOut", undefined, "Clock Out")
              : t("m.clock.clockIn", undefined, "Clock In")}
        </button>
      </div>
    </div>
  );
}
