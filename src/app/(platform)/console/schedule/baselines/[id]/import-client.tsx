"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { importSchedule, type ImportState } from "./actions";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";

/**
 * Client island that turns a file picker into the source_content needed by
 * the importSchedule server action. We do file-read in the browser so we
 * keep the action interface server-friendly (just a string + baseline_id).
 */
export function ImportScheduleClient({ baselineId }: { baselineId: string }) {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(importSchedule, null);
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
          {pending ? "Importing…" : "Import"}
        </Button>
      </div>
      {fileName && (
        <p className="text-[10px] text-[var(--text-muted)]">
          Selected: <span className="font-mono">{fileName}</span> · {(fileText.length / 1024).toFixed(1)} KB
        </p>
      )}
      {state?.error && <p className="text-xs text-[var(--color-error)]">{state.error}</p>}
      {state?.success && (
        <p className="text-xs text-[var(--color-success)]">
          Imported {state.success.activities} activities and {state.success.dependencies} dependencies.
          {state.success.warnings.length > 0 && (
            <span className="block text-[var(--text-muted)]">
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
