"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestSwap } from "./swap-action";

import { useActionErrorResolver } from "@/lib/errors-client";
/**
 * "Can't make it" — file a swap ask against your own shift, from the portal.
 *
 * The portal used to render a "Swap shift" CTA pointing at `/m/requests`.
 * That is the manager approvals queue: for the crew member being shown the
 * button it is a read-only list of their own asks with no create affordance,
 * so the button landed them on an empty page in an app a vendor couldn't
 * even open. The create only ever existed on the shift card in COMPVSS.
 *
 * This is the portal's card-level equivalent. Same shared action, same
 * ownership + one-open-ask-per-shift guards; portal chrome instead of kit
 * chrome, per ADR-0008 migration rule 3 (same data, different chrome).
 *
 * Two-step on purpose, matching the mobile flow: the second step is a reason
 * field rather than an "are you sure?", because the manager's first question
 * is always why.
 */
export function SwapRequestButton({
  shiftId,
  revalidate,
}: {
  shiftId: string;
  /** The portal path to re-render after filing. The manager queue is refreshed by the action itself. */
  revalidate: string;
}) {
  const router = useRouter();
  const resolveErr = useActionErrorResolver();
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
    fd.set("revalidate", revalidate);
    if (reason.trim()) fd.set("reason", reason.trim());
    startTransition(async () => {
      const res = await requestSwap(null, fd);
      if (res?.error) {
        setError(resolveErr(res.error));
        return;
      }
      setSent(true);
      setOpen(false);
      router.refresh();
    });
  };

  if (sent) {
    return <p className="mt-2 text-xs text-[var(--p-success-text)]">Swap requested. Your manager has been notified.</p>;
  }

  if (!open) {
    return (
      <button type="button" className="ps-btn ps-btn--tertiary ps-btn--sm mt-2" onClick={() => setOpen(true)}>
        Can&rsquo;t make it
      </button>
    );
  }

  return (
    <div className="mt-2">
      <label className="lbl" htmlFor={`swap-reason-${shiftId}`}>
        Reason
      </label>
      <textarea
        id={`swap-reason-${shiftId}`}
        className="ps-input"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="What came up?"
        rows={2}
      />
      {error && (
        <div className="ps-alert ps-alert--danger mt-2" role="alert">
          {error}
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <button type="button" className="ps-btn ps-btn--tertiary ps-btn--sm" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="button" className="ps-btn ps-btn--cta ps-btn--sm" disabled={pending} onClick={send}>
          {pending ? "Sending…" : "Request swap"}
        </button>
      </div>
    </div>
  );
}
