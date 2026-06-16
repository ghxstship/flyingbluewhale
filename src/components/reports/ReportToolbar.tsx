"use client";

import { useState } from "react";
import { ReportRenderer } from "./ReportEngine";
import type { ReportDef, MetricValues } from "@/lib/reports/registry";
import type { DocBrand, OrgBrand, ClientBrand } from "@/components/documents/DocEngine";

/**
 * Client viewer wrapping <ReportRenderer> — the same affordances the documents
 * viewer exposes: white-label brand mode (atlvs · co · white) and Print/PDF
 * (window.print → the report's @media print path). The report itself is
 * server-rendered with real metric values; only these controls are client state.
 */
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
  const [brand, setBrand] = useState<DocBrand>(org?.name || client?.name ? "co" : "atlvs");
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
              onClick={() => setBrand(b.id)}
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
          onClick={() => window.print()}
          className="press-scale ml-auto rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-semibold tracking-wide hover:bg-[var(--p-surface-2)]"
        >
          Print / PDF
        </button>
      </div>
      <ReportRenderer report={report} values={values} brand={brand} org={org} client={client} generatedAt={generatedAt} />
    </>
  );
}
