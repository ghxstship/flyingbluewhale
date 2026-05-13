import type { Metadata } from "next";
import { buildOpenAPI } from "@/lib/openapi/build";
import { SITE } from "@/lib/seo";
// Side-effect import — populates the registry before we render.
import "@/lib/openapi/all-endpoints";

export const metadata: Metadata = {
  title: "API Reference",
  description:
    "REST + OpenAPI 3.1 documentation for the ATLVS public API. Auth via session cookie or Bearer PAT; rate limits scale with your plan tier.",
};

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

export default function ApiDocsPage() {
  const doc = buildOpenAPI({
    title: "ATLVS API",
    version: "1.0.0",
    description: "Public REST surface for ATLVS Technologies.",
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
        <p className="text-xs tracking-[0.2em] text-[var(--text-secondary)] uppercase">REST API · v1</p>
        <h1 className="mt-2 text-4xl font-semibold">ATLVS API Reference</h1>
        <p className="mt-4 max-w-3xl text-base text-[var(--text-secondary)]">{doc.info.description}</p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a
            href="/api/v1/openapi.json"
            className="rounded-md border border-[var(--border)] px-3 py-2 hover:bg-[var(--surface-inset)]"
          >
            Download OpenAPI 3.1 (JSON)
          </a>
          <a
            href="/me/api-keys"
            className="rounded-md border border-[var(--border)] px-3 py-2 hover:bg-[var(--surface-inset)]"
          >
            Manage API keys
          </a>
        </div>
      </header>

      <section className="mb-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] p-5">
          <h2 className="text-sm tracking-wider text-[var(--text-secondary)] uppercase">Authentication</h2>
          <p className="mt-2 text-sm">
            Pass a personal access token in the <code>Authorization</code> header:
          </p>
          <pre className="mt-3 overflow-x-auto rounded bg-[var(--surface-inset)] p-3 text-xs">
            {`Authorization: Bearer pat_xxxxxxxxxxxx`}
          </pre>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Or use the session cookie set by signing in at <code>/login</code>.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-5">
          <h2 className="text-sm tracking-wider text-[var(--text-secondary)] uppercase">Rate limits</h2>
          <p className="mt-2 text-sm">Limits scale with your org plan. Every response includes:</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-[var(--text-secondary)]">
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
              <code>Retry-After</code> (only on 429)
            </li>
          </ul>
        </div>
      </section>

      <nav className="mb-12 rounded-lg border border-[var(--border)] p-5">
        <h2 className="mb-3 text-sm tracking-wider text-[var(--text-secondary)] uppercase">Resources</h2>
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
          <h2 className="mb-6 border-b border-[var(--border)] pb-2 text-2xl font-semibold">{tag}</h2>
          {byTag.get(tag)!.map(({ path, method, op }) => (
            <article key={`${method}-${path}`} className="mb-6 rounded-lg border border-[var(--border)] p-5">
              <header className="mb-3 flex flex-wrap items-baseline gap-3">
                <span
                  className="rounded px-2 py-0.5 font-mono text-xs font-bold text-white uppercase"
                  style={{ backgroundColor: METHOD_COLORS[method] ?? "var(--text-secondary)" }}
                >
                  {method}
                </span>
                <code className="text-sm font-semibold">{path}</code>
                {op["x-min-tier"] && (
                  <span className="rounded border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-secondary)] uppercase">
                    {op["x-min-tier"]}+
                  </span>
                )}
              </header>
              <h3 className="mb-1 text-base font-medium">{op.summary}</h3>
              {op.description && <p className="mb-3 text-sm text-[var(--text-secondary)]">{op.description}</p>}

              {op.parameters && op.parameters.length > 0 && (
                <div className="mb-3">
                  <h4 className="mb-1 text-xs font-semibold text-[var(--text-secondary)] uppercase">Parameters</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-[var(--text-secondary)] uppercase">
                        <th className="pb-1">Name</th>
                        <th className="pb-1">In</th>
                        <th className="pb-1">Type</th>
                        <th className="pb-1">Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {op.parameters.map((p) => (
                        <tr key={`${p.in}-${p.name}`} className="border-t border-[var(--border)]">
                          <td className="py-1 font-mono">{p.name}</td>
                          <td className="py-1">{p.in}</td>
                          <td className="py-1 font-mono text-xs">{renderSchemaSummary(p.schema)}</td>
                          <td className="py-1">{p.required ? "yes" : "no"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {op.requestBody?.content?.["application/json"]?.schema && (
                <div className="mb-3">
                  <h4 className="mb-1 text-xs font-semibold text-[var(--text-secondary)] uppercase">Request body</h4>
                  <pre className="overflow-x-auto rounded bg-[var(--surface-inset)] p-3 text-xs">
                    {renderSchemaSummary(op.requestBody.content["application/json"].schema)}
                  </pre>
                </div>
              )}

              <div>
                <h4 className="mb-1 text-xs font-semibold text-[var(--text-secondary)] uppercase">Responses</h4>
                <ul className="text-sm">
                  {Object.entries(op.responses).map(([status, r]) => (
                    <li key={status} className="border-t border-[var(--border)] py-1">
                      <span className="font-mono">{status}</span>
                      <span className="ml-3 text-[var(--text-secondary)]">{r.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>
      ))}

      <footer className="mt-16 border-t border-[var(--border)] pt-6 text-xs text-[var(--text-secondary)]">
        <p>
          OpenAPI 3.1 · {Object.keys(doc.paths).length} paths · Generated at request time from registered Zod schemas.
        </p>
      </footer>
    </main>
  );
}
