"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { setPoStatusAction } from "../actions";
import type { POStatus } from "@/lib/supabase/types";

const NEXT: Record<POStatus, { next: POStatus; label: string } | null> = {
  draft: { next: "sent", label: "Send PO" },
  sent: { next: "acknowledged", label: "Mark acknowledged" },
  acknowledged: { next: "fulfilled", label: "Mark fulfilled" },
  fulfilled: null,
  cancelled: null,
};

export function PoStatusControls({ id, status }: { id: string; status: POStatus }) {
  const [pending, start] = useTransition();
  const t = NEXT[status];
  return (
    <div className="flex gap-2">
      {t && (
        <Button disabled={pending} onClick={() => start(async () => {
          const r = await setPoStatusAction(id, t.next);
          if (r?.error) toast.error(r.error); else toast.success(`PO ${t.next}`);
        })}>{pending ? "…" : t.label}</Button>
      )}
      {status !== "cancelled" && status !== "fulfilled" && (
        <Button variant="danger" disabled={pending} onClick={() => start(async () => {
          const r = await setPoStatusAction(id, "cancelled");
          if (r?.error) toast.error(r.error); else toast.success("PO cancelled");
        })}>Cancel</Button>
      )}
    </div>
  );
}
