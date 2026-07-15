"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  CORRECTION_KIND_LABEL,
  MIN_CORRECTION_REASON,
  isUsableCorrectionReason,
  requiredProposals,
  type CorrectionKind,
} from "@/lib/time/corrections";

/**
 * "Request a fix" on a past shift.
 *
 * The worker half of the correction loop. Filing does NOT change the punch
 * — it proposes a change a manager has to approve. Before this, the crew
 * timesheet portal was strictly read-only and a worker who clocked in
 * wrong had no path but to find a manager in person.
 *
 * Posts directly (not through the offline outbox): a correction is
 * considered rather than urgent, and the outbox drops 4xx terminally, so a
 * rejected request would vanish silently. This fails loudly instead.
 */

/** The kinds a worker can file against an existing entry. */
const KINDS: CorrectionKind[] = ["edit_in", "edit_out", "edit_both", "delete_entry"];

/** Format an ISO instant for a datetime-local input, in local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CorrectionRequest({
  entryId,
  startedAt,
  endedAt,
  pendingKind,
}: {
  entryId: string;
  startedAt: string;
  endedAt: string | null;
  /** Set when this entry already has an open request. */
  pendingKind?: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<CorrectionKind>("edit_out");
  const [start, setStart] = useState(toLocalInput(startedAt));
  const [end, setEnd] = useState(toLocalInput(endedAt));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (pendingKind) {
    return (
      <div className="s" style={{ marginTop: 8, color: "var(--p-warning-text)" }}>
        {t("m.clock.correction.pending", undefined, "Fix requested. Waiting on your supervisor.")}
      </div>
    );
  }

  if (done) {
    return (
      <div className="s" style={{ marginTop: 8, color: "var(--p-success-text)" }}>
        {t("m.clock.correction.sent", undefined, "Sent to your supervisor.")}
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="ps-btn ps-btn--tertiary ps-btn--sm" style={{ marginTop: 8 }} onClick={() => setOpen(true)}>
        {t("m.clock.correction.open", undefined, "Request a fix")}
      </button>
    );
  }

  const need = requiredProposals(kind);
  const canSubmit =
    isUsableCorrectionReason(reason) && (!need.start || !!start) && (!need.end || !!end) && !busy;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/time/corrections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          timeEntryId: entryId,
          kind,
          reason: reason.trim(),
          ...(need.start && start ? { proposedStartedAt: new Date(start).toISOString() } : {}),
          ...(need.end && end ? { proposedEndedAt: new Date(end).toISOString() } : {}),
        }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: { message?: string } } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error?.message ?? t("m.clock.correction.failed", undefined, "Could not send that request."));
        return;
      }
      setDone(true);
      setOpen(false);
      router.refresh();
    } catch {
      setError(t("m.clock.correction.offline", undefined, "You're offline. Try again once you have signal."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-inset" style={{ marginTop: 10, padding: 12, borderRadius: "var(--p-r-md)" }}>
      <label className="ps-caption" htmlFor={`kind-${entryId}`} style={{ display: "block", marginBottom: 4 }}>
        {t("m.clock.correction.whatsWrong", undefined, "What's wrong?")}
      </label>
      <select
        id={`kind-${entryId}`}
        className="ps-input ps-input--sm"
        value={kind}
        onChange={(e) => setKind(e.target.value as CorrectionKind)}
        style={{ width: "100%", marginBottom: 8 }}
      >
        {KINDS.map((k) => (
          <option key={k} value={k}>
            {CORRECTION_KIND_LABEL[k]}
          </option>
        ))}
      </select>

      {need.start && (
        <>
          <label className="ps-caption" htmlFor={`start-${entryId}`} style={{ display: "block", marginBottom: 4 }}>
            {t("m.clock.correction.startShouldBe", undefined, "Start time should be")}
          </label>
          <input
            id={`start-${entryId}`}
            type="datetime-local"
            className="ps-input ps-input--sm"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
        </>
      )}
      {need.end && (
        <>
          <label className="ps-caption" htmlFor={`end-${entryId}`} style={{ display: "block", marginBottom: 4 }}>
            {t("m.clock.correction.endShouldBe", undefined, "End time should be")}
          </label>
          <input
            id={`end-${entryId}`}
            type="datetime-local"
            className="ps-input ps-input--sm"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
        </>
      )}

      <label className="ps-caption" htmlFor={`reason-${entryId}`} style={{ display: "block", marginBottom: 4 }}>
        {t("m.clock.correction.reason", undefined, "What happened?")}
      </label>
      <textarea
        id={`reason-${entryId}`}
        className="ps-input ps-input--sm"
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t("m.clock.correction.reasonHint", undefined, "Worked until 6, forgot to tap out at the gate")}
        style={{ width: "100%", marginBottom: 8 }}
      />
      {reason.length > 0 && !isUsableCorrectionReason(reason) && (
        <div className="ps-caption" style={{ marginBottom: 8, color: "var(--p-text-3)" }}>
          {t(
            "m.clock.correction.reasonShort",
            { min: MIN_CORRECTION_REASON },
            `A few more words (${MIN_CORRECTION_REASON} characters minimum).`,
          )}
        </div>
      )}
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="ps-btn ps-btn--sm" disabled={!canSubmit} onClick={submit}>
          {busy
            ? t("m.clock.correction.sending", undefined, "Sending…")
            : t("m.clock.correction.submit", undefined, "Send request")}
        </button>
        <button
          type="button"
          className="ps-btn ps-btn--tertiary ps-btn--sm"
          disabled={busy}
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          {t("m.clock.correction.cancel", undefined, "Cancel")}
        </button>
      </div>
    </div>
  );
}
