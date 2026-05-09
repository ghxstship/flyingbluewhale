"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { transitionProductionPhaseAction } from "../actions";
import type { ProductionPhase } from "@/lib/production-phase";

export function ProductionPhaseControls({
  orderId,
  currentPhase,
  allowedNext,
}: {
  orderId: string;
  currentPhase: ProductionPhase;
  allowedNext: readonly ProductionPhase[];
}) {
  const [pending, startTransition] = useTransition();

  if (allowedNext.length === 0) {
    return <p className="text-xs text-[var(--text-secondary)]">Terminal phase.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allowedNext.map((target) => (
        <form
          key={target}
          action={() => {
            startTransition(async () => {
              const r = await transitionProductionPhaseAction(orderId, target);
              if ("error" in r) {
                console.error(r.error);
                alert(r.error);
              }
            });
          }}
          className="inline-flex"
        >
          <Button type="submit" disabled={pending} size="sm" variant="secondary">
            → {target}
          </Button>
        </form>
      ))}
      <span className="ml-2 self-center text-xs text-[var(--text-secondary)]">
        From <strong>{currentPhase}</strong>
      </span>
    </div>
  );
}
