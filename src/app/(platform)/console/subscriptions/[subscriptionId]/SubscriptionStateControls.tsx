"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { transitionSubscriptionAction } from "../actions";
import type { SubscriptionState } from "@/lib/subscriptions";

export function SubscriptionStateControls({
  subscriptionId,
  currentState,
  allowedNext,
}: {
  subscriptionId: string;
  currentState: SubscriptionState;
  allowedNext: readonly SubscriptionState[];
}) {
  const [pending, startTransition] = useTransition();

  if (allowedNext.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">Terminal state — no further transitions.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allowedNext.map((target) => (
        <form
          key={target}
          action={(fd) => {
            const reason = (fd.get("reason") as string) || undefined;
            startTransition(async () => {
              const r = await transitionSubscriptionAction(subscriptionId, target, reason);
              if ("error" in r) {
                console.error(r.error);
                alert(r.error);
              }
            });
          }}
          className="inline-flex items-center gap-2"
        >
          <Button
            type="submit"
            disabled={pending}
            size="sm"
            variant={target === "CHURNED" || target === "ARCHIVED" ? "secondary" : "primary"}
          >
            → {target}
          </Button>
        </form>
      ))}
      <span className="ms-2 self-center text-xs text-[var(--text-secondary)]">
        From <strong>{currentState}</strong>
      </span>
    </div>
  );
}
