import Link from "next/link";
import { DOC_TEMPLATES_BY_APP } from "@/lib/documents/registry";
import { supportsRecordBinding } from "@/lib/documents/resolvers";
import { Badge } from "@/components/ui/Badge";

/**
 * V6 Documents hub — the cross-app document library. Every one of the 27 doc
 * types renders from the shared DocEngine (token-driven, print-ready, merge-
 * field contract). This index groups templates by the app that owns them.
 */

export const dynamic = "force-dynamic";

const APP_META: Record<string, { name: string; tagline: string }> = {
  atlvs: { name: "ATLVS", tagline: "Sales, finance & governance documents" },
  compvss: { name: "COMPVSS", tagline: "Site & venue operations documents" },
  gvteway: { name: "GVTEWAY", tagline: "Public & access documents" },
  legend: { name: "LEG3ND", tagline: "Knowledge, safety & credential documents" },
};

const APP_ORDER = ["atlvs", "compvss", "gvteway", "legend"];

export default function DocumentsHubPage() {
  const total = Object.values(DOC_TEMPLATES_BY_APP).reduce((n, list) => n + list.length, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="border-ink mb-8 border-b-3 pb-6">
        <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
          Documents
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">DOCUMENT LIBRARY</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--p-text-2)]">
          {total} canonical document types across the four apps. Every document is both the on-screen
          view and the print/PDF artifact, drives off a <code>data-path</code> merge contract, and
          white-labels through three brand modes — ATLVS, co-brand, or full white-label.
        </p>
      </header>

      <div className="flex flex-col gap-10">
        {APP_ORDER.map((app) => {
          const list = DOC_TEMPLATES_BY_APP[app] ?? [];
          if (list.length === 0) return null;
          const meta = APP_META[app] ?? { name: app, tagline: "" };
          return (
            <section key={app}>
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-xl font-semibold tracking-tight">{meta.name}</h2>
                <span className="text-sm text-[var(--p-text-3)]">{meta.tagline}</span>
                <Badge>{list.length}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((tpl) => (
                  <Link
                    key={tpl.id}
                    href={`/studio/documents/${tpl.id}`}
                    className="surface-raised hover-lift press-scale flex flex-col gap-1 rounded-lg border border-[var(--p-border)] p-4"
                  >
                    <span className="flex items-center gap-2 font-semibold tracking-tight">
                      {tpl.title}
                      {supportsRecordBinding(tpl.id) && (
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--p-accent)]"
                          title="Binds live records via ?recordId"
                          aria-label="Supports live record binding"
                        />
                      )}
                    </span>
                    <span className="font-mono text-[11px] tracking-wide text-[var(--p-text-3)] uppercase">
                      {tpl.schema}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
