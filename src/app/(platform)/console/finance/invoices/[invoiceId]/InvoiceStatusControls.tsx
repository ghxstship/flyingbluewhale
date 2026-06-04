"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { setInvoiceStatusAction } from "../actions";
import type { InvoiceStatus } from "@/lib/supabase/types";

const NEXT: Record<InvoiceStatus, { next: InvoiceStatus; labelKey: string; labelFallback: string } | null> = {
  draft: {
    next: "sent",
    labelKey: "console.finance.invoices.statusControls.sendInvoice",
    labelFallback: "Send Invoice",
  },
  sent: { next: "paid", labelKey: "console.finance.invoices.statusControls.markPaid", labelFallback: "Mark Paid" },
  overdue: { next: "paid", labelKey: "console.finance.invoices.statusControls.markPaid", labelFallback: "Mark Paid" },
  paid: null,
  voided: null,
};

export function InvoiceStatusControls({ id, status }: { id: string; status: InvoiceStatus }) {
  const t = useT();
  const [pending, start] = useTransition();
  const transition = NEXT[status];
  return (
    <div className="flex gap-2">
      {transition && (
        <Button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await setInvoiceStatusAction(id, transition.next);
              if (res?.error) toast.error(res.error);
              else
                toast.success(
                  t(
                    `console.finance.invoices.statusControls.toast.${transition.next}`,
                    undefined,
                    `Invoice ${transition.next}`,
                  ),
                );
            })
          }
        >
          {pending ? "…" : t(transition.labelKey, undefined, transition.labelFallback)}
        </Button>
      )}
      {status !== "voided" && (
        <Button
          variant="danger"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await setInvoiceStatusAction(id, "voided");
              if (res?.error) toast.error(res.error);
              else
                toast.success(t("console.finance.invoices.statusControls.toast.voided", undefined, "Invoice voided"));
            })
          }
        >
          {t("console.finance.invoices.statusControls.void", undefined, "Void")}
        </Button>
      )}
    </div>
  );
}
