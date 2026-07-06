/**
 * Server-side HTML string renderer for documents — the API generation path.
 *
 * Next forbids `react-dom/server` in app code, and route handlers return a
 * Response (not JSX), so the public generation endpoint can't reuse the React
 * <DocRenderer>. This renderer emits the IDENTICAL `.doc-stage`/`.doc`/`.mf`
 * markup + `data-*` contract, so the output styles cleanly with the published
 * `kit-documents.css` and carries the same `data-path` merge contract. The
 * React engine (interactive console) and this string renderer share the
 * registry, the contract, and the resolve semantics; `render-html.test.ts`
 * pins them to the same data-doc/data-path output.
 */
import type { DocBlock, DocTemplate, DocBrand, OrgBrand, ClientBrand, Run, Inline } from "@/components/documents/DocEngine";
import { getPath } from "./contract";

type Resolve = (path: string, fallback: string) => string;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inlineHtml(v: Inline, resolve: Resolve): string {
  if (typeof v === "string") return esc(v);
  const value = resolve(v.path, v.value);
  const cls = v.plain ? "mf mf--plain" : "mf";
  return `<span class="${cls}" data-path="${esc(v.path)}">${esc(value)}</span>`;
}
function runHtml(run: Run | undefined, resolve: Resolve): string {
  if (run == null) return "";
  if (Array.isArray(run)) return run.map((v) => `<span>${inlineHtml(v, resolve)}</span>`).join("");
  return inlineHtml(run, resolve);
}

function brandStyle(org?: OrgBrand, client?: ClientBrand): string {
  const s: string[] = [];
  if (org?.name) s.push(`--ob-name:"${org.name.replace(/"/g, "")}"`);
  if (org?.accent) s.push(`--ob-accent:${org.accent}`);
  if (org?.accentText) s.push(`--ob-accent-text:${org.accentText}`);
  if (org?.logo) s.push(`--ob-logo:url(${org.logo})`);
  if (client?.name) s.push(`--cl-name:"${client.name.replace(/"/g, "")}"`);
  if (client?.logo) s.push(`--cl-logo:url(${client.logo})`);
  return s.join(";");
}

const MK = `<span class="mk"><img src="/brand/atlvs-mark-white.svg" alt="" width="19" height="19" aria-hidden="true"/></span>`;

function blockHtml(b: DocBlock, resolve: Resolve): string {
  switch (b.kind) {
    case "cover": {
      const stamps = b.stamps?.length
        ? `<div class="stamp">${b.stamps
            .map(
              (s) =>
                `<div><div class="k">${esc(s.k)}</div><div class="${s.mono ? "v mono" : "v"}">${runHtml(s.v, resolve)}</div></div>`,
            )
            .join("")}</div>`
        : "";
      return `<div class="${b.accent ? "doc-cover doc-cover--accent" : "doc-cover"}"><div class="brandrow">${MK}<span class="wm doc-wm"></span><span class="doc-clientmark"></span></div><p class="doctype">${esc(b.doctype)}</p><h1>${runHtml(b.title, resolve)}</h1>${b.sub ? `<p class="sub">${runHtml(b.sub, resolve)}</p>` : ""}${stamps}</div>`;
    }
    case "head":
      return `<div class="doc-head"><div class="brandrow">${MK}<span class="doc-brandname"></span></div><div><div class="doctype">${esc(b.doctype)}</div><div class="docno">${runHtml(b.docno, resolve)}</div></div></div>`;
    case "section": {
      const eb = b.eyebrow ? `<p class="doc-eb">${esc(b.eyebrow)}</p>` : "";
      const h = b.heading ? `<h2>${runHtml(b.heading, resolve)}</h2>` : "";
      const paras = (b.paras ?? []).map((p) => `<p>${runHtml(p, resolve)}</p>`).join("");
      const kv = b.kv
        ? `<div class="doc-kv"${b.kv.cols ? ` style="--cols:${b.kv.cols}"` : ""}>${b.kv.rows
            .map((r) => `<div class="row"><span class="k">${esc(r.k)}</span><span class="v">${runHtml(r.v, resolve)}</span></div>`)
            .join("")}</div>`
        : "";
      const table = b.table ? tableHtml(b.table, resolve) : "";
      const phase = (b.phase ?? [])
        .map(
          (p) =>
            `<div class="doc-phase"><div class="n">${esc(p.n)}</div><div><h4>${esc(p.title)}</h4><p>${runHtml(p.body, resolve)}</p></div></div>`,
        )
        .join("");
      return `<div class="${b.ink ? "doc-sec doc-sec--ink" : "doc-sec"}">${eb}${h}${paras}${kv}${table}${phase}</div>`;
    }
    case "sign":
      return `<div class="doc-sign"><div class="row">${b.rows.map((r) => `<div class="doc-sigline">${esc(r.label)}</div>`).join("")}</div></div>`;
    case "foot":
      return `<div class="doc-foot">${runHtml(b.text, resolve)} <span class="doc-attrib"></span></div>`;
  }
}

function tableHtml(spec: NonNullable<Extract<DocBlock, { kind: "section" }>["table"]>, resolve: Resolve): string {
  const head = spec.cols.map((c) => `<th${c.align === "r" ? ' class="r"' : ""}>${esc(c.label)}</th>`).join("");
  const body = spec.rows
    .map(
      (r) =>
        `<tr${r.variant ? ` class="${r.variant}"` : ""}>${r.cells
          .map((cell, j) => `<td${spec.cols[j]?.align === "r" ? ' class="r"' : ""}>${runHtml(cell, resolve)}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  return `<table class="doc-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export type RenderHtmlOpts = {
  brand?: DocBrand;
  org?: OrgBrand;
  client?: ClientBrand;
  showMergeFields?: boolean;
  data?: Record<string, unknown>;
};

/** Render a template (optionally bound to data) to the `.doc-stage` HTML string. */
export function renderDocHtml(template: DocTemplate, opts: RenderHtmlOpts = {}): string {
  const { brand = "atlvs", org, client, showMergeFields = false, data } = opts;
  const resolve: Resolve = data
    ? (path, fallback) => {
        const v = getPath(data, path);
        if (v == null) return fallback;
        const s = typeof v === "string" ? v : String(v);
        return s.length > 0 ? s : fallback;
      }
    : (_path, fallback) => fallback;

  const product = template.app;
  const type = template.app === "legend" ? "legend" : "monument";
  const style = brandStyle(org, client);
  const docAttrs = [
    `class="${template.size === "wide" ? "doc doc--wide" : "doc doc--letter"}"`,
    `data-doc="${esc(template.schema)}"`,
    `data-brand="${brand}"`,
    `data-client="${client?.name ? "on" : "off"}"`,
    `data-mf="${showMergeFields ? "on" : "off"}"`,
    style ? `style="${esc(style)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const body = template.blocks.map((b) => blockHtml(b, resolve)).join("");
  return `<div class="doc-stage" data-ui="saas" data-product="${product}" data-type="${type}"><div ${docAttrs}>${body}</div></div>`;
}
