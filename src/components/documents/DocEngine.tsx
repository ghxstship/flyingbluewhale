/**
 * V6 Documents engine — server-rendered, token-driven document primitives that
 * consume `kit-documents.css` (the SSOT format layer). Every document is BOTH
 * the on-screen view and the print/PDF artifact (@media print in the CSS).
 *
 * Data contract: every merge field renders `<span class="mf" data-path="...">`
 * (a JSON pointer into the doc's data object → 1:1 with an OpenAPI schema), so
 * documents are self-contained yet drivable by the record store or a 3rd-party
 * integration. White-label: the <Doc> wrapper carries `data-brand`
 * (atlvs|co|white) + `data-client` and sets the org/client `--ob-*`/`--cl-*`
 * brand vars inline, so one override reskins the whole document.
 */
import type { CSSProperties, ReactNode } from "react";

// ── data-contract: an inline value is plain text OR a merge field ──────────
export type Inline = string | { path: string; value: string; plain?: boolean };
// a run is a single inline OR an ordered sequence of inlines (mixed copy + fields)
export type Run = Inline | Inline[];

export function MergeField({ path, value, plain }: { path: string; value: string; plain?: boolean }) {
  return (
    <span className={plain ? "mf mf--plain" : "mf"} data-path={path}>
      {value}
    </span>
  );
}

function renderInline(v: Inline, key?: number): ReactNode {
  if (typeof v === "string") return v;
  return <MergeField key={key} path={v.path} value={v.value} plain={v.plain} />;
}
// render a run: a bare inline, or a sequence stitched together in document order
function renderRun(run: Run): ReactNode {
  if (Array.isArray(run)) return run.map((v, i) => <span key={i}>{renderInline(v, i)}</span>);
  return renderInline(run);
}
function renderInlines(vs: Inline[]): ReactNode {
  return vs.map((v, i) => <span key={i}>{renderInline(v, i)} </span>);
}

// ── brand model ────────────────────────────────────────────────────────────
export type DocBrand = "atlvs" | "co" | "white";
export type OrgBrand = { name?: string; accent?: string; accentText?: string; logo?: string };
export type ClientBrand = { name?: string; logo?: string };

function brandVars(org?: OrgBrand, client?: ClientBrand): CSSProperties {
  const s: Record<string, string> = {};
  if (org?.name) s["--ob-name"] = `"${org.name.replace(/"/g, "")}"`;
  if (org?.accent) s["--ob-accent"] = org.accent;
  if (org?.accentText) s["--ob-accent-text"] = org.accentText;
  if (org?.logo) s["--ob-logo"] = `url(${org.logo})`;
  if (client?.name) s["--cl-name"] = `"${client.name.replace(/"/g, "")}"`;
  if (client?.logo) s["--cl-logo"] = `url(${client.logo})`;
  return s as CSSProperties;
}

// ── block descriptors (one doc = ordered blocks) ───────────────────────────
export type DocBlock =
  | { kind: "cover"; accent?: boolean; doctype: string; title: Run; sub?: Run; stamps?: { k: string; v: Run; mono?: boolean }[] }
  | { kind: "head"; doctype: string; docno: Run }
  | {
      kind: "section";
      ink?: boolean;
      eyebrow?: string;
      heading?: Run;
      paras?: Run[];
      kv?: { cols?: number; rows: { k: string; v: Run }[] };
      table?: DocTableSpec;
      phase?: { n: string; title: string; body: Run }[];
    }
  | { kind: "sign"; rows: { label: string }[] }
  | { kind: "foot"; text: Run };

export type DocTableSpec = {
  cols: { label: string; align?: "r" }[];
  rows: { cells: Run[]; variant?: "sub" | "total" }[];
};

function DocTable({ spec }: { spec: DocTableSpec }) {
  return (
    <table className="doc-table">
      <thead>
        <tr>
          {spec.cols.map((c, i) => (
            <th key={i} className={c.align === "r" ? "r" : undefined}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {spec.rows.map((r, i) => (
          <tr key={i} className={r.variant}>
            {r.cells.map((cell, j) => (
              <td key={j} className={spec.cols[j]?.align === "r" ? "r" : undefined}>
                {renderRun(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Block({ block }: { block: DocBlock }) {
  switch (block.kind) {
    case "cover":
      return (
        <div className={block.accent ? "doc-cover doc-cover--accent" : "doc-cover"}>
          <div className="brandrow">
            <span className="mk">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/atlvs-mark-white.svg" alt="" width={19} height={19} aria-hidden="true" />
            </span>
            <span className="wm doc-wm">A T L V S</span>
            <span className="doc-clientmark" />
          </div>
          <p className="doctype">{block.doctype}</p>
          <h1>{renderRun(block.title)}</h1>
          {block.sub && <p className="sub">{renderRun(block.sub)}</p>}
          {block.stamps && block.stamps.length > 0 && (
            <div className="stamp">
              {block.stamps.map((s, i) => (
                <div key={i}>
                  <div className="k">{s.k}</div>
                  <div className={s.mono ? "v mono" : "v"}>{renderRun(s.v)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    case "head":
      return (
        <div className="doc-head">
          <div className="brandrow">
            <span className="mk">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/atlvs-mark-white.svg" alt="" width={19} height={19} aria-hidden="true" />
            </span>
            <span className="doc-brandname" />
          </div>
          <div>
            <div className="doctype">{block.doctype}</div>
            <div className="docno">{renderRun(block.docno)}</div>
          </div>
        </div>
      );
    case "section":
      return (
        <div className={block.ink ? "doc-sec doc-sec--ink" : "doc-sec"}>
          {block.eyebrow && <p className="doc-eb">{block.eyebrow}</p>}
          {block.heading && <h2>{renderRun(block.heading)}</h2>}
          {block.paras?.map((p, i) => <p key={i}>{renderRun(p)}</p>)}
          {block.kv && (
            <div className="doc-kv" style={block.kv.cols ? ({ "--cols": String(block.kv.cols) } as CSSProperties) : undefined}>
              {block.kv.rows.map((r, i) => (
                <div key={i} className="row">
                  <span className="k">{r.k}</span>
                  <span className="v">{renderRun(r.v)}</span>
                </div>
              ))}
            </div>
          )}
          {block.table && <DocTable spec={block.table} />}
          {block.phase?.map((p, i) => (
            <div key={i} className="doc-phase">
              <div className="n">{p.n}</div>
              <div>
                <h4>{p.title}</h4>
                <p>{renderRun(p.body)}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case "sign":
      return (
        <div className="doc-sign">
          <div className="row">
            {block.rows.map((r, i) => (
              <div key={i} className="doc-sigline">
                {r.label}
              </div>
            ))}
          </div>
        </div>
      );
    case "foot":
      return (
        <div className="doc-foot">
          {renderRun(block.text)} <span className="doc-attrib" />
        </div>
      );
  }
}

// ── the document wrapper + renderer ────────────────────────────────────────
export type DocTemplate = {
  id: string;
  title: string;
  app: "atlvs" | "compvss" | "gvteway" | "legend";
  schema: string; // data-doc / OpenAPI component name
  size?: "letter" | "wide";
  blocks: DocBlock[];
};

export function DocRenderer({
  template,
  brand = "atlvs",
  org,
  client,
  showMergeFields = true,
  note,
}: {
  template: DocTemplate;
  brand?: DocBrand;
  org?: OrgBrand;
  client?: ClientBrand;
  showMergeFields?: boolean;
  note?: ReactNode;
}) {
  const product = template.app === "legend" ? "legend" : template.app;
  return (
    <div className="doc-stage" data-ui="saas" data-product={product} data-type={template.app === "legend" ? "legend" : "monument"}>
      {note && <div className="doc-note">{note}</div>}
      <div
        className={template.size === "wide" ? "doc doc--wide" : "doc doc--letter"}
        data-doc={template.schema}
        data-brand={brand}
        data-client={client?.name ? "on" : "off"}
        data-mf={showMergeFields ? "on" : "off"}
        style={brandVars(org, client)}
      >
        {template.blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </div>
    </div>
  );
}

export { renderInlines };
