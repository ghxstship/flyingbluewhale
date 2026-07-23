"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";
import { transitionSubscriptionAction } from "../actions";
import type { SubscriptionState } from "@/lib/subscriptions";

import { useActionErrorResolver } from "@/lib/errors-client";
export function SubscriptionStateControls({
  subscriptionId,
  currentState,
  allowedNext,
}: {
  subscriptionId: string;
  currentState: SubscriptionState;
  allowedNext: readonly SubscriptionState[];
}) {
  const t = useT();
  const resolveErr = useActionErrorResolver();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  if (allowedNext.length === 0) {
    return (
      <p className="text-sm text-[var(--p-text-2)]">
        {t("console.subscriptions.stateControls.terminal", undefined, "Terminal state. No further transitions.")}
      </p>
    );
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
              if ("error" in r && r.error) {
                console.error(r.error);
                toast.error(resolveErr(r.error));
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
      <span className="ms-2 self-center text-xs text-[var(--p-text-2)]">
        {t("console.subscriptions.stateControls.from", undefined, "From")} <strong>{currentState}</strong>
      </span>
    </div>
  );
}
