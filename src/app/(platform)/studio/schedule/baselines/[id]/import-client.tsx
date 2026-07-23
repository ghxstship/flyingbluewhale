"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { importSchedule, type ImportState } from "./actions";

import { useActionErrorResolver } from "@/lib/errors-client";
const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";

/**
 * Client island that turns a file picker into the source_content needed by
 * the importSchedule server action. We do file-read in the browser so we
 * keep the action interface server-friendly (just a string + baseline_id).
 */
export function ImportScheduleClient({ baselineId }: { baselineId: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<ImportState, FormData>(importSchedule, null);
  const resolveErr = useActionErrorResolver();
  const [fileText, setFileText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setFileText(await f.text());
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="baseline_id" value={baselineId} />
      <input type="hidden" name="source_content" value={fileText} />
      <div className="flex items-center gap-2">
        <input type="file" accept=".xer,.xml,.txt" onChange={onFile} className={`${INPUT} text-xs`} />
        <Button type="submit" size="sm" disabled={!fileText || pending}>
          {pending
            ? t("console.schedule.baselines.import.importing", undefined, "Importing…")
            : t("console.schedule.baselines.import.import", undefined, "Import")}
        </Button>
      </div>
      {fileName && (
        <p className="text-[11px] text-[var(--p-text-2)]">
          {t("console.schedule.baselines.import.selected", undefined, "Selected:")}{" "}
          <span className="font-mono">{fileName}</span> · {(fileText.length / 1024).toFixed(1)}{" "}
          {t("console.schedule.baselines.import.kb", undefined, "KB")}
        </p>
      )}
      {state?.error && <p className="text-xs text-[var(--p-danger)]">{resolveErr(state.error)}</p>}
      {state?.success && (
        <p className="text-xs text-[var(--p-success)]">
          {t(
            "console.schedule.baselines.import.imported",
            { activities: state.success.activities, dependencies: state.success.dependencies },
            `Imported ${state.success.activities} activities and ${state.success.dependencies} dependencies.`,
          )}
          {state.success.warnings.length > 0 && (
            <span className="block text-[var(--p-text-2)]">
              {state.success.warnings.map((w, i) => (
                <span key={i} className="block">
                  ⚠ {w}
                </span>
              ))}
            </span>
          )}
        </p>
      )}
    </form>
  );
}
