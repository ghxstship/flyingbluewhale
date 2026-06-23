import type { Metadata } from "next";
import { buildOpenAPI } from "@/lib/openapi/build";
import { SITE } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";
// Side-effect import — populates the registry before we render.
import "@/lib/openapi/all-endpoints";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return {
    title: t("apiDocs.meta.title", undefined, "API Reference"),
    description: t(
      "apiDocs.meta.description",
      undefined,
      "REST + OpenAPI 3.1 documentation for the ATLVS public API. Auth via session cookie or Bearer PAT; rate limits scale with your plan tier.",
    ),
  };
}

export const dynamic = "force-static";

type Operation = {
  summary: string;
  description?: string;
  tags?: string[];
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    schema?: Record<string, unknown>;
  }>;
  requestBody?: {
    content?: { "application/json"?: { schema?: Record<string, unknown> } };
  };
  responses: Record<string, { description: string }>;
  security?: Array<Record<string, string[]>>;
  "x-min-tier"?: string;
};

type PathItem = Record<string, Operation>;

function renderSchemaSummary(schema: Record<string, unknown> | undefined): string {
  if (!schema) return "any";
  const type = schema.type as string | undefined;
  if (type === "object") {
    const props = (schema.properties as Record<string, Record<string, unknown>>) ?? {};
    const required = (schema.required as string[]) ?? [];
    const lines = Object.entries(props).map(([k, v]) => {
      const t = renderSchemaSummary(v);
      const req = required.includes(k) ? "" : "?";
      return `  ${k}${req}: ${t}`;
    });
    return `{\n${lines.join(",\n")}\n}`;
  }
  if (type === "array") {
    const items = schema.items as Record<string, unknown> | undefined;
    return `${renderSchemaSummary(items)}[]`;
  }
  if (Array.isArray(schema.enum)) {
    return (schema.enum as unknown[]).map((v) => JSON.stringify(v)).join(" | ");
  }
  if (type) {
    if (schema.format) return `${type} (${String(schema.format)})`;
    return type;
  }
  return "any";
}

const METHOD_ORDER = ["get", "post", "patch", "put", "delete"] as const;

const METHOD_COLORS: Record<string, string> = {
  get: "var(--success, #16a34a)",
  post: "var(--info, #2563eb)",
  patch: "var(--warning, #ca8a04)",
  put: "var(--warning, #ca8a04)",
  delete: "var(--danger, #dc2626)",
};

export default async function ApiDocsPage() {
  const { t } = await getRequestT();
  const doc = buildOpenAPI({
    title: "ATLVS API",
    version: "1.0.0",
    description: t("apiDocs.docDescription", undefined, "Public REST surface for ATLVS Technologies."),
    serverUrl: SITE.baseUrl,
  });

  // Group by tag for navigation.
  const byTag = new Map<string, Array<{ path: string; method: string; op: Operation }>>();
  for (const [path, item] of Object.entries(doc.paths)) {
    const pi = item as PathItem;
    for (const method of METHOD_ORDER) {
      const op = pi[method];
      if (!op) continue;
      const tag = op.tags?.[0] ?? "Other";
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag)!.push({ path, method, op });
    }
  }

  const sortedTags = [...byTag.keys()].sort();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-12">
        <p className="text-xs tracking-[0.2em] text-[var(--p-text-2)] uppercase">
          {t("apiDocs.eyebrow", undefined, "REST API · v1")}
        </p>
        <h1 className="mt-2 text-4xl font-semibold">{t("apiDocs.heading", undefined, "ATLVS API Reference")}</h1>
        <p className="mt-4 max-w-3xl text-base text-[var(--p-text-2)]">{doc.info.description}</p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a
            href="/api/v1/openapi.json"
            className="rounded-md border border-[var(--p-border)] px-3 py-2 hover:bg-[var(--p-surface-2)]"
          >
            {t("apiDocs.downloadOpenApi", undefined, "Download OpenAPI 3.1 · JSON")}
          </a>
          <a
            href="/studio/settings/api"
            className="rounded-md border border-[var(--p-border)] px-3 py-2 hover:bg-[var(--p-surface-2)]"
          >
            {t("apiDocs.manageApiKeys", undefined, "Manage API keys")}
          </a>
        </div>
      </header>

      <section className="mb-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-[var(--p-border)] p-5">
          <h2 className="text-sm tracking-wider text-[var(--p-text-2)] uppercase">
            {t("apiDocs.authentication", undefined, "Authentication")}
          </h2>
          <p className="mt-2 text-sm">
            {t("apiDocs.authBody", undefined, "Pass a personal access token in the")} <code>Authorization</code>{" "}
            {t("apiDocs.authBodyHeader", undefined, "header:")}
          </p>
          <pre className="mt-3 overflow-x-auto rounded bg-[var(--p-surface-2)] p-3 text-xs">
            {`Authorization: Bearer pat_xxxxxxxxxxxx`}
          </pre>
          <p className="mt-3 text-sm text-[var(--p-text-2)]">
            {t("apiDocs.authCookieBefore", undefined, "Or use the session cookie set by signing in at")}{" "}
            <code>/login</code>.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--p-border)] p-5">
          <h2 className="text-sm tracking-wider text-[var(--p-text-2)] uppercase">
            {t("apiDocs.rateLimits", undefined, "Rate limits")}
          </h2>
          <p className="mt-2 text-sm">
            {t("apiDocs.rateLimitsBody", undefined, "Limits scale with your org plan. Every response includes:")}
          </p>
          <ul className="mt-2 list-disc ps-5 text-sm text-[var(--p-text-2)]">
            <li>
              <code>RateLimit-Limit</code>
            </li>
            <li>
              <code>RateLimit-Remaining</code>
            </li>
            <li>
              <code>RateLimit-Reset</code>
            </li>
            <li>
              <code>Retry-After</code> — {t("apiDocs.retryAfterNote", undefined, "only on 429")}
            </li>
          </ul>
        </div>
      </section>

      <nav className="mb-12 rounded-lg border border-[var(--p-border)] p-5">
        <h2 className="mb-3 text-sm tracking-wider text-[var(--p-text-2)] uppercase">
          {t("apiDocs.resources", undefined, "Resources")}
        </h2>
        <ul className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
          {sortedTags.map((tag) => (
            <li key={tag}>
              <a href={`#${tag.toLowerCase()}`} className="hover:underline">
                {tag}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {sortedTags.map((tag) => (
        <section key={tag} id={tag.toLowerCase()} className="mb-16">
          <h2 className="mb-6 border-b border-[var(--p-border)] pb-2 text-2xl font-semibold">{tag}</h2>
          {byTag.get(tag)!.map(({ path, method, op }) => (
            <article key={`${method}-${path}`} className="mb-6 rounded-lg border border-[var(--p-border)] p-5">
              <header className="mb-3 flex flex-wrap items-baseline gap-3">
                <span
                  className="rounded px-2 py-0.5 font-mono text-xs font-bold text-white uppercase"
                  style={{ backgroundColor: METHOD_COLORS[method] ?? "var(--p-text-2)" }}
                >
                  {method}
                </span>
                <code className="text-sm font-semibold">{path}</code>
                {op["x-min-tier"] && (
                  <span className="rounded border border-[var(--p-border)] px-2 py-0.5 text-xs text-[var(--p-text-2)] uppercase">
                    {op["x-min-tier"]}+
                  </span>
                )}
              </header>
              <h3 className="mb-1 text-base font-medium">{op.summary}</h3>
              {op.description && <p className="mb-3 text-sm text-[var(--p-text-2)]">{op.description}</p>}

              {op.parameters && op.parameters.length > 0 && (
                <div className="mb-3">
                  <h4 className="mb-1 text-xs font-semibold text-[var(--p-text-2)] uppercase">
                    {t("apiDocs.parameters", undefined, "Parameters")}
                  </h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-start text-xs text-[var(--p-text-2)] uppercase">
                        <th className="pb-1">{t("apiDocs.paramName", undefined, "Name")}</th>
                        <th className="pb-1">{t("apiDocs.paramIn", undefined, "In")}</th>
                        <th className="pb-1">{t("apiDocs.paramType", undefined, "Type")}</th>
                        <th className="pb-1">{t("apiDocs.paramRequired", undefined, "Required")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {op.parameters.map((p) => (
                        <tr key={`${p.in}-${p.name}`} className="border-t border-[var(--p-border)]">
                          <td className="py-1 font-mono">{p.name}</td>
                          <td className="py-1">{p.in}</td>
                          <td className="py-1 font-mono text-xs">{renderSchemaSummary(p.schema)}</td>
                          <td className="py-1">
                            {p.required ? t("apiDocs.yes", undefined, "yes") : t("apiDocs.no", undefined, "no")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {op.requestBody?.content?.["application/json"]?.schema && (
                <div className="mb-3">
                  <h4 className="mb-1 text-xs font-semibold text-[var(--p-text-2)] uppercase">
                    {t("apiDocs.requestBody", undefined, "Request body")}
                  </h4>
                  <pre className="overflow-x-auto rounded bg-[var(--p-surface-2)] p-3 text-xs">
                    {renderSchemaSummary(op.requestBody.content["application/json"].schema)}
                  </pre>
                </div>
              )}

              <div>
                <h4 className="mb-1 text-xs font-semibold text-[var(--p-text-2)] uppercase">
                  {t("apiDocs.responses", undefined, "Responses")}
                </h4>
                <ul className="text-sm">
                  {Object.entries(op.responses).map(([status, r]) => (
                    <li key={status} className="border-t border-[var(--p-border)] py-1">
                      <span className="font-mono">{status}</span>
                      <span className="ms-3 text-[var(--p-text-2)]">{r.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>
      ))}

      <footer className="mt-16 border-t border-[var(--p-border)] pt-6 text-xs text-[var(--p-text-2)]">
        <p>
          {t(
            "apiDocs.footer",
            { count: Object.keys(doc.paths).length },
            "OpenAPI 3.1 · {count} paths · Generated at request time from registered Zod schemas.",
          )}
        </p>
      </footer>
    </main>
  );
}
