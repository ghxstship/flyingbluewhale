"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { requestSwap } from "@/components/workforce/swap-action";

/**
 * "Can't make it" — file a swap ask against your own shift.
 *
 * Neither shell could create a `shift_swaps` row: every call site was a
 * select or an update, so the console's approve/decline queue was a UI for
 * an event no user could produce.
 *
 * Two-tap on purpose. A single tap on a shift card is too easy to hit in a
 * pocket, and this one tells a manager you're not coming — but the second
 * tap is a reason field, not a "are you sure?", because the manager's first
 * question is always why.
 */
export function SwapButton({
  shiftId,
  labels,
}: {
  shiftId: string;
  labels: { cta: string; reason: string; placeholder: string; send: string; cancel: string; sent: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const send = () => {
    if (pending) return;
    setError(null);
    const fd = new FormData();
    fd.set("shiftId", shiftId);
    fd.set("revalidate", "/m/schedule");
    if (reason.trim()) fd.set("reason", reason.trim());
    startTransition(async () => {
      const res = await requestSwap(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSent(true);
      setOpen(false);
      router.refresh();
    });
  };

  if (sent) {
    return (
      <div className="hint" style={{ color: "var(--p-success)", marginTop: 8 }}>
        <KIcon name="Check" size={13} /> {labels.sent}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="ps-btn ps-btn--tertiary"
        style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
        onClick={() => setOpen(true)}
      >
        <KIcon name="ArrowLeftRight" size={14} /> {labels.cta}
      </button>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div className="fld">
        <label htmlFor={`swap-reason-${shiftId}`}>{labels.reason}</label>
        <textarea
          id={`swap-reason-${shiftId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={labels.placeholder}
          rows={2}
        />
      </div>
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="ps-btn ps-btn--secondary"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={() => setOpen(false)}
        >
          {labels.cancel}
        </button>
        <button
          type="button"
          className="ps-btn ps-btn--cta"
          style={{ flex: 1, justifyContent: "center" }}
          disabled={pending}
          onClick={send}
        >
          <KIcon name="Send" size={14} /> {labels.send}
        </button>
      </div>
    </div>
  );
}
