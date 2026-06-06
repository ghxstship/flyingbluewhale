"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { convertProposalToProjectAction } from "../actions";

export function ProposalConvertButton({ id }: { id: string }) {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="primary"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await convertProposalToProjectAction(id);
          // A successful run redirects, so reaching this code path
          // implies the action returned an error state instead of
          // throwing NEXT_REDIRECT.
          if (res?.error) toast.error(res.error);
        })
      }
    >
      {pending
        ? t("console.proposals.convertButton.converting", undefined, "Converting…")
        : t("console.proposals.convertButton.label", undefined, "Convert to Project")}
    </Button>
  );
}
