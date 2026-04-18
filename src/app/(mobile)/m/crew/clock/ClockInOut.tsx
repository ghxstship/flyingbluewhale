"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

type State = "idle" | "clocked_in";

export function ClockInOut() {
  const [state, setState] = useState<State>("idle");
  const [startedAt, setStartedAt] = useState<string | null>(null);
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
      try {
        if (navigator.geolocation) {
          await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 }),
          );
        }
        const now = new Date().toISOString();
        setStartedAt(now);
        setState("clocked_in");
        setElapsed(0);
        toast.success("Clocked in");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not acquire location");
      }
    });

  const clockOut = () =>
    start(async () => {
      setState("idle");
      toast.success(`Clocked out · ${Math.floor(elapsed / 60)}m logged`);
      setStartedAt(null);
      setElapsed(0);
    });

  return (
    <div className="surface-raised p-6 text-center">
      {state === "clocked_in" ? (
        <>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-success)]">Clocked in</div>
          <div className="mt-3 font-mono text-4xl tabular-nums">
            {Math.floor(elapsed / 3600).toString().padStart(2, "0")}:
            {Math.floor((elapsed % 3600) / 60).toString().padStart(2, "0")}:
            {(elapsed % 60).toString().padStart(2, "0")}
          </div>
          <Button size="lg" variant="danger" className="mt-6 w-full" disabled={pending} onClick={clockOut}>
            Clock out
          </Button>
        </>
      ) : (
        <>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Ready to start</div>
          <div className="mt-3 font-mono text-4xl tabular-nums text-[var(--text-muted)]">00:00:00</div>
          <Button size="lg" className="mt-6 w-full" disabled={pending} onClick={clockIn}>
            Clock in
          </Button>
        </>
      )}
    </div>
  );
}
