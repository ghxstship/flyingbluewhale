"use client";

import { useState, useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

type Target = "crew-members" | "tasks" | "vendors";

type ImportResult = {
  rowCount: number;
  validCount: number;
  invalidCount: number;
  insertedCount: number;
  skippedCount: number;
  invalid: Array<{ rowIdx: number; errors: string[] }>;
};

export function ImportForm() {
  const t = useT();
  const [target, setTarget] = useState<Target>("crew-members");
  const [csv, setCsv] = useState("");
  const [projectId, setProjectId] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text()
      .then((text) => setCsv(text))
      .catch(() => setCsv(""));
  }

  function submit() {
    if (!csv.trim()) {
      toast.error(t("console.settings.imports.errors.noCsv", undefined, "Drop a CSV file first"));
      return;
    }
    if (target === "tasks" && !projectId) {
      toast.error(t("console.settings.imports.errors.projectIdRequired", undefined, "Tasks require a projectId"));
      return;
    }
    startTransition(async () => {
      const body: Record<string, string> = { csv };
      if (target === "tasks") body.projectId = projectId;
      const r = await fetch(`/api/v1/import/${target}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        data?: ImportResult;
        error?: { message?: string };
      };
      if (!r.ok || payload.ok === false) {
        toast.error(
          payload.error?.message ?? t("console.settings.imports.errors.importFailed", undefined, "Import failed"),
        );
        return;
      }
      setResult(payload.data ?? null);
      toast.success(
        t(
          "console.settings.imports.successToast",
          { count: payload.data?.insertedCount ?? 0 },
          `Imported ${payload.data?.insertedCount ?? 0} rows`,
        ),
      );
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium tracking-wider text-[var(--p-text-2)] uppercase">
            {t("console.settings.imports.targetLabel", undefined, "Target")}
          </span>
          <select value={target} onChange={(e) => setTarget(e.target.value as Target)} className="ps-input w-52">
            <option value="crew-members">
              {t("console.settings.imports.targets.crewMembers", undefined, "Crew roster")}
            </option>
            <option value="tasks">{t("console.settings.imports.targets.tasks", undefined, "Project tasks")}</option>
            <option value="vendors">{t("console.settings.imports.targets.vendors", undefined, "Vendors")}</option>
          </select>
        </label>
        {target === "tasks" ? (
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium tracking-wider text-[var(--p-text-2)] uppercase">
              {t("console.settings.imports.projectIdLabel", undefined, "Project id")}
            </span>
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="ps-input w-80 font-mono text-xs"
              placeholder={t("console.settings.imports.projectIdPlaceholder", undefined, "uuid")}
            />
          </label>
        ) : null}
      </div>
      <label className="block">
        <span className="text-xs font-medium tracking-wider text-[var(--p-text-2)] uppercase">
          {t("console.settings.imports.csvFileLabel", undefined, "CSV file")}
        </span>
        <input type="file" accept=".csv,text/csv" onChange={onFile} className="mt-1 block" />
      </label>
      <Button type="button" onClick={submit} disabled={isPending}>
        {isPending
          ? t("console.settings.imports.importing", undefined, "Importing…")
          : t("console.settings.imports.importCta", undefined, "Import CSV")}
      </Button>
      {result ? (
        <div className="rounded-md border border-[var(--p-border)] p-4 text-sm">
          <p>
            <strong>{result.insertedCount}</strong>{" "}
            {t("console.settings.imports.summary.inserted", undefined, "inserted")} · {result.skippedCount}{" "}
            {t("console.settings.imports.summary.skipped", undefined, "skipped")} · {result.invalidCount}{" "}
            {t(
              "console.settings.imports.summary.invalidOf",
              { total: result.rowCount },
              `invalid of ${result.rowCount} rows`,
            )}
          </p>
          {result.invalid.length > 0 ? (
            <details className="mt-2">
              <summary className="cursor-pointer">
                {t(
                  "console.settings.imports.summary.firstInvalid",
                  { count: result.invalid.length },
                  `First ${result.invalid.length} invalid rows`,
                )}
              </summary>
              <ul className="mt-2 space-y-1 text-xs">
                {result.invalid.map((row, i) => (
                  <li key={i}>
                    {t("console.settings.imports.summary.rowLabel", { idx: row.rowIdx }, `Row ${row.rowIdx}`)}:{" "}
                    {row.errors.join(" · ")}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
