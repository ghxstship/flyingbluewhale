"use client";

import { useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { setProposalStatusAction } from "../actions";
import type { ProposalStatus } from "@/lib/supabase/types";

export function ProposalStatusControls({ id, status }: { id: string; status: ProposalStatus }) {
  const t = useT();
  const NEXT: Record<ProposalStatus, { next: ProposalStatus; label: string } | null> = {
    draft: { next: "sent", label: t("console.proposals.status.sendToClient", undefined, "Send to Client") },
    sent: { next: "approved", label: t("console.proposals.status.markApproved", undefined, "Mark Approved") },
    approved: { next: "signed", label: t("console.proposals.status.markSigned", undefined, "Mark Signed") },
    expired: { next: "draft", label: t("console.proposals.status.redraft", undefined, "Re-draft") },
    rejected: { next: "draft", label: t("console.proposals.status.redraft", undefined, "Re-draft") },
    signed: null,
  };
  const [pending, start] = useTransition();
  const transition = NEXT[status];
  if (!transition) return null;
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await setProposalStatusAction(id, transition.next);
          if (res?.error) toast.error(res.error);
          else
            toast.success(
              t("console.proposals.status.updatedToast", { status: transition.next }, `Proposal ${transition.next}`),
            );
        })
      }
    >
      {pending ? t("console.proposals.status.updating", undefined, "Updating…") : transition.label}
    </Button>
  );
}
