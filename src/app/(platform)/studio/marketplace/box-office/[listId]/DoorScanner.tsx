"use client";

import { useState, useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  GUEST_SCAN_RESULT_LABELS,
  GUEST_SCAN_RESULT_TONE,
  type GuestScanResult,
} from "@/lib/box_office";
import { scanGuestCodeAction } from "../actions";

import { useActionErrorResolver } from "@/lib/errors-client";
/**
 * Door-scan affordance. Mirrors the advancing scan loop: paste/scan a code,
 * resolve it to a guest-list entry, and on `accepted` flip the entry to
 * arrived. Shows the last scan outcome inline (accepted / duplicate /
 * denied / not found) — DICE/TIXR door behaviour.
 */
export function DoorScanner({ listId }: { listId: string }) {
  const t = useT();
  const resolveErr = useActionErrorResolver();
  const [pending, startTransition] = useTransition();
  const [last, setLast] = useState<{ result: GuestScanResult; guestName?: string } | null>(null);

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex-1">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            {t("console.boxOffice.scan.title", undefined, "Door Scan")}
          </h2>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t("console.boxOffice.scan.hint", undefined, "Scan or type a guest code to check them in.")}
          </p>
        </div>
        {last && (
          <Badge variant={GUEST_SCAN_RESULT_TONE[last.result]}>
            {GUEST_SCAN_RESULT_LABELS[last.result]}
            {last.guestName ? ` · ${last.guestName}` : ""}
          </Badge>
        )}
      </div>
      <form
        className="mt-3 flex flex-wrap items-end gap-2"
        action={(fd) => {
          startTransition(async () => {
            const res = await scanGuestCodeAction(null, fd);
            if (res?.error) {
              toast.error(resolveErr(res.error));
              return;
            }
            if (res?.result) {
              setLast({ result: res.result, guestName: res.guestName });
              if (res.result === "accepted") toast.success(GUEST_SCAN_RESULT_LABELS.accepted);
              else if (res.result === "duplicate") toast.warning(GUEST_SCAN_RESULT_LABELS.duplicate);
              else toast.error(GUEST_SCAN_RESULT_LABELS[res.result]);
            }
            const el = document.querySelector<HTMLInputElement>('input[name="scan_code"]');
            if (el) {
              el.value = "";
              el.focus();
            }
          });
        }}
      >
        <input type="hidden" name="guest_list_id" value={listId} />
        <div className="min-w-[14rem] flex-1">
          <Input
            name="scan_code"
            placeholder={t("console.boxOffice.scan.placeholder", undefined, "GL-XXXXXX-XXXX")}
            autoFocus
            autoComplete="off"
          />
        </div>
        <Button type="submit" loading={pending}>
          {t("console.boxOffice.scan.submit", undefined, "Check In")}
        </Button>
      </form>
    </section>
  );
}
