"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { setInvoiceStatusAction } from "../actions";
import type { InvoiceStatus } from "@/lib/supabase/types";

const NEXT: Record<InvoiceStatus, { next: InvoiceStatus; label: string } | null> = {
  draft: { next: "sent", label: "Send invoice" },
  sent: { next: "paid", label: "Mark paid" },
  overdue: { next: "paid", label: "Mark paid" },
  paid: null,
  voided: null,
};

export function InvoiceStatusControls({ id, status }: { id: string; status: InvoiceStatus }) {
  const [pending, start] = useTransition();
  const transition = NEXT[status];
  return (
    <div className="flex gap-2">
      {transition && (
        <Button
          disabled={pending}
          onClick={() => start(async () => {
            const res = await setInvoiceStatusAction(id, transition.next);
            if (res?.error) toast.error(res.error); else toast.success(`Invoice ${transition.next}`);
          })}
        >{pending ? "…" : transition.label}</Button>
      )}
      {status !== "voided" && (
        <Button
          variant="danger"
          disabled={pending}
          onClick={() => start(async () => {
            const res = await setInvoiceStatusAction(id, "voided");
            if (res?.error) toast.error(res.error); else toast.success("Invoice voided");
          })}
        >Void</Button>
      )}
    </div>
  );
}
