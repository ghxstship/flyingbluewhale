"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { clockInAction, clockOutAction, type OpenShift } from "./actions";

type State = "idle" | "clocked_in";

/**
 * Clock-in / clock-out for the field shell. Persists to time_entries
 * via clockInAction / clockOutAction; restores state from the user's
 * most recent open shift on mount so a page refresh doesn't lose it.
 *
 * Geolocation is opportunistic — if the browser provides coords we
 * stamp them into the time_entries.description (and pass them as
 * structured fields). If the device denies or times out, the clock-in
 * still proceeds; we'd rather have the time entry than block the shift.
 */
export function ClockInOut({ initial }: { initial: OpenShift }) {
  const t = useT();
  const [state, setState] = useState<State>(initial ? "clocked_in" : "idle");
  const [startedAt, setStartedAt] = useState<string | null>(initial?.startedAt ?? null);
  const [elapsed, setElapsed] = useState(0);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (state !== "clocked_in" || !startedAt) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [state, startedAt]);

  const clockIn = () =>
    start(async () => {
      let coords: { lat: number; lng: number; accuracy?: number } | null = null;
      try {
        if (navigator.geolocation) {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 }),
          );
          coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
        }
      } catch {
        // Geolocation denied / timed out — proceed without coords.
      }
      const result = await clockInAction(coords ?? {});
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setStartedAt(result.startedAt);
      setState("clocked_in");
      setElapsed(Math.floor((Date.now() - new Date(result.startedAt).getTime()) / 1000));
      toast.success(t("m.clock.toast.clockedIn", undefined, "Clocked in"));
    });

  const clockOut = () =>
    start(async () => {
      const result = await clockOutAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setState("idle");
      setStartedAt(null);
      setElapsed(0);
      toast.success(
        t(
          "m.clock.toast.clockedOut",
          { minutes: result.durationMinutes },
          `Clocked out · ${result.durationMinutes}m logged`,
        ),
      );
    });

  return (
    <div className="surface p-6 text-center">
      {state === "clocked_in" ? (
        <>
          <div className="text-xs font-semibold tracking-wider text-[var(--color-success)] uppercase">
            {t("m.clock.status.clockedIn", undefined, "Clocked In")}
          </div>
          <div className="mt-3 font-mono text-4xl tabular-nums">
            {Math.floor(elapsed / 3600)
              .toString()
              .padStart(2, "0")}
            :
            {Math.floor((elapsed % 3600) / 60)
              .toString()
              .padStart(2, "0")}
            :{(elapsed % 60).toString().padStart(2, "0")}
          </div>
          <Button size="lg" variant="danger" className="mt-6 w-full" disabled={pending} onClick={clockOut}>
            {t("m.clock.action.clockOut", undefined, "Clock out")}
          </Button>
        </>
      ) : (
        <>
          <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            {t("m.clock.status.readyToStart", undefined, "Ready to Start")}
          </div>
          <div className="mt-3 font-mono text-4xl text-[var(--text-muted)] tabular-nums">00:00:00</div>
          <Button size="lg" className="mt-6 w-full" disabled={pending} onClick={clockIn}>
            {t("m.clock.action.clockIn", undefined, "Clock in")}
          </Button>
        </>
      )}
    </div>
  );
}
