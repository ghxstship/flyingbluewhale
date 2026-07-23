"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { toggleAgentAction, type State } from "./actions";

import { useActionErrorResolver } from "@/lib/errors-client";
export function AgentControls({ agentId, enabled }: { agentId: string; enabled: boolean }) {
  const t = useT();
  const toggleAction = toggleAgentAction.bind(null, agentId, !enabled);
  const [toggleState, toggleSubmit, togglePending] = useActionState<State, FormData>(toggleAction, null);
  const resolveErr = useActionErrorResolver();

  return (
    <div className="flex flex-col gap-2">
      <form action={toggleSubmit}>
        <Button type="submit" disabled={togglePending} variant={enabled ? "secondary" : "primary"} size="sm">
          {togglePending
            ? t("common.saving", undefined, "Saving…")
            : enabled
              ? t("console.ai.agents.controls.disable", undefined, "Disable")
              : t("console.ai.agents.controls.enable", undefined, "Enable")}
        </Button>
      </form>
      {toggleState?.error && <p className="text-xs text-[var(--p-danger)]">{resolveErr(toggleState.error)}</p>}
    </div>
  );
}
