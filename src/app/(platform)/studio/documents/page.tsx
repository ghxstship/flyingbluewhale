import Link from "next/link";
import { DOC_TEMPLATES_BY_APP } from "@/lib/documents/registry";
import { supportsRecordBinding } from "@/lib/documents/resolvers";
import { Badge } from "@/components/ui/Badge";
import { getRequestT } from "@/lib/i18n/request";

/**
 * V6 Documents hub — the cross-app document library. Every one of the 29 doc
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

export default async function DocumentsHubPage() {
  const { t } = await getRequestT();
  const total = Object.values(DOC_TEMPLATES_BY_APP).reduce((n, list) => n + list.length, 0);
  // Literal keys per app — the extractor needs plain string keys, never
  // template-literal composition.
  const taglines: Record<string, string> = {
    atlvs: t("console.documents.hub.taglines.atlvs", undefined, "Sales, finance & governance documents"),
    compvss: t("console.documents.hub.taglines.compvss", undefined, "Site & venue operations documents"),
    gvteway: t("console.documents.hub.taglines.gvteway", undefined, "Public & access documents"),
    legend: t("console.documents.hub.taglines.legend", undefined, "Knowledge, safety & credential documents"),
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="border-ink mb-8 border-b-3 pb-6">
        <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
          {t("console.documents.hub.eyebrow", undefined, "Documents")}
        </div>
        <h1 className="mt-2">{t("console.documents.hub.title", undefined, "DOCUMENT LIBRARY")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--p-text-2)]">
          {t(
            "console.documents.hub.intro",
            { total },
            `${total} canonical document types across the four apps. Every document is both the on-screen view and the print/PDF artifact, drives off a `,
          )}
          <code>data-path</code>
          {t(
            "console.documents.hub.introTail",
            undefined,
            " merge contract, and white-labels through three brand modes: ATLVS, co-brand, or full white-label.",
          )}
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
                <h2>{meta.name}</h2>
                <span className="text-sm text-[var(--p-text-3)]">{taglines[app] ?? meta.tagline}</span>
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
                        <Badge
                          variant="brand"
                          aria-label={t(
                            "console.documents.hub.recordBackedAria",
                            undefined,
                            "Binds live org records via the record picker or ?recordId",
                          )}
                        >
                          {t("console.documents.hub.recordBacked", undefined, "Record-backed")}
                        </Badge>
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
