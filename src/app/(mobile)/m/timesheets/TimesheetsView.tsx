"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";
import { submitTimesheet } from "./actions";

export type TimesheetRow = {
  id: string;
  period: string;
  state: string;
  stateLabel: string;
  total: string;
  billable: string;
  canSubmit: boolean;
};

const STATE_TONE: Record<string, string> = {
  open: "neutral",
  submitted: "warn",
  approved: "ok",
  rejected: "danger",
  posted: "ok",
  archived: "neutral",
};

export function TimesheetsView({
  rows,
  unlinked,
  eyebrow,
  title,
}: {
  rows: TimesheetRow[];
  unlinked: boolean;
  eyebrow: string;
  title: string;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const submit = (id: string) => {
    if (pending) return;
    setError(null);
    setBusyId(id);
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      const res = await submitTimesheet(null, fd);
      setBusyId(null);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>

      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {unlinked ? (
        <EmptyState
          size="compact"
          title={t("m.timesheets.unlinked.title", undefined, "No Timesheets For You Yet")}
          description={t(
            "m.timesheets.unlinked.body",
            undefined,
            "Your account isn't linked to a worker record yet, so there's nothing to submit. Your manager can link it.",
          )}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("m.timesheets.empty.title", undefined, "No Timesheets")}
          description={t(
            "m.timesheets.empty.body",
            undefined,
            "Timesheets are built from your punches. When a period opens, it shows up here to submit.",
          )}
        />
      ) : (
        rows.map((r) => (
          <div className="item" key={r.id} style={{ display: "block" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <KIcon name="Timer" size={18} style={{ color: "var(--p-text-2)", flex: "none", marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{r.period}</div>
                <div className="s" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {t("m.timesheets.total", undefined, "Total")} {r.total} ·{" "}
                  {t("m.timesheets.billable", undefined, "Billable")} {r.billable}
                </div>
              </div>
              <span className={`ps-badge ps-badge--${STATE_TONE[r.state] ?? "neutral"}`}>{r.stateLabel}</span>
            </div>

            {/* `canSubmit` is the FSM's SUBMITTABLE_STATES, so a rejected sheet
                the worker has corrected can go back — a rejection that can't be
                re-submitted is a dead end for them. */}
            {r.canSubmit && (
              <button
                type="button"
                className="ps-btn ps-btn--cta ps-btn--lg"
                style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                disabled={pending}
                onClick={() => submit(r.id)}
              >
                <KIcon name="Check" size={15} />{" "}
                {busyId === r.id
                  ? t("m.timesheets.submitting", undefined, "Submitting…")
                  : r.state === "rejected"
                    ? t("m.timesheets.resubmit", undefined, "Submit Again")
                    : t("m.timesheets.submit", undefined, "Submit For Approval")}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
