#!/usr/bin/env node
/**
 * Codemod v3 — close out the residual 28 composite-render columns.
 *
 * Tactics:
 *   • For composites where every field reference shares a common semantic
 *     family (date/window: starts_on + ends_on → sort by starts_on; pair:
 *     rooms_confirmed + rooms_reserved → sort by rooms_confirmed; period:
 *     period_start + period_end → sort by period_start), pick the canonical
 *     "leading" field as the accessor.
 *   • For nullish chains like `r.foo?.name ?? r.foo?.email ?? "—"`, infer
 *     accessor as the same chain returning null.
 *   • For optional-chain joins like `r.venue?.name ?? r.project?.name`,
 *     accessor returns the same expression returning null.
 *   • For computed numeric expressions involving a single base field
 *     (`Math.round(r.miles * r.rate_cents)`, `r.likelihood × r.impact`),
 *     accessor returns the computed Number expression.
 *   • For Link/Avatar/Badge wrappers around r.field, accessor → r.field.
 *
 * Same conservative dedupe behaviour as v1/v2.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const APP_DIR = path.join(ROOT, "src", "app");

// Canonical lead-field selection for known multi-field composite patterns.
// Sort key for "X / Y" pairs picks X; "start–end" picks start; etc.
const LEAD_FIELD_MAP = [
  { fields: ["rooms_confirmed", "rooms_reserved"], lead: "rooms_confirmed", asNumber: true },
  { fields: ["delivered", "quantity"], lead: "delivered", asNumber: true },
  { fields: ["spent_cents", "amount_cents"], lead: "spent_cents", asNumber: true, percent: true },
  { fields: ["likelihood", "impact"], lead: "score", asNumber: true, computeAs: "likelihood*impact" },
  { fields: ["miles", "rate_cents"], lead: "reimbursement", asNumber: true, computeAs: "miles*rate_cents" },
  { fields: ["starts_on", "ends_on"], lead: "starts_on" },
  { fields: ["start_on", "end_on"], lead: "start_on" },
  { fields: ["period_start", "period_end"], lead: "period_start" },
  { fields: ["planned_start", "planned_end"], lead: "planned_start" },
  { fields: ["spent_cents", "budget_cents"], lead: "spent_cents", asNumber: true },
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

function findColumnObjects(src, columnsArrStart, columnsArrEnd) {
  const objs = [];
  let i = columnsArrStart;
  let depth = 0;
  let objStart = -1;
  while (i < columnsArrEnd) {
    const ch = src[i];
    if (ch === "{") {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && objStart !== -1) {
        objs.push([objStart, i + 1]);
        objStart = -1;
      }
    } else if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < columnsArrEnd && src[i] !== quote) {
        if (src[i] === "\\") i++;
        i++;
      }
    }
    i++;
  }
  return objs;
}

function findColumnsArray(src, fromIndex = 0) {
  const colKey = "columns={[";
  const idx = src.indexOf(colKey, fromIndex);
  if (idx === -1) return null;
  let i = idx + colKey.length;
  let depth = 1;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === "[") depth++;
    else if (ch === "]") depth--;
    else if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === "\\") i++;
        i++;
      }
    }
    i++;
  }
  if (depth !== 0) return null;
  return { start: idx + colKey.length, end: i - 1, after: i };
}

function parseColumnBody(body) {
  const keyMatch = body.match(/key\s*:\s*['"]([^'"]+)['"]/);
  const keyName = keyMatch?.[1] ?? null;
  const hasAccessor = /\baccessor\s*:/.test(body);
  const renderIdx = body.search(/\brender\s*:/);
  let renderBody = null;
  let paramName = "r";
  if (renderIdx !== -1) {
    const after = body.slice(renderIdx);
    const headMatch = after.match(/render\s*:\s*(?:\(\s*([A-Za-z_$][\w$]*)(?:\s*:\s*[^)]+)?\s*\)|([A-Za-z_$][\w$]*))\s*=>\s*/);
    if (headMatch) {
      paramName = headMatch[1] ?? headMatch[2] ?? "r";
      let i = renderIdx + headMatch[0].length;
      let depth = 0;
      let angle = 0;
      const start = i;
      while (i < body.length) {
        const ch = body[i];
        if (depth === 0 && angle === 0 && (ch === "," || ch === "}")) break;
        if (ch === "(" || ch === "{" || ch === "[") depth++;
        else if (ch === ")" || ch === "}" || ch === "]") depth--;
        else if (ch === "<") {
          if (/[A-Za-z]/.test(body[i + 1] ?? "")) angle++;
        } else if (ch === ">") {
          if (angle > 0) angle--;
        } else if (ch === '"' || ch === "'" || ch === "`") {
          const quote = ch;
          i++;
          while (i < body.length && body[i] !== quote) {
            if (body[i] === "\\") i++;
            i++;
          }
        }
        i++;
      }
      renderBody = body.slice(start, i).trim();
      if (renderBody.endsWith(",")) renderBody = renderBody.slice(0, -1).trim();
    }
  }
  return { keyName, hasAccessor, renderBody, paramName };
}

/**
 * Strip JSX attribute regions so identifiers like className, aria-*, on*,
 * variant, style, href, src, alt, label etc. don't pollute field detection.
 */
function stripAttributes(body) {
  let out = body;
  for (const attr of ["className", "aria-[\\w-]+", "on[A-Z]\\w*", "variant", "style", "href", "src", "alt", "label", "size", "title", "id", "role"]) {
    out = out.replace(new RegExp(`\\b${attr}\\s*=\\s*\\{[^}]*\\}`, "g"), "");
    out = out.replace(new RegExp(`\\b${attr}\\s*=\\s*"[^"]*"`, "g"), "");
  }
  return out;
}

/**
 * Extract field paths referenced via the row param. Supports optional chains
 * (`r.foo?.bar`), simple chains (`r.foo.bar`), and bracket-free property
 * access. Returns ordered, deduped list of paths (no leading `${paramName}.`).
 */
function extractFields(renderBody, paramName) {
  const stripped = stripAttributes(renderBody);
  const re = new RegExp(`\\b${paramName.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\.([A-Za-z_$][\\w$]*(?:\\??\\.[A-Za-z_$][\\w$]*)*)`, "g");
  const seen = new Set();
  const out = [];
  let m;
  while ((m = re.exec(stripped)) !== null) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    out.push(m[1]);
  }
  return out;
}

/**
 * Strip optional-chaining prefixes ("foo?.bar" → "foo.bar") for the lead-field
 * pattern matcher, but keep "foo?" for optional access in the accessor body.
 */
function rootFields(fields) {
  return fields.map((f) => f.split("?.")[0].split(".")[0]);
}

function leadFieldFor(rootSet) {
  for (const m of LEAD_FIELD_MAP) {
    if (m.fields.every((f) => rootSet.has(f))) return m;
  }
  return null;
}

function inferAccessorBody(renderBody, fields, paramName) {
  if (fields.length === 0) return null;

  // Easy case: a single field path → accessor = that path with null-coercion.
  if (fields.length === 1) {
    return `${paramName}.${fields[0]} ?? null`;
  }

  // Composite case: try the lead-field map first.
  const roots = rootFields(fields);
  const rootSet = new Set(roots);
  const lead = leadFieldFor(rootSet);
  if (lead) {
    if (lead.computeAs === "likelihood*impact") {
      return `Number(${paramName}.likelihood ?? 0) * Number(${paramName}.impact ?? 0)`;
    }
    if (lead.computeAs === "miles*rate_cents") {
      return `Math.round(Number(${paramName}.miles ?? 0) * Number(${paramName}.rate_cents ?? 0))`;
    }
    if (lead.percent) {
      return `(Number(${paramName}.spent_cents ?? 0) / Math.max(1, Number(${paramName}.amount_cents ?? 1))) * 100`;
    }
    if (lead.asNumber) {
      return `Number(${paramName}.${lead.lead} ?? 0)`;
    }
    return `${paramName}.${lead.lead} ?? null`;
  }

  // Fallback chain: render expressions like `r.foo?.name ?? r.foo?.email ?? "—"`.
  // Heuristic: if every reference is to the SAME root and they're all
  // alternative .name/.email/.title shapes, mirror the chain in the accessor.
  const sameRoot = roots.every((r) => r === roots[0]);
  if (sameRoot && fields.length <= 4) {
    return fields.map((f) => `${paramName}.${f}`).join(" ?? ") + " ?? null";
  }

  // Multi-root fallback chain: e.g. r.venue?.name ?? r.project?.name. Mirror
  // when the render is exactly a `??` chain over field references.
  if (/^[\s\S]+\?\?[\s\S]+/.test(renderBody.replace(/\s+/g, " "))) {
    return fields.map((f) => `${paramName}.${f}`).join(" ?? ") + " ?? null";
  }

  // Last resort — sort by the FIRST referenced field. Better than nothing.
  return `${paramName}.${fields[0]} ?? null`;
}

function injectFields(objSrc, additions) {
  if (additions.length === 0) return objSrc;
  const lastClose = objSrc.lastIndexOf("}");
  if (lastClose === -1) return objSrc;
  const before = objSrc.slice(0, lastClose);
  const after = objSrc.slice(lastClose);
  const trimmedBefore = before.replace(/\s*,?\s*$/, "");
  const additionsStr = additions.map((a) => `, ${a}`).join("");
  return `${trimmedBefore}${additionsStr} ${after}`;
}

function transformFile(filePath) {
  const orig = fs.readFileSync(filePath, "utf8");
  if (!orig.includes('from "@/components/DataTable"')) return null;
  if (!orig.includes("columns={[")) return null;

  let src = orig;
  let totalCols = 0;
  let touched = 0;

  let cursor = 0;
  while (true) {
    const arr = findColumnsArray(src, cursor);
    if (!arr) break;
    const objects = findColumnObjects(src, arr.start, arr.end);
    for (let oi = objects.length - 1; oi >= 0; oi--) {
      totalCols++;
      const [s, e] = objects[oi];
      const body = src.slice(s, e);
      const parsed = parseColumnBody(body);
      if (!parsed.keyName) continue;
      if (parsed.hasAccessor) continue;
      if (!parsed.renderBody) continue;
      const fields = extractFields(parsed.renderBody, parsed.paramName);
      const accessorBody = inferAccessorBody(parsed.renderBody, fields, parsed.paramName);
      if (!accessorBody) continue;
      const next = injectFields(body, [`accessor: (${parsed.paramName}) => ${accessorBody}`]);
      src = src.slice(0, s) + next + src.slice(e);
      touched++;
    }
    cursor = arr.after;
  }

  if (src === orig) return { changed: false, totalCols, touched };
  fs.writeFileSync(filePath, src);
  return { changed: true, totalCols, touched };
}

function main() {
  const files = walk(APP_DIR).filter((f) => fs.readFileSync(f, "utf8").includes('from "@/components/DataTable"'));
  let totalChanged = 0, totalCols = 0, totalTouched = 0;
  for (const f of files) {
    const res = transformFile(f);
    if (!res) continue;
    totalCols += res.totalCols;
    totalTouched += res.touched;
    if (res.changed) totalChanged++;
  }
  console.log(`v3 sweep: modified ${totalChanged} files; touched ${totalTouched}/${totalCols} column defs.`);
}

main();
