"use client";

import { useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { moveLeadStageAction } from "../actions";
import type { LeadStage } from "@/lib/supabase/types";

const ORDER: LeadStage[] = ["new", "qualified", "contacted", "proposal", "won", "lost"];

export function LeadStageMover({ leadId, stage }: { leadId: string; stage: LeadStage }) {
  const t = useT();
  const [pending, start] = useTransition();
  const idx = ORDER.indexOf(stage);
  const next = idx >= 0 && idx < ORDER.length - 2 ? ORDER[idx + 1] : null;
  if (!next) return null;
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await moveLeadStageAction(leadId, next);
          if (res?.error) toast.error(res.error);
          else
            // F-22 action-undo pattern — the success toast carries the
            // inverse commit (move back to the pre-advance stage).
            toast.success(t("console.leads.stageMover.movedToast", { stage: next }, `Moved to ${next}`), {
              action: {
                label: t("console.leads.stageMover.undo", undefined, "Undo"),
                onClick: () => {
                  void moveLeadStageAction(leadId, stage).then((r) => {
                    if (r?.error) toast.error(r.error);
                  });
                },
              },
            });
        })
      }
    >
      {pending
        ? t("console.leads.stageMover.updating", undefined, "Updating…")
        : t("console.leads.stageMover.moveTo", { stage: next }, `Move to ${next}`)}
    </Button>
  );
}
