"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormShell } from "@/components/FormShell";
import { LabeledCheckbox } from "@/components/ui/Checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
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
  const router = useRouter();
  const [managerId, setManagerId] = useState("");

  return (
    /* W6 a11y refit — the shared Radix Sheet primitive supplies the scrim,
       Escape-to-close, focus trap + restore, and the ✕ control; closing
       navigates back to the reporting URL (the drawer mounts off `?edit=1`). */
    <Sheet open onOpenChange={(o) => (!o ? router.push(closeHref) : null)}>
      <SheetContent side="right" aria-label={t("console.projects.roster.reporting.editTitle", undefined, "Edit Reports")}>
        <SheetHeader>
          <div className="eyebrow">
            {t("console.projects.roster.reporting.eyebrow", undefined, "Reporting Structure")}
          </div>
          <SheetTitle>{t("console.projects.roster.reporting.editTitle", undefined, "Edit Reports")}</SheetTitle>
        </SheetHeader>
        <div className="flex-1">
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
      </SheetContent>
    </Sheet>
  );
}
