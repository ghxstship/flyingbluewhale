"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

type ActionResult = { error?: string } | null | undefined | void;

/**
 * Generic loop-closer button for record detail pages (v7.8 record
 * actions). Receives a pre-bound server action from the RSC page —
 * labels are translated server-side so this stays a dumb trigger.
 * A successful action redirects to the created record; reaching the
 * post-await code path therefore implies an error state (the
 * ProposalConvertButton pattern).
 */
export function RecordActionButton({
  action,
  label,
  pendingLabel,
  variant = "primary",
}: {
  action: () => Promise<ActionResult>;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant={variant}
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await action();
          if (res && typeof res === "object" && "error" in res && res.error) toast.error(res.error);
        })
      }
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
