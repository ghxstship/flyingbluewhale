"use client";

import { useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useT } from "@/lib/i18n/LocaleProvider";
import { toggleGateAction, approvePhaseAction } from "./actions";

type GateRow = { id: string; label: string; is_done: boolean };

export function PhaseGateForm({
  phaseStateId,
  slug,
  proposalId,
  gateItems,
  canApprove,
}: {
  phaseStateId: string;
  slug: string;
  proposalId: string;
  gateItems: GateRow[];
  canApprove: boolean;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  function handleToggle(id: string, next: boolean) {
    const fd = new FormData();
    fd.set("gateItemId", id);
    fd.set("isDone", next ? "true" : "false");
    fd.set("slug", slug);
    fd.set("proposalId", proposalId);
    startTransition(async () => {
      const result = await toggleGateAction(null, fd);
      if (result?.error) toast.error(result.error);
    });
  }

  function handleApprove() {
    const fd = new FormData();
    fd.set("phaseStateId", phaseStateId);
    fd.set("slug", slug);
    fd.set("proposalId", proposalId);
    startTransition(async () => {
      const result = await approvePhaseAction(null, fd);
      if (result?.error) toast.error(result.error);
    });
  }

  const allDone = gateItems.every((g) => g.is_done);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {gateItems.map((g) => (
          <li
            key={g.id}
            className="flex items-start gap-3 rounded border border-[var(--p-border)] bg-[var(--p-surface)] p-3"
          >
            <Checkbox
              checked={g.is_done}
              disabled={pending}
              onCheckedChange={(c) => handleToggle(g.id, c === true)}
              aria-label={g.label}
              id={`gate-${g.id}`}
            />
            <label htmlFor={`gate-${g.id}`} className="flex-1 text-sm leading-snug">
              <span className={g.is_done ? "text-[var(--p-text-2)] line-through" : ""}>{g.label}</span>
            </label>
          </li>
        ))}
      </ul>
      {canApprove && (
        <div className="flex items-center justify-between border-t border-[var(--p-border)] pt-3">
          {!allDone && (
            <Alert kind="info">
              {t(
                "p.client.proposals.lifecycle.gate.allDoneHint",
                undefined,
                "Check every gate item to advance the phase.",
              )}
            </Alert>
          )}
          <div className="ms-auto">
            <Button onClick={handleApprove} disabled={!allDone || pending} loading={pending}>
              {t("p.client.proposals.lifecycle.gate.approveCta", undefined, "Approve phase & unlock next →")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
