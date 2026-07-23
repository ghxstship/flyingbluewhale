"use client";

import { useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { BEO_STATE_LABELS, NEXT_BEO_STATES, type BeoState } from "@/lib/beos";
import { setBeoStateAction } from "../actions";

import { useActionErrorResolver } from "@/lib/errors-client";
// Human label for the transition button per target state.
const ACTION_LABELS: Record<BeoState, string> = {
  draft: "Re-draft",
  sent: "Send",
  signed: "Mark Signed",
  revised: "Revise",
  void: "Void",
};

export function BeoStateControls({ id, state }: { id: string; state: BeoState }) {
  const [pending, start] = useTransition();
  const resolveErr = useActionErrorResolver();
  const nexts = NEXT_BEO_STATES[state] ?? [];
  if (nexts.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {nexts.map((next) => (
        <Button
          key={next}
          variant={next === "void" ? "ghost" : "secondary"}
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await setBeoStateAction(id, next);
              if (res?.error) toast.error(resolveErr(res.error));
              else toast.success(`BEO ${BEO_STATE_LABELS[next].toLowerCase()}`);
            })
          }
        >
          {ACTION_LABELS[next]}
        </Button>
      ))}
    </div>
  );
}
