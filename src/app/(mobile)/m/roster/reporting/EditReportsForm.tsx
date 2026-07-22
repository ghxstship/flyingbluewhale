"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";
import { updateReports, type State } from "./actions";

export type ReportPersonOpt = { crewId: string; label: string };

/**
 * Kit 30 · Edit Reports — a per-person reports-to select. Pick the person,
 * pick their manager (or None), save. The action runs the cycle guard and
 * writes through the shared letter mutation.
 */
export function EditReportsForm({
  projectId,
  people,
  reportsToByCrewId,
}: {
  projectId: string;
  people: ReportPersonOpt[];
  /** crewId → current manager crewId (or ""), to preselect on person change. */
  reportsToByCrewId: Record<string, string>;
}) {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<State>(null);
  const [saved, setSaved] = useState(false);
  const [personId, setPersonId] = useState("");
  const [managerId, setManagerId] = useState("");

  function onSubmit(fd: FormData) {
    if (pending) return;
    setState(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateReports(null, fd);
      if (res?.error) {
        setState(res);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} style={{ marginTop: 16 }}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="sech" style={{ marginTop: 0 }}>
        <h2>{t("m.roster.reporting.editTitle", undefined, "Edit Reports")}</h2>
      </div>
      <div className="fld">
        <label htmlFor="er-person">
          {t("m.roster.reporting.person", undefined, "Person")}
          <span className="req"> *</span>
        </label>
        <select
          id="er-person"
          name="personCrewId"
          value={personId}
          required
          onChange={(e) => {
            setPersonId(e.target.value);
            setManagerId(reportsToByCrewId[e.target.value] ?? "");
          }}
        >
          <option value="" disabled>
            {t("m.roster.reporting.personPh", undefined, "Pick From The Roster")}
          </option>
          {people.map((p) => (
            <option key={p.crewId} value={p.crewId}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="fld">
        <label htmlFor="er-manager">{t("m.roster.reporting.reportsTo", undefined, "Reports To")}</label>
        <select id="er-manager" name="managerCrewId" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
          <option value="">{t("m.roster.reporting.none", undefined, "None")}</option>
          {people
            .filter((p) => p.crewId !== personId)
            .map((p) => (
              <option key={p.crewId} value={p.crewId}>
                {p.label}
              </option>
            ))}
        </select>
      </div>
      {state?.error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {state.error}
        </div>
      )}
      {saved && (
        <div className="ps-alert ps-alert--ok" role="status" style={{ marginBottom: 12 }}>
          {t("m.roster.reporting.saved", undefined, "Reports Updated")}
        </div>
      )}
      <button
        type="submit"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", opacity: pending ? 0.6 : 1 }}
        disabled={pending || !personId}
      >
        {pending
          ? t("m.roster.reporting.saving", undefined, "Saving…")
          : t("m.roster.reporting.save", undefined, "Save Reporting Line")}
      </button>
    </form>
  );
}
