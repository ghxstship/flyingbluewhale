"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

const TABLES = [
  { value: "projects", label: "Projects" },
  { value: "deliverables", label: "Deliverables" },
  { value: "invoices", label: "Invoices" },
  { value: "tasks", label: "Tasks" },
  { value: "tickets", label: "Tickets" },
  { value: "crew_members", label: "Crew roster" },
  { value: "vendors", label: "Vendors" },
  { value: "audit_log", label: "Audit log" },
];

const KINDS = [
  { value: "csv", label: "CSV" },
  { value: "json", label: "JSON" },
  { value: "xlsx", label: "Excel (XLSX)" },
  { value: "zip", label: "ZIP (CSV + JSON)" },
];

export function NewExportForm() {
  const [kind, setKind] = useState("csv");
  const [table, setTable] = useState("projects");
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const r = await fetch("/api/v1/exports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, table }),
      });
      const body = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        data?: { signedUrl?: string | null };
        error?: { message?: string };
      };
      if (!r.ok || body.ok === false) {
        toast.error(body.error?.message ?? "Export failed");
        return;
      }
      toast.success("Export ready");
      const url = body.data?.signedUrl;
      if (url) window.location.href = url;
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium uppercase tracking-wider text-[var(--text-muted)]">Format</span>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="input-base w-40"
        >
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium uppercase tracking-wider text-[var(--text-muted)]">Table</span>
        <select
          value={table}
          onChange={(e) => setTable(e.target.value)}
          className="input-base w-52"
        >
          {TABLES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>
      <Button type="button" onClick={submit} disabled={isPending}>
        {isPending ? "Generating…" : "Run export"}
      </Button>
    </div>
  );
}
