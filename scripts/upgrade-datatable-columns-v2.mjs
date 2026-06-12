#!/usr/bin/env node
/**
 * Codemod v2: catch the columns that v1 missed.
 *
 * Strategy: for every column object without an `accessor:`, parse the
 * `render: (X) => …` body and extract every `X.fieldPath` reference
 * (ignoring matches inside attribute names like `className`, `aria-…`,
 * `onClick` etc.). If we find exactly one unique field path, infer it
 * as the accessor.
 *
 * Also: when the unique field path looks money-y (`*_cents`,
 * `amount_cents`, `cents`), wrap as `Number(... ?? 0)`. When the field
 * path matches `*_at` or `*_date`, leave it raw (ISO strings sort
 * lexicographically the same as chronologically).
 *
 * Conservative: skips composites with multiple distinct fields.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const APP_DIR = path.join(ROOT, "src", "app");

const LOW_CARD_KEYS = new Set([
  "status", "stage", "state", "type", "kind", "category", "role", "persona",
  "tier", "phase", "severity", "priority", "source", "currency", "region",
  "locale", "environment", "visibility", "vendor", "sponsor", "client",
  "accent", "discipline", "department", "track", "lane", "scope", "channel",
  "method", "outcome", "verdict", "decision", "level", "class", "group",
  "owner", "assignee",
]);

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
  const hasFilterable = /\bfilterable\s*:/.test(body);
  const hasGroupable = /\bgroupable\s*:/.test(body);
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
  return { keyName, hasAccessor, hasFilterable, hasGroupable, renderBody, paramName };
}

/**
 * Strip JSX attribute regions from the body so identifiers like
 * `className`, `aria-label`, `onClick`, etc. don't leak into the
 * field-extraction pass. Crude but effective.
 */
function stripAttributes(body) {
  return body
    .replace(/\bclassName\s*=\s*\{[^}]*\}/g, "")
    .replace(/\bclassName\s*=\s*"[^"]*"/g, "")
    .replace(/\baria-[\w-]+\s*=\s*"[^"]*"/g, "")
    .replace(/\baria-[\w-]+\s*=\s*\{[^}]*\}/g, "")
    .replace(/\bon[A-Z]\w*\s*=\s*\{[^}]*\}/g, "")
    .replace(/\bvariant\s*=\s*\{[^}]*\}/g, "")
    .replace(/\bvariant\s*=\s*"[^"]*"/g, "")
    .replace(/\bstyle\s*=\s*\{\{[^}]*\}\}/g, "");
}

/**
 * Extract field paths referenced via the row param. Returns array of
 * { path, isMoney, isDate }.
 */
function extractFields(renderBody, paramName) {
  const stripped = stripAttributes(renderBody);
  const re = new RegExp(`\\b${paramName.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\.([A-Za-z_$][\\w$]*(?:\\??\\.[A-Za-z_$][\\w$]*)*)`, "g");
  const seen = new Set();
  const out = [];
  let m;
  while ((m = re.exec(stripped)) !== null) {
    const p = m[1];
    if (seen.has(p)) continue;
    seen.add(p);
    out.push({
      path: p,
      isMoney: /(?:^|_)cents$/.test(p) || p === "amount" || p === "value" && /cents/.test(stripped),
      isDate: /(_at|_date)$/.test(p),
    });
  }
  return out;
}

function inferAccessorBody(fields, paramName) {
  if (fields.length === 0) return null;
  if (fields.length > 1) return null;  // ambiguous
  const f = fields[0];
  if (f.isMoney) return `Number(${paramName}.${f.path} ?? 0)`;
  return `${paramName}.${f.path} ?? null`;
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
      const adds = [];
      if (!parsed.hasAccessor && parsed.renderBody) {
        const fields = extractFields(parsed.renderBody, parsed.paramName);
        const accessorBody = inferAccessorBody(fields, parsed.paramName);
        if (accessorBody) {
          adds.push(`accessor: (${parsed.paramName}) => ${accessorBody}`);
        }
      }
      if (!parsed.hasFilterable && LOW_CARD_KEYS.has(parsed.keyName)) {
        adds.push("filterable: true");
      }
      if (!parsed.hasGroupable && LOW_CARD_KEYS.has(parsed.keyName)) {
        adds.push("groupable: true");
      }
      if (adds.length === 0) continue;
      const next = injectFields(body, adds);
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
  console.log(`v2 sweep: modified ${totalChanged} files; touched ${totalTouched}/${totalCols} column defs.`);
}

main();
