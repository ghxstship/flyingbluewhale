"use client";

import { useState } from "react";
import { DocRenderer, type DocTemplate, type DocBrand, type OrgBrand, type ClientBrand } from "./DocEngine";

/**
 * Client toolbar wrapping a <DocRenderer>. Controls the three live document
 * affordances the v6 kit exposes: print/PDF export (window.print → @media print
 * in kit-documents.css), the merge-field highlight toggle, and the white-label
 * brand mode (atlvs · co · white). The document itself stays server-renderable;
 * only these viewer controls are client state.
 */
export function DocToolbar({
  template,
  org,
  client,
  data,
  defaultBrand,
}: {
  template: DocTemplate;
  org?: OrgBrand;
  client?: ClientBrand;
  /** Bound record data, keyed by the template's merge-field paths. */
  data?: Record<string, unknown>;
  /**
   * Org-configured default brand mode for this doc type
   * (org_doc_template_settings.default_brand, Configurator v1). Overrides the
   * viewer heuristic when set; the toggle stays fully interactive.
   */
  defaultBrand?: DocBrand | null;
}) {
  const bound = data != null;
  const [brand, setBrand] = useState<DocBrand>(
    defaultBrand ?? (bound && (org?.name || client?.name) ? "co" : "atlvs"),
  );
  // Real records render clean (no highlight); the sample showcase highlights
  // the merge contract by default.
  const [showMergeFields, setShowMergeFields] = useState(!bound);

  const BRANDS: { id: DocBrand; label: string }[] = [
    { id: "atlvs", label: "ATLVS" },
    { id: "co", label: "Co-brand" },
    { id: "white", label: "White-label" },
  ];

  return (
    <>
      <div className="doc-toolbar mx-auto mb-4 flex max-w-[860px] flex-wrap items-center gap-3 print:hidden">
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

        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--p-text-2)]">
          <input
            type="checkbox"
            checked={showMergeFields}
            onChange={(e) => setShowMergeFields(e.target.checked)}
          />
          Highlight merge fields
        </label>

        <button
          type="button"
          onClick={() => window.print()}
          className="press-scale ml-auto rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-semibold tracking-wide hover:bg-[var(--p-surface-2)]"
        >
          Print / PDF
        </button>
      </div>

      <DocRenderer
        template={template}
        brand={brand}
        org={org}
        client={client}
        showMergeFields={showMergeFields}
        data={data}
        note={
          bound ? (
            <>
              Bound to a live record: <b>{template.title}</b>. Empty fields fall back to sample
              copy. Print / PDF renders the same file as the print artifact.
            </>
          ) : (
            <>
              Sample preview: <b>{template.title}</b>. Toggle brand mode and merge-field highlighting
              above; Print / PDF renders the same file as the print artifact.
            </>
          )
        }
      />
    </>
  );
}
