"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { transitionAccountingPeriodAction } from "../actions";
import type { AccountingPeriodState } from "@/lib/accounting-periods";

export function AccountingPeriodStateControls({
  periodId,
  currentState,
  allowedNext,
}: {
  periodId: string;
  currentState: AccountingPeriodState;
  allowedNext: readonly AccountingPeriodState[];
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  if (allowedNext.length === 0) {
    return (
      <p className="text-sm text-[var(--p-text-2)]">
        {t("console.finance.periods.controls.terminal", undefined, "Terminal state — no further transitions.")}
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
              const r = await transitionAccountingPeriodAction(periodId, target);
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
            variant={target === "CLOSED" || target === "AUDITED" ? "secondary" : "primary"}
          >
            → {target}
          </Button>
        </form>
      ))}
      <span className="ms-2 self-center text-xs text-[var(--p-text-2)]">
        {t("console.finance.periods.controls.from", undefined, "From")} <strong>{currentState}</strong>
      </span>
    </div>
  );
}
