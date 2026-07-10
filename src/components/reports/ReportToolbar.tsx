"use client";

import { useEffect, useState } from "react";
import { ReportRenderer } from "./ReportEngine";
import type { ReportDef, MetricValues } from "@/lib/reports/registry";
import type { DocBrand, OrgBrand, ClientBrand } from "@/components/documents/DocEngine";
import { useToast } from "@/lib/hooks/useToast";

/**
 * Client viewer wrapping <ReportRenderer> — the same affordances the documents
 * viewer exposes: white-label brand mode (atlvs · co · white) and Print/PDF
 * (window.print → the report's @media print path), plus:
 *  - the brand choice persists across report views (localStorage),
 *  - "Save snapshot" calls the existing snapshot API
 *    (GET /api/v1/reports/{id}/snapshot) and downloads the point-in-time
 *    capture as JSON.
 * The report itself is server-rendered with real metric values; only these
 * controls are client state. The rendered-at stamp lives in the report
 * masthead (generatedAt → ReportRenderer).
 */

const BRAND_STORAGE_KEY = "atlvs.reports.brand";
const BRAND_IDS: DocBrand[] = ["atlvs", "co", "white"];

export function ReportToolbar({
  report,
  values,
  org,
  client,
  generatedAt,
}: {
  report: ReportDef;
  values: MetricValues;
  org?: OrgBrand;
  client?: ClientBrand;
  generatedAt?: string;
}) {
  const toast = useToast();
  const [brand, setBrand] = useState<DocBrand>(org?.name || client?.name ? "co" : "atlvs");
  const [saving, setSaving] = useState(false);

  // Rehydrate the persisted brand choice after mount (not in the initial
  // state — localStorage isn't available during SSR and reading it in
  // render would hydration-mismatch).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BRAND_STORAGE_KEY);
      if (stored && (BRAND_IDS as string[]).includes(stored)) setBrand(stored as DocBrand);
    } catch {
      // Storage unavailable (private mode) — keep the default.
    }
  }, []);

  function pickBrand(b: DocBrand) {
    setBrand(b);
    try {
      window.localStorage.setItem(BRAND_STORAGE_KEY, b);
    } catch {
      // Non-fatal.
    }
  }

  async function saveSnapshot() {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/reports/${encodeURIComponent(report.id)}/snapshot`);
      if (!res.ok) throw new Error(`Snapshot API responded ${res.status}`);
      const json = await res.json();
      const payload = json?.data ?? json;
      const capturedAt: string = payload?.capturedAt ?? new Date().toISOString();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${report.id}-${capturedAt.slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Snapshot saved", { description: `Captured ${capturedAt}` });
    } catch (e) {
      toast.error("Could not save snapshot", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSaving(false);
    }
  }

  const BRANDS: { id: DocBrand; label: string }[] = [
    { id: "atlvs", label: "ATLVS" },
    { id: "co", label: "Co-brand" },
    { id: "white", label: "White-label" },
  ];
  return (
    <>
      <div className="mx-auto mb-4 flex max-w-[1040px] flex-wrap items-center gap-3 print:hidden">
        <div className="inline-flex overflow-hidden rounded-md border border-[var(--p-border)]">
          {BRANDS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => pickBrand(b.id)}
              aria-pressed={brand === b.id}
              className={`px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
                brand === b.id
                  ? "bg-[var(--p-accent)] text-[var(--p-accent-contrast)]"
                  : "text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)]"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={saveSnapshot}
          disabled={saving}
          className="press-scale ml-auto rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-semibold tracking-wide hover:bg-[var(--p-surface-2)] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save snapshot"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="press-scale rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-semibold tracking-wide hover:bg-[var(--p-surface-2)]"
        >
          Print / PDF
        </button>
      </div>
      <ReportRenderer
        report={report}
        values={values}
        brand={brand}
        org={org}
        client={client}
        generatedAt={generatedAt}
      />
    </>
  );
}
