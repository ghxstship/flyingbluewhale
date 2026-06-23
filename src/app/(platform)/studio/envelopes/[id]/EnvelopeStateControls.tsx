"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { setEnvelopeStateAction } from "../actions";

type EnvelopeState =
  | "drafted"
  | "sent"
  | "delivered"
  | "partially_signed"
  | "signed"
  | "completed"
  | "declined"
  | "voided"
  | "expired";

// Primary forward action per state (manual provider lifecycle). DocuSign &
// co. drive their own state via the provider webhook; these controls are the
// operator-driven path plus the universal void escape hatch.
const NEXT: Record<EnvelopeState, { next: EnvelopeState; labelKey: string; labelFallback: string } | null> = {
  drafted: { next: "sent", labelKey: "console.envelopes.stateControls.send", labelFallback: "Send" },
  sent: { next: "completed", labelKey: "console.envelopes.stateControls.complete", labelFallback: "Mark Completed" },
  delivered: {
    next: "completed",
    labelKey: "console.envelopes.stateControls.complete",
    labelFallback: "Mark Completed",
  },
  partially_signed: {
    next: "completed",
    labelKey: "console.envelopes.stateControls.complete",
    labelFallback: "Mark Completed",
  },
  signed: { next: "completed", labelKey: "console.envelopes.stateControls.complete", labelFallback: "Mark Completed" },
  completed: null,
  declined: null,
  voided: null,
  expired: null,
};

const TERMINAL: ReadonlySet<EnvelopeState> = new Set(["completed", "declined", "voided", "expired"]);

export function EnvelopeStateControls({ id, state }: { id: string; state: EnvelopeState }) {
  const t = useT();
  const [pending, start] = useTransition();
  const transition = NEXT[state];
  return (
    <div className="flex gap-2">
      {transition && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await setEnvelopeStateAction(id, transition.next);
              if (res?.error) toast.error(res.error);
              else toast.success(t("console.envelopes.stateControls.toast.ok", undefined, "Envelope updated"));
            })
          }
        >
          {pending ? "…" : t(transition.labelKey, undefined, transition.labelFallback)}
        </Button>
      )}
      {!TERMINAL.has(state) && (
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await setEnvelopeStateAction(id, "voided");
              if (res?.error) toast.error(res.error);
              else toast.success(t("console.envelopes.stateControls.toast.voided", undefined, "Envelope voided"));
            })
          }
        >
          {t("console.envelopes.stateControls.void", undefined, "Void")}
        </Button>
      )}
    </div>
  );
}
