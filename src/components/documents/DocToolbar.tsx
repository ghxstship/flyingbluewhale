"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
  data: initialData,
  aiDraftEndpoint,
}: {
  template: DocTemplate;
  org?: OrgBrand;
  client?: ClientBrand;
  /** Bound record data, keyed by the template's merge-field paths. */
  data?: Record<string, unknown>;
  /** If set, shows an "Draft with AI" button that POSTs to this URL. */
  aiDraftEndpoint?: string;
}) {
  const [data, setData] = useState<Record<string, unknown> | undefined>(initialData);
  const bound = data != null;
  const [brand, setBrand] = useState<DocBrand>(bound && (org?.name || client?.name) ? "co" : "atlvs");
  // Real records render clean (no highlight); the sample showcase highlights
  // the merge contract by default.
  const [showMergeFields, setShowMergeFields] = useState(!bound);
  const [aiPending, startAi] = useTransition();

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

        {aiDraftEndpoint && (
          <button
            type="button"
            disabled={aiPending}
            onClick={() =>
              startAi(async () => {
                const res = await fetch(aiDraftEndpoint, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({}),
                });
                const json = (await res.json()) as {
                  ok: boolean;
                  draft?: Record<string, unknown>;
                  error?: { message: string };
                };
                if (!json.ok || !json.draft) {
                  toast.error(json.error?.message ?? "AI draft failed — please retry");
                  return;
                }
                setData(json.draft as Record<string, unknown>);
                setShowMergeFields(false);
                toast.success("AI draft applied — review and print");
              })
            }
            className="press-scale rounded-md border border-[var(--p-accent)] px-3 py-1.5 text-xs font-semibold tracking-wide text-[var(--p-accent-text)] hover:bg-[var(--p-accent-subtle)]"
          >
            {aiPending ? "Drafting…" : "✦ Draft with AI"}
          </button>
        )}

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
        data={data ?? initialData}
        note={
          bound ? (
            <>
              Bound to a live record — <b>{template.title}</b>. Empty fields fall back to sample
              copy. Print / PDF renders the same file as the print artifact.
            </>
          ) : (
            <>
              Sample preview — <b>{template.title}</b>. Toggle brand mode and merge-field highlighting
              above; Print / PDF renders the same file as the print artifact.
            </>
          )
        }
      />
    </>
  );
}
