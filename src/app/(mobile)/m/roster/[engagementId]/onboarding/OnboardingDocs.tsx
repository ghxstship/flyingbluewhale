"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { remindDoc, waiveDoc, type State } from "./actions";

/**
 * Kit 30 · onboarding doc cards — client leaf. Each open doc carries Remind +
 * Waive; both re-check `people:manage` server-side. Rows are plain data the
 * server page shapes (dates pre-formatted, labels pre-translated where they
 * come from state maps).
 */

export type DocRow = {
  id: string;
  title: string;
  critical: boolean;
  note: string;
  stateLabel: string;
  tone: string;
  /** Open docs (pending/in_progress/blocked) can be reminded or waived. */
  open: boolean;
};

const DOC_ICON = ["FileText", "FileSignature", "Compass", "PlaneLanding"];

export function OnboardingDocs({ engagementId, docs }: { engagementId: string; docs: DocRow[] }) {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [state, setState] = useState<State>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  function run(id: string, fn: () => Promise<State>) {
    if (pending) return;
    setState(null);
    setSentId(null);
    setBusyId(id);
    startTransition(async () => {
      const res = await fn();
      setBusyId(null);
      if (res?.error) {
        setState(res);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      {state?.error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {state.error}
        </div>
      )}
      {docs.map((d, i) => (
        <div className="item" key={d.id}>
          <span className="avatar-sm">
            <KIcon name={DOC_ICON[i % DOC_ICON.length]!} size={16} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">
              {d.title}
              {d.critical ? <span style={{ color: "var(--p-danger)" }}> ★</span> : null}
            </div>
            <div className="s">{sentId === d.id ? t("m.roster.onboarding.reminded", undefined, "Reminder Sent") : d.note}</div>
            {d.open && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className="chip"
                  disabled={pending}
                  style={{ opacity: pending && busyId === d.id ? 0.6 : 1 }}
                  onClick={() =>
                    run(d.id, async () => {
                      const res = await remindDoc(engagementId, d.id, null, new FormData());
                      if (!res?.error) setSentId(d.id);
                      return res;
                    })
                  }
                >
                  {t("m.roster.onboarding.remind", undefined, "Send Reminder")}
                </button>
                <button
                  type="button"
                  className="chip"
                  disabled={pending}
                  style={{ opacity: pending && busyId === d.id ? 0.6 : 1 }}
                  onClick={() => run(d.id, () => waiveDoc(engagementId, d.id, null, new FormData()))}
                >
                  {t("m.roster.onboarding.waive", undefined, "Waive")}
                </button>
              </div>
            )}
          </div>
          <span className={`ps-badge ps-badge--${d.tone}`} style={{ flex: "none" }}>
            {d.stateLabel}
          </span>
        </div>
      ))}
    </>
  );
}
