"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

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
  const [target, setTarget] = useState<Target>("crew-members");
  const [csv, setCsv] = useState("");
  const [projectId, setProjectId] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => setCsv(t));
  }

  function submit() {
    if (!csv.trim()) {
      toast.error("Drop a CSV file first");
      return;
    }
    if (target === "tasks" && !projectId) {
      toast.error("Tasks require a projectId");
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
        toast.error(payload.error?.message ?? "Import failed");
        return;
      }
      setResult(payload.data ?? null);
      toast.success(`Imported ${payload.data?.insertedCount ?? 0} rows`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium uppercase tracking-wider text-[var(--text-muted)]">Target</span>
          <select value={target} onChange={(e) => setTarget(e.target.value as Target)} className="input-base w-52">
            <option value="crew-members">Crew roster</option>
            <option value="tasks">Project tasks</option>
            <option value="vendors">Vendors</option>
          </select>
        </label>
        {target === "tasks" ? (
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium uppercase tracking-wider text-[var(--text-muted)]">Project id</span>
            <input value={projectId} onChange={(e) => setProjectId(e.target.value)} className="input-base w-80 font-mono text-xs" placeholder="uuid" />
          </label>
        ) : null}
      </div>
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">CSV file</span>
        <input type="file" accept=".csv,text/csv" onChange={onFile} className="mt-1 block" />
      </label>
      <Button type="button" onClick={submit} disabled={isPending}>
        {isPending ? "Importing…" : "Import CSV"}
      </Button>
      {result ? (
        <div className="rounded-md border border-[var(--border-color)] p-4 text-sm">
          <p><strong>{result.insertedCount}</strong> inserted · {result.skippedCount} skipped · {result.invalidCount} invalid of {result.rowCount} rows</p>
          {result.invalid.length > 0 ? (
            <details className="mt-2">
              <summary className="cursor-pointer">First {result.invalid.length} invalid rows</summary>
              <ul className="mt-2 space-y-1 text-xs">
                {result.invalid.map((r, i) => (
                  <li key={i}>Row {r.rowIdx}: {r.errors.join(" · ")}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
