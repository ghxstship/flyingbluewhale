"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { transitionRun, type State } from "./actions";

export function RunActions({ runId, status }: { runId: string; status: string }) {
  const t = useT();
  const departAction = transitionRun.bind(null, runId, "depart");
  const arriveAction = transitionRun.bind(null, runId, "arrive");
  const cancelAction = transitionRun.bind(null, runId, "cancel");

  const [departState, departSubmit, departPending] = useActionState<State, FormData>(departAction, null);
  const [arriveState, arriveSubmit, arrivePending] = useActionState<State, FormData>(arriveAction, null);
  const [cancelState, cancelSubmit, cancelPending] = useActionState<State, FormData>(cancelAction, null);

  const error = departState?.error ?? arriveState?.error ?? cancelState?.error;

  const canDepart = status === "scheduled" || status === "delayed";
  const canArrive = status === "in_transit";
  const canCancel = !["arrived", "cancelled"].includes(status);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {canDepart && (
          <form action={departSubmit}>
            <Button type="submit" disabled={departPending} size="md" className="w-full">
              {departPending
                ? t("m.driver.run.departing", undefined, "Departing…")
                : t("m.driver.run.markDeparted", undefined, "Mark departed")}
            </Button>
          </form>
        )}
        {canArrive && (
          <form action={arriveSubmit}>
            <Button type="submit" disabled={arrivePending} size="md" variant="primary" className="w-full">
              {arrivePending
                ? t("m.driver.run.arriving", undefined, "Arriving…")
                : t("m.driver.run.markArrived", undefined, "Mark arrived")}
            </Button>
          </form>
        )}
        {canCancel && (
          <form action={cancelSubmit}>
            <Button type="submit" disabled={cancelPending} size="md" variant="secondary" className="w-full">
              {cancelPending
                ? t("m.driver.run.cancelling", undefined, "Cancelling…")
                : t("m.driver.run.cancelRun", undefined, "Cancel run")}
            </Button>
          </form>
        )}
      </div>
      {error && <p className="text-xs text-[var(--p-danger)]">{error}</p>}
    </div>
  );
}
