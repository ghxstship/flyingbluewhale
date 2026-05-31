"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  appendBreadcrumbAction,
  clockInAction,
  clockOutAction,
  type BlockingTask,
  type OpenShift,
} from "./actions";

type State = "idle" | "clocked_in";

const BREADCRUMB_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function ClockInOut({ initial }: { initial: OpenShift }) {
  const [state, setState] = useState<State>(initial ? "clocked_in" : "idle");
  const [entryId, setEntryId] = useState<string | null>(initial?.entryId ?? null);
  const [startedAt, setStartedAt] = useState<string | null>(initial?.startedAt ?? null);
  const [elapsed, setElapsed] = useState(0);
  const [gpsActive, setGpsActive] = useState(false);
  const [blockers, setBlockers] = useState<BlockingTask[] | null>(null);
  const [pending, start] = useTransition();
  const breadcrumbTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed-time counter.
  useEffect(() => {
    if (state !== "clocked_in" || !startedAt) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [state, startedAt]);

  // GPS breadcrumb sampling — fires every 5 minutes while clocked in.
  useEffect(() => {
    if (state !== "clocked_in" || !entryId) {
      if (breadcrumbTimer.current) clearInterval(breadcrumbTimer.current);
      breadcrumbTimer.current = null;
      return;
    }

    const sample = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsActive(true);
          // Fire-and-forget — never block the UI on this.
          appendBreadcrumbAction({
            entryId: entryId!,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        () => setGpsActive(false),
        { timeout: 4000, maximumAge: 60_000 },
      );
    };

    sample(); // immediate first sample
    breadcrumbTimer.current = setInterval(sample, BREADCRUMB_INTERVAL_MS);
    return () => {
      if (breadcrumbTimer.current) clearInterval(breadcrumbTimer.current);
    };
  }, [state, entryId]);

  const clockIn = () =>
    start(async () => {
      setBlockers(null);
      let coords: { lat: number; lng: number; accuracy?: number } | null = null;
      try {
        if (navigator.geolocation) {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 }),
          );
          coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        }
      } catch {
        // Proceed without coords.
      }
      const result = await clockInAction(coords ?? {});
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEntryId(result.entryId);
      setStartedAt(result.startedAt);
      setState("clocked_in");
      setElapsed(Math.floor((Date.now() - new Date(result.startedAt).getTime()) / 1000));
      toast.success("Clocked in");
    });

  const clockOut = () =>
    start(async () => {
      const result = await clockOutAction();
      if (!result.ok) {
        if ("blockers" in result) {
          setBlockers(result.blockers);
          toast.error(`Complete ${result.blockers.length} required task${result.blockers.length === 1 ? "" : "s"} first`);
        } else {
          toast.error(result.error);
        }
        return;
      }
      setBlockers(null);
      setState("idle");
      setEntryId(null);
      setStartedAt(null);
      setElapsed(0);
      setGpsActive(false);
      toast.success(`Clocked out · ${result.durationMinutes}m logged`);
    });

  return (
    <div className="space-y-3">
      <div className="surface p-6 text-center">
        {state === "clocked_in" ? (
          <>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-semibold tracking-wider text-[var(--color-success)] uppercase">
                Clocked In
              </span>
              {gpsActive && (
                <span
                  className="inline-flex h-2 w-2 rounded-full bg-[var(--color-success)] animate-pulse"
                  title="GPS breadcrumb tracking active"
                />
              )}
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
              Clock out
            </Button>
          </>
        ) : (
          <>
            <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              Ready to Start
            </div>
            <div className="mt-3 font-mono text-4xl text-[var(--text-muted)] tabular-nums">00:00:00</div>
            <Button size="lg" className="mt-6 w-full" disabled={pending} onClick={clockIn}>
              Clock in
            </Button>
          </>
        )}
      </div>

      {/* Required-task blockers shown when clock-out is attempted with pending tasks. */}
      {blockers && blockers.length > 0 && (
        <div className="surface border border-[var(--color-warning)] p-4">
          <p className="text-xs font-semibold text-[var(--color-warning)]">
            Complete these tasks before clocking out:
          </p>
          <ul className="mt-2 space-y-1">
            {blockers.map((t: BlockingTask) => (
              <li key={t.id}>
                <Link href={`/m/tasks/${t.id}`} className="text-sm underline">
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
