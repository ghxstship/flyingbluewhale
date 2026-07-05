import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { getRequestT } from "@/lib/i18n/request";
import { DOC_TEMPLATES, getDocTemplate } from "@/lib/documents/registry";
import { contractOf, paths, sample } from "@/lib/documents/contract";

export const dynamic = "force-dynamic";

/**
 * Schema Builder (kit 21 remediation R1, ADR-0015; Airtable/Retool canon) — a
 * READ surface over the documents SSOT. The registry + contract.ts already
 * DERIVE each doc type's JSON Schema, merge paths, and sample; this renders
 * them alongside a generated create-form preview so an integrator sees exactly
 * the shape a POST /api/v1/documents/{docType} expects. No data is authored —
 * the registry is the source of truth.
 */
export default async function SchemaBuilderPage({ searchParams }: { searchParams: Promise<{ doc?: string }> }) {
  const { t } = await getRequestT();
  const sp = await searchParams;
  const selected = (sp?.doc && getDocTemplate(sp.doc)) || DOC_TEMPLATES[0]!;
  const contract = contractOf(selected);
  const fieldPaths = paths(selected);
  const sampleData = sample(selected);

  // Map a dotted path to a leaf sample value so the preview can pick an input
  // kind (a numeric-looking string → number, an ISO date → date, else text).
  const leafOf = (path: string): unknown =>
    path.split(".").reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
      return undefined;
    }, sampleData);

  const inputKind = (v: unknown): "date" | "number" | "text" => {
    if (typeof v === "number") return "number";
    if (typeof v === "string") {
      if (/^\d{4}-\d{2}-\d{2}/.test(v)) return "date";
      if (/^-?\d+(\.\d+)?$/.test(v)) return "number";
    }
    return "text";
  };

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.eyebrow", undefined, "Settings")}
        title={t("console.settings.schema.title", undefined, "Schema Builder")}
        info={t(
          "console.settings.schema.info",
          undefined,
          "The derived JSON Schema + generated create form for every document type. Read-only — the documents registry is the source of truth.",
        )}
        breadcrumbs={[
          { label: t("console.settings.eyebrow", undefined, "Settings"), href: "/studio/settings" },
          { label: t("console.settings.schema.title", undefined, "Schema Builder") },
        ]}
      />
      <div className="page-content grid grid-cols-1 gap-4 lg:grid-cols-[minmax(14rem,18rem)_1fr]">
        {/* Doc-type rail */}
        <ul className="space-y-1 lg:max-h-[72vh] lg:overflow-y-auto lg:pr-1">
          {DOC_TEMPLATES.map((tpl) => (
            <li key={tpl.id}>
              <Link
                href={`/studio/settings/schema?doc=${tpl.id}`}
                aria-current={tpl.id === selected.id ? "page" : undefined}
                className={`flex items-center justify-between gap-2 rounded-[var(--p-r-md)] border px-3 py-2 text-sm ${
                  tpl.id === selected.id
                    ? "border-[var(--p-accent)] bg-[var(--p-surface)]"
                    : "border-[var(--p-border)] hover:bg-[var(--p-surface)]"
                }`}
              >
                <span className="truncate">{tpl.title}</span>
                <Badge variant="muted">{tpl.app}</Badge>
              </Link>
            </li>
          ))}
        </ul>

        <div className="min-w-0 space-y-4">
          {/* Contract summary */}
          <div className="surface p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">{contract.title}</h2>
              <Badge variant="muted">{contract.app}</Badge>
              <span className="font-mono text-xs text-[var(--p-text-3)]">
                {t("console.settings.schema.fieldCount", { count: fieldPaths.length }, `${fieldPaths.length} fields`)}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--p-text-2)]">
              {t(
                "console.settings.schema.apiHint",
                { doc: contract.id },
                `POST /api/v1/documents/${contract.id} with { data } matching this shape.`,
              )}
            </p>
          </div>

          {/* Generated create form preview */}
          <div className="surface p-5">
            <h3 className="mb-3 text-sm font-semibold">
              {t("console.settings.schema.generatedForm", undefined, "Generated Create Form")}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fieldPaths.map((path) => {
                const kind = inputKind(leafOf(path));
                return (
                  <label key={path} className="block text-xs font-medium">
                    <span className="mb-1 block font-mono text-[10px] text-[var(--p-text-3)]">{path}</span>
                    <input type={kind} disabled placeholder={kind} className="ps-input w-full opacity-70" />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Raw JSON Schema */}
          <div className="surface p-5">
            <h3 className="mb-3 text-sm font-semibold">
              {t("console.settings.schema.jsonSchema", undefined, "JSON Schema")}
            </h3>
            <pre className="max-h-96 overflow-auto rounded bg-[var(--p-bg)] p-3 font-mono text-[10px] text-[var(--p-text-2)]">
              {JSON.stringify(contract.jsonSchema, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}
