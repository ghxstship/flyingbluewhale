"use client";

import { useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { deleteRuleAction } from "../actions";

export function DeleteRuleButton({ ruleId }: { ruleId: string }) {
  const [pending, startTransition] = useTransition();
  const t = useT();
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
      {t("console.legend.engine.rule.delete", undefined, "Delete")}
    </Button>
  );
}
