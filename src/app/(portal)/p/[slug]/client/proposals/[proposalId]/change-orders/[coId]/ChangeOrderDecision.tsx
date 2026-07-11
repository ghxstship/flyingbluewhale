"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { SelectableCard } from "@/components/ui/SelectableCard";
import { decideChangeOrderAction } from "../actions";
import type { FormState } from "@/components/FormShell";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";

export function ChangeOrderDecision({ slug, proposalId, coId }: { slug: string; proposalId: string; coId: string }) {
  const t = useT();
  const toast = useToast();
  const [state, formAction, pending] = useActionState<FormState, FormData>(decideChangeOrderAction, null);
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");

  // revalidatePath unmounts this block in the same round-trip once the CO
  // leaves its decidable state — the toast survives where the inline alert
  // below does not.
  useEffect(() => {
    if (state?.ok) {
      toast.success(t("p.client.changeOrders.decision.recorded", undefined, "Decision recorded."));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.ok]);

  return (
    <form action={formAction} className="surface space-y-3 p-6">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="coId" value={coId} />
      <input type="hidden" name="decision" value={decision} />
      <div className="eyebrow text-xs text-[var(--p-text-2)]">
        {t("p.client.changeOrders.decision.eyebrow", undefined, "Your decision")}
      </div>
      <h3 className="text-base font-semibold">
        {t("p.client.changeOrders.decision.title", undefined, "Approve or Reject This Change Order")}
      </h3>

      <div
        className="grid gap-2 md:grid-cols-2"
        role="radiogroup"
        aria-label={t("p.client.changeOrders.decision.radiogroupAria", undefined, "Change order decision")}
      >
        <SelectableCard
          tone="success"
          selected={decision === "approved"}
          onClick={() => setDecision("approved")}
          title={t("p.client.changeOrders.decision.approve.title", undefined, "Approve")}
          description={t(
            "p.client.changeOrders.decision.approve.description",
            undefined,
            "Add to the contract; new total reflects on the overview.",
          )}
        />
        <SelectableCard
          tone="error"
          selected={decision === "rejected"}
          onClick={() => setDecision("rejected")}
          title={t("p.client.changeOrders.decision.reject.title", undefined, "Reject")}
          description={t(
            "p.client.changeOrders.decision.reject.description",
            undefined,
            "Marks as declined; out of scope.",
          )}
        />
      </div>

      <textarea
        name="note"
        rows={3}
        placeholder={t("p.client.changeOrders.decision.notePlaceholder", undefined, "Optional note for the team…")}
        className="ps-input w-full"
      />

      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && (
        <Alert kind="success">{t("p.client.changeOrders.decision.recorded", undefined, "Decision recorded.")}</Alert>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={pending} variant={decision === "rejected" ? "danger" : "primary"}>
          {decision === "approved"
            ? t("p.client.changeOrders.decision.submit.approve", undefined, "Approve change")
            : t("p.client.changeOrders.decision.submit.reject", undefined, "Reject change")}
        </Button>
      </div>
    </form>
  );
}
