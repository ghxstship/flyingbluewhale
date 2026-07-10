"use client";
import { useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { setPoStatusAction } from "../actions";
import type { POStatus } from "@/lib/supabase/types";

const NEXT: Record<POStatus, { next: POStatus; labelKey: string; labelFallback: string } | null> = {
  draft: { next: "sent", labelKey: "console.procurement.purchaseOrders.status.sendPo", labelFallback: "Send PO" },
  sent: {
    next: "acknowledged",
    labelKey: "console.procurement.purchaseOrders.status.markAcknowledged",
    labelFallback: "Mark Acknowledged",
  },
  acknowledged: {
    next: "fulfilled",
    labelKey: "console.procurement.purchaseOrders.status.markFulfilled",
    labelFallback: "Mark Fulfilled",
  },
  fulfilled: null,
  cancelled: null,
};

export function PoStatusControls({ id, status }: { id: string; status: POStatus }) {
  const t = useT();
  const [pending, start] = useTransition();
  const next = NEXT[status];
  return (
    <div className="flex gap-2">
      {next && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await setPoStatusAction(id, next.next);
              if (r?.error) toast.error(r.error);
              else
                toast.success(
                  t("console.procurement.purchaseOrders.statusToast", { status: next.next }, `PO ${next.next}`),
                );
            })
          }
        >
          {pending ? "…" : t(next.labelKey, undefined, next.labelFallback)}
        </Button>
      )}
      {status !== "cancelled" && status !== "fulfilled" && (
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await setPoStatusAction(id, "cancelled");
              if (r?.error) toast.error(r.error);
              else toast.success(t("console.procurement.purchaseOrders.cancelledToast", undefined, "PO cancelled"));
            })
          }
        >
          {t("common.cancel", undefined, "Cancel")}
        </Button>
      )}
    </div>
  );
}
