"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { FormShell } from "@/components/FormShell";
import { LabeledCheckbox } from "@/components/ui/Checkbox";
import { useT } from "@/lib/i18n/LocaleProvider";
import { setReportsAction } from "./actions";

export type RosterPerson = { id: string; name: string; role: string };

const inputCls =
  "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] p-2 text-sm text-[var(--p-text-1)]";

/**
 * Kit 30 Edit Reports drawer — mounted by the reporting page when
 * `?edit=1`. Pick a manager, multi-select their direct reports from the
 * roster; the action rewrites reports_to_crew_member_id on each report's
 * live letters (with the cycle guard server-side).
 */
export function EditReportsDrawer({
  projectId,
  closeHref,
  people,
}: {
  projectId: string;
  closeHref: string;
  people: RosterPerson[];
}) {
  const t = useT();
  const [managerId, setManagerId] = useState("");

  return (
    <div className="fixed inset-0 z-[var(--p-z-overlay)]">
      <Link
        href={closeHref}
        aria-label={t("console.projects.roster.reporting.close", undefined, "Close")}
        className="absolute inset-0 bg-[var(--overlay-backdrop)] backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("console.projects.roster.reporting.editTitle", undefined, "Edit Reports")}
        className="absolute inset-y-0 right-0 z-[var(--p-z-modal)] flex w-full max-w-md flex-col overflow-y-auto border-l border-[var(--p-border)] bg-[var(--p-bg)] shadow-[var(--p-elev-2xl)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--p-border)] px-5 py-4">
          <div>
            <div className="eyebrow">
              {t("console.projects.roster.reporting.eyebrow", undefined, "Reporting Structure")}
            </div>
            <h2 className="text-lg font-bold text-[var(--p-text-1)]">
              {t("console.projects.roster.reporting.editTitle", undefined, "Edit Reports")}
            </h2>
          </div>
          <Link
            href={closeHref}
            aria-label={t("console.projects.roster.reporting.close", undefined, "Close")}
            className="grid size-8 place-items-center rounded-md text-[var(--p-text-3)] hover:bg-[var(--p-surface-2,var(--p-surface))] hover:text-[var(--p-text-1)]"
          >
            <X size={16} />
          </Link>
        </div>
        <div className="flex-1 px-5 py-4">
          <FormShell
            action={setReportsAction.bind(null, projectId)}
            submitLabel={t("console.projects.roster.reporting.save", undefined, "Update Reports")}
            cancelHref={closeHref}
            className="space-y-4"
          >
            <label className="block space-y-1 text-xs">
              <div className="tracking-wide text-[var(--p-text-2)] uppercase">
                {t("console.projects.roster.reporting.manager", undefined, "Manager")}
              </div>
              <select
                name="managerId"
                required
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className={inputCls}
              >
                <option value="" disabled>
                  {t("console.projects.roster.reporting.managerPlaceholder", undefined, "Pick A Manager…")}
                </option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {`${p.name} · ${p.role}`}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="space-y-2">
              <legend className="text-xs tracking-wide text-[var(--p-text-2)] uppercase">
                {t("console.projects.roster.reporting.reports", undefined, "Direct Reports")}
              </legend>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border border-[var(--p-border)] p-3">
                {people
                  .filter((p) => p.id !== managerId)
                  .map((p) => (
                    <LabeledCheckbox key={p.id} name="reportIds" value={p.id} label={p.name} description={p.role} />
                  ))}
              </div>
              <p className="text-[11px] text-[var(--p-text-3)]">
                {t(
                  "console.projects.roster.reporting.cycleHint",
                  undefined,
                  "Loops are refused: a manager can't sit below one of their own reports.",
                )}
              </p>
            </fieldset>
          </FormShell>
        </div>
      </aside>
    </div>
  );
}
