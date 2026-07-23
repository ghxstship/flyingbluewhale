"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { resolveActionError } from "@/lib/errors";
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
  const t = useT();
  const toggleAction = toggleAutomationAction.bind(null, automationId, !enabled);
  const runAction = recordManualRunAction.bind(null, automationId);

  const [toggleState, toggleSubmit, togglePending] = useActionState<State, FormData>(toggleAction, null);
  const [runState, runSubmit, runPending] = useActionState<State, FormData>(runAction, null);

  const rawError = toggleState?.error ?? runState?.error;
  const error = rawError ? resolveActionError(rawError, t) : undefined;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <form action={toggleSubmit}>
          <Button type="submit" disabled={togglePending} variant={enabled ? "secondary" : "primary"} size="sm">
            {togglePending
              ? t("common.saving", undefined, "Saving…")
              : enabled
                ? t("console.ai.automations.controls.disable", undefined, "Disable")
                : t("console.ai.automations.controls.enable", undefined, "Enable")}
          </Button>
        </form>
        {isManual && (
          <form action={runSubmit}>
            <Button type="submit" disabled={runPending || !enabled} variant="primary" size="sm">
              {runPending
                ? t("console.ai.automations.controls.running", undefined, "Running…")
                : t("console.ai.automations.controls.runNow", undefined, "Run now")}
            </Button>
          </form>
        )}
      </div>
      {error && <p className="text-xs text-[var(--p-danger)]">{error}</p>}
    </div>
  );
}
