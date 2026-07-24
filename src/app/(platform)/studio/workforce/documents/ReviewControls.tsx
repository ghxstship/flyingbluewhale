"use client";

import { useState, useTransition } from "react";
import { useActionErrorResolver } from "@/lib/errors-client";
import { rejectPersonalDocAction, signWorkforceDocUrl, verifyPersonalDocAction } from "./actions";

/**
 * Per-row review controls: View (signed URL) · Verify · Reject (with the
 * reason the uploader will read on their phone). Verified/rejected rows keep
 * View and can be re-reviewed — a wrongly rejected license doesn't need a
 * re-upload.
 */
export function ReviewControls({ docId }: { docId: string }) {
  const [pending, startTransition] = useTransition();
  const resolveErr = useActionErrorResolver();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const view = () =>
    startTransition(async () => {
      setError(null);
      const url = await signWorkforceDocUrl({ id: docId });
      if (!url) {
        setError("Couldn't open the file.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    });

  const verify = () =>
    startTransition(async () => {
      setError(null);
      const res = await verifyPersonalDocAction({ id: docId });
      if (res?.error) setError(resolveErr(res.error));
    });

  const reject = () =>
    startTransition(async () => {
      setError(null);
      const res = await rejectPersonalDocAction({ id: docId, reason: reason.trim() });
      if (res?.error) {
        setError(resolveErr(res.error));
        return;
      }
      setRejecting(false);
      setReason("");
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <button type="button" className="ps-btn ps-btn--sm ps-btn--tertiary" disabled={pending} onClick={view}>
          View
        </button>
        <button type="button" className="ps-btn ps-btn--sm" disabled={pending} onClick={verify}>
          Verify
        </button>
        <button
          type="button"
          className="ps-btn ps-btn--sm ps-btn--tertiary"
          disabled={pending}
          onClick={() => setRejecting((v) => !v)}
        >
          Reject
        </button>
      </div>
      {rejecting && (
        <div className="flex items-center gap-1">
          <input
            className="ps-input ps-input--sm"
            placeholder="Reason the uploader will see"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
          />
          <button
            type="button"
            className="ps-btn ps-btn--sm"
            disabled={pending || reason.trim().length === 0}
            onClick={reject}
          >
            Send
          </button>
        </div>
      )}
      {error && <div className="text-xs text-[var(--p-danger-text)]">{error}</div>}
    </div>
  );
}
