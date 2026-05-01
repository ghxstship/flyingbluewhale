"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { recordManualRunAction, toggleAutomationAction, type State } from "./actions";

export function AutomationControls({
  automationId,
  enabled,
  isManual,
}: {
  automationId: string;
  enabled: boolean;
  isManual: boolean;
}) {
  const toggleAction = toggleAutomationAction.bind(null, automationId, !enabled);
  const runAction = recordManualRunAction.bind(null, automationId);

  const [toggleState, toggleSubmit, togglePending] = useActionState<State, FormData>(toggleAction, null);
  const [runState, runSubmit, runPending] = useActionState<State, FormData>(runAction, null);

  const error = toggleState?.error ?? runState?.error;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <form action={toggleSubmit}>
          <Button type="submit" disabled={togglePending} variant={enabled ? "secondary" : "primary"} size="sm">
            {togglePending ? "Saving…" : enabled ? "Disable" : "Enable"}
          </Button>
        </form>
        {isManual && (
          <form action={runSubmit}>
            <Button type="submit" disabled={runPending || !enabled} variant="primary" size="sm">
              {runPending ? "Running…" : "Run now"}
            </Button>
          </form>
        )}
      </div>
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
