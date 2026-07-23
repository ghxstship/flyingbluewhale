"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { transitionProductionPhaseAction } from "../actions";
import type { ProductionPhase } from "@/lib/production-phase";
import { toTitle } from "@/lib/format";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";

import { useActionErrorResolver } from "@/lib/errors-client";
export function ProductionPhaseControls({
  orderId,
  currentPhase,
  allowedNext,
}: {
  orderId: string;
  currentPhase: ProductionPhase;
  allowedNext: readonly ProductionPhase[];
}) {
  const t = useT();
  const resolveErr = useActionErrorResolver();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  if (allowedNext.length === 0) {
    return (
      <p className="text-xs text-[var(--p-text-2)]">
        {t("console.production.fabrication.phaseControls.terminal", undefined, "Terminal phase.")}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allowedNext.map((target) => (
        <form
          key={target}
          action={() => {
            startTransition(async () => {
              const r = await transitionProductionPhaseAction(orderId, target);
              if ("error" in r && r.error) {
                console.error(r.error);
                toast.error(resolveErr(r.error));
              }
            });
          }}
          className="inline-flex"
        >
          <Button type="submit" disabled={pending} size="sm" variant="secondary">
            → {toTitle(target)}
          </Button>
        </form>
      ))}
      <span className="ms-2 self-center text-xs text-[var(--p-text-2)]">
        {t("console.production.fabrication.phaseControls.from", undefined, "From")}{" "}
        <strong>{toTitle(currentPhase)}</strong>
      </span>
    </div>
  );
}
