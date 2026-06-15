/**
 * Document data contract — derived MECHANICALLY from the template registry so
 * the OpenAPI/JSON-Schema contract can never drift from what a template
 * actually renders. Every merge field in a template carries a `data-path`
 * (a dotted JSON pointer); the set of paths IS the document's data contract.
 *
 * From a DocTemplate we derive three things:
 *   - paths      — the flat list of every merge-field path it reads
 *   - sample()   — a nested example object built from the embedded sample
 *                  values (what the `value` arg to mf() carries)
 *   - jsonSchema — a JSON Schema (objects/arrays/strings) for that shape,
 *                  suitable for an OpenAPI component / 3rd-party validation
 *
 * A dotted path segment that parses as a non-negative integer denotes an
 * array index (e.g. `invoice.lines.0.desc` → invoice.lines is an array).
 */
import type { DocBlock, DocTemplate, Inline, Run } from "@/components/documents/DocEngine";

// ── path helpers (dotted; numeric segment = array index) ───────────────────

function segments(path: string): string[] {
  return path.split(".").filter((s) => s.length > 0);
}
function isIndex(seg: string): boolean {
  return /^\d+$/.test(seg);
}

/** Read a dotted path out of a nested data object; undefined if absent. */
export function getPath(data: unknown, path: string): unknown {
  let cur: unknown = data;
  for (const seg of segments(path)) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/**
 * Write a dotted path into a nested object, creating containers as needed.
 * Builds plain objects throughout (numeric segments become string keys), so a
 * namespace that mixes line-item indices with summary fields — e.g.
 * `invest.0.amount` alongside `invest.subtotal` — round-trips losslessly. The
 * array-vs-object distinction is recovered downstream in `schemaOf` (a
 * namespace whose keys are ALL numeric is an array). At render time `getPath`
 * reads either shape, so resolvers may still emit real arrays.
 */
export function setPath(root: Record<string, unknown>, path: string, value: unknown): void {
  const segs = segments(path);
  let cur: Record<string, unknown> = root;
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i]!;
    if (i === segs.length - 1) {
      cur[seg] = value;
      return;
    }
    let child = cur[seg];
    if (child == null || typeof child !== "object") {
      child = {};
      cur[seg] = child;
    }
    cur = child as Record<string, unknown>;
  }
}

// ── merge-field extraction from the template tree ──────────────────────────

function fieldsOfInline(v: Inline, out: { path: string; value: string }[]): void {
  if (typeof v !== "string") out.push({ path: v.path, value: v.value });
}
function fieldsOfRun(run: Run | undefined, out: { path: string; value: string }[]): void {
  if (run == null) return;
  if (Array.isArray(run)) run.forEach((v) => fieldsOfInline(v, out));
  else fieldsOfInline(run, out);
}

/** Every merge field a template reads, in document order (dupes possible). */
export function mergeFields(template: DocTemplate): { path: string; value: string }[] {
  const out: { path: string; value: string }[] = [];
  const block = (b: DocBlock) => {
    switch (b.kind) {
      case "cover":
        fieldsOfRun(b.title, out);
        fieldsOfRun(b.sub, out);
        b.stamps?.forEach((s) => fieldsOfRun(s.v, out));
        break;
      case "head":
        fieldsOfRun(b.docno, out);
        break;
      case "section":
        fieldsOfRun(b.heading, out);
        b.paras?.forEach((p) => fieldsOfRun(p, out));
        b.kv?.rows.forEach((r) => fieldsOfRun(r.v, out));
        b.table?.rows.forEach((r) => r.cells.forEach((c) => fieldsOfRun(c, out)));
        b.phase?.forEach((p) => fieldsOfRun(p.body, out));
        break;
      case "foot":
        fieldsOfRun(b.text, out);
        break;
      case "sign":
        break;
    }
  };
  template.blocks.forEach(block);
  return out;
}

/** Distinct merge-field paths a template reads. */
export function paths(template: DocTemplate): string[] {
  return Array.from(new Set(mergeFields(template).map((f) => f.path)));
}

/** Nested example object built from the template's embedded sample values. */
export function sample(template: DocTemplate): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const f of mergeFields(template)) setPath(root, f.path, f.value);
  return root;
}

// ── JSON Schema (derived from the assembled sample structure) ──────────────

export type JsonSchema =
  | { type: "string" }
  | { type: "array"; items: JsonSchema }
  | { type: "object"; properties: Record<string, JsonSchema> };

function schemaOf(value: unknown): JsonSchema {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    // A namespace whose keys are ALL non-negative integers is an array; its
    // item schema merges every element (homogeneous line items).
    if (entries.length > 0 && entries.every(([k]) => isIndex(k))) {
      const merged: Record<string, JsonSchema> = {};
      for (const [, el] of entries) {
        if (el && typeof el === "object") {
          for (const [k, v] of Object.entries(el)) merged[k] = schemaOf(v);
        }
      }
      const items: JsonSchema = Object.keys(merged).length
        ? { type: "object", properties: merged }
        : { type: "string" };
      return { type: "array", items };
    }
    const properties: Record<string, JsonSchema> = {};
    for (const [k, v] of entries) properties[k] = schemaOf(v);
    return { type: "object", properties };
  }
  if (Array.isArray(value)) {
    const merged: Record<string, JsonSchema> = {};
    for (const el of value) {
      if (el && typeof el === "object" && !Array.isArray(el)) {
        for (const [k, v] of Object.entries(el)) merged[k] = schemaOf(v);
      }
    }
    return { type: "array", items: Object.keys(merged).length ? { type: "object", properties: merged } : { type: "string" } };
  }
  return { type: "string" };
}

/** JSON Schema describing the data object a template fills against. */
export function jsonSchema(template: DocTemplate): JsonSchema {
  return schemaOf(sample(template));
}

/** The full machine-readable contract for one document type. */
export type DocumentContract = {
  id: string;
  title: string;
  app: DocTemplate["app"];
  schema: string;
  size: "letter" | "wide";
  paths: string[];
  sample: Record<string, unknown>;
  jsonSchema: JsonSchema;
};

export function contractOf(template: DocTemplate): DocumentContract {
  return {
    id: template.id,
    title: template.title,
    app: template.app,
    schema: template.schema,
    size: template.size ?? "letter",
    paths: paths(template),
    sample: sample(template),
    jsonSchema: jsonSchema(template),
  };
}
