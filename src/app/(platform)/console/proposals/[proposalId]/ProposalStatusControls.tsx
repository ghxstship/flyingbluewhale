"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { setProposalStatusAction } from "../actions";
import type { ProposalStatus } from "@/lib/supabase/types";

const NEXT: Record<ProposalStatus, { next: ProposalStatus; label: string } | null> = {
  draft: { next: "sent", label: "Send to client" },
  sent: { next: "approved", label: "Mark approved" },
  approved: { next: "signed", label: "Mark signed" },
  expired: { next: "draft", label: "Re-draft" },
  rejected: { next: "draft", label: "Re-draft" },
  signed: null,
};

export function ProposalStatusControls({ id, status }: { id: string; status: ProposalStatus }) {
  const [pending, start] = useTransition();
  const transition = NEXT[status];
  if (!transition) return null;
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await setProposalStatusAction(id, transition.next);
          if (res?.error) toast.error(res.error);
          else toast.success(`Proposal ${transition.next}`);
        })
      }
    >
      {pending ? "Updating…" : transition.label}
    </Button>
  );
}
