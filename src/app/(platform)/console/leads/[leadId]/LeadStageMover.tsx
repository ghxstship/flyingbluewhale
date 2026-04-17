"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { moveLeadStageAction } from "../actions";
import type { LeadStage } from "@/lib/supabase/types";

const ORDER: LeadStage[] = ["new", "qualified", "contacted", "proposal", "won", "lost"];

export function LeadStageMover({ leadId, stage }: { leadId: string; stage: LeadStage }) {
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
          else toast.success(`Moved to ${next}`);
        })
      }
    >
      {pending ? "Updating…" : `Move to ${next}`}
    </Button>
  );
}
