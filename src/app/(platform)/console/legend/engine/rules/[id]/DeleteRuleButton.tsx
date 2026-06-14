"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { deleteRuleAction } from "../actions";

export function DeleteRuleButton({ ruleId }: { ruleId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await deleteRuleAction(ruleId);
          if (res?.error) toast.error(res.error);
          // success path redirects server-side
        })
      }
    >
      Delete
    </Button>
  );
}
