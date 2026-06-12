#!/usr/bin/env node
/**
 * Codemod: upgrade DataTable column definitions to enable accessor +
 * filterable/groupable on the right columns.
 *
 * Touches files under src/app/** that import @/components/DataTable.
 *
 * Per-column changes — applied only when the column object does NOT already
 * declare the field:
 *   • accessor: inferred from `render: (r) => …` when the body references
 *     a single field like `r.foo`, `r.foo ?? "—"`, `formatMoney(r.foo_cents)`,
 *     `formatDate(r.foo_at)`, `timeAgo(r.foo_at)`, `<Badge>{r.foo}</Badge>`,
 *     `<StatusBadge status={r.foo} />`. Composite renders are left alone.
 *   • filterable: true when key matches a low-cardinality dimension (status,
 *     stage, state, type, kind, category, role, persona, tier, phase,
 *     severity, priority, source, currency, region, locale, environment,
 *     visibility, vendor, sponsor, client, accent).
 *   • groupable: true on the same set.
 *
 * The codemod is conservative: when in doubt about the render shape, it
 * skips the column. Run again after refactors are safe.
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

/**
 * Find balanced top-level column object spans within the columns={[ … ]} array.
 * Returns array of [start, end] indices into source.
 */
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
      // Skip strings (handle escapes)
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

/**
 * Locate a top-level `columns={[ … ]}` prop in a file. Returns [arrayStart,
 * arrayEnd] indices spanning between the [ and the matching ].
 */
function findColumnsArray(src, fromIndex = 0) {
  const colKey = "columns={[";
  const idx = src.indexOf(colKey, fromIndex);
  if (idx === -1) return null;
  // walk forward from after the [ to find matching ]
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

/** Match a column object body. Returns { keyName, hasAccessor, renderBody, paramName }. */
function parseColumnBody(body) {
  // key: "foo" or key: 'foo'
  const keyMatch = body.match(/key\s*:\s*['"]([^'"]+)['"]/);
  const keyName = keyMatch?.[1] ?? null;
  const hasAccessor = /\baccessor\s*:/.test(body);
  const hasFilterable = /\bfilterable\s*:/.test(body);
  const hasGroupable = /\bgroupable\s*:/.test(body);
  const hasSortable = /\bsortable\s*:/.test(body);
  // render: (r) => <body> — stop at the next top-level field boundary
  // We find `render:` then capture up to a comma followed by an identifier+colon
  // or up to end-of-object.
  const renderIdx = body.search(/\brender\s*:/);
  let renderBody = null;
  let paramName = "r";
  if (renderIdx !== -1) {
    const after = body.slice(renderIdx);
    // Match the lambda head: `render: (X) => …`
    const headMatch = after.match(/render\s*:\s*(?:\(\s*([A-Za-z_$][\w$]*)(?:\s*:\s*[^)]+)?\s*\)|([A-Za-z_$][\w$]*))\s*=>\s*/);
    if (headMatch) {
      paramName = headMatch[1] ?? headMatch[2] ?? "r";
      let i = renderIdx + headMatch[0].length;
      // Walk until we hit a top-level comma/}/EOF, respecting nested (), {}, [], "", '', ``, <>
      let depth = 0;
      let angle = 0;
      const start = i;
      while (i < body.length) {
        const ch = body[i];
        if (depth === 0 && angle === 0 && (ch === "," || ch === "}")) break;
        if (ch === "(" || ch === "{" || ch === "[") depth++;
        else if (ch === ")" || ch === "}" || ch === "]") depth--;
        else if (ch === "<") {
          // crude JSX detection — treat <Word as open tag
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
      // Strip trailing comma
      if (renderBody.endsWith(",")) renderBody = renderBody.slice(0, -1).trim();
    }
  }
  return { keyName, hasAccessor, hasFilterable, hasGroupable, hasSortable, renderBody, paramName };
}

/**
 * Infer an accessor body from a render body. Returns the accessor body
 * (without the `(r) =>` head) or null if not safely inferable.
 */
function inferAccessor(renderBody, paramName) {
  if (!renderBody) return null;
  const r = paramName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Accessor candidate must reference the row param exactly once, in a
  // simple field-access shape.

  // Case: r.foo
  let m = renderBody.match(new RegExp(`^${r}\\.([A-Za-z_$][\\w$]*)$`));
  if (m) return `${paramName}.${m[1]}`;

  // Case: r.foo ?? "—"  /  r.foo ?? null  /  r.foo ?? 0
  m = renderBody.match(new RegExp(`^${r}\\.([A-Za-z_$][\\w$]*)\\s*\\?\\?\\s*("[^"]*"|'[^']*'|null|0)$`));
  if (m) return `${paramName}.${m[1]} ?? null`;

  // Case: String(r.foo) / String(r.foo ?? "—")
  m = renderBody.match(new RegExp(`^String\\(${r}\\.([A-Za-z_$][\\w$]*)(?:\\s*\\?\\?\\s*[^)]*)?\\)$`));
  if (m) return `${paramName}.${m[1]} ?? null`;

  // Case: formatMoney(r.foo_cents) — sort by underlying number
  m = renderBody.match(new RegExp(`^formatMoney\\(${r}\\.([A-Za-z_$][\\w$]*)(?:\\s*\\?\\?\\s*0)?\\)$`));
  if (m) return `Number(${paramName}.${m[1]} ?? 0)`;

  // Case: formatDate(r.foo_at) / formatDate(r.foo_at, "long")
  m = renderBody.match(new RegExp(`^formatDate\\(${r}\\.([A-Za-z_$][\\w$]*)(?:\\s*,\\s*['"][^'"]+['"])?\\)$`));
  if (m) return `${paramName}.${m[1]}`;

  // Case: timeAgo(r.foo_at)
  m = renderBody.match(new RegExp(`^timeAgo\\(${r}\\.([A-Za-z_$][\\w$]*)\\)$`));
  if (m) return `${paramName}.${m[1]}`;

  // Case: <StatusBadge status={r.foo} />
  m = renderBody.match(new RegExp(`^<StatusBadge\\s+status=\\{${r}\\.([A-Za-z_$][\\w$]*)\\}\\s*/>$`));
  if (m) return `${paramName}.${m[1]}`;

  // Case: <Badge …>{r.foo}</Badge>  /  <Badge …>{r.foo ?? "—"}</Badge>
  m = renderBody.match(new RegExp(`^<Badge[^>]*>\\{${r}\\.([A-Za-z_$][\\w$]*)(?:\\s*\\?\\?\\s*[^}]+)?\\}<\\/Badge>$`));
  if (m) return `${paramName}.${m[1]} ?? null`;

  return null;
}

/** Inject extra fields right before the closing `}` of an object body. */
function injectFields(objSrc, additions) {
  if (additions.length === 0) return objSrc;
  // Find the last `}` and inject before it.
  // Preserve trailing whitespace style.
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

  // Find every columns={[…]} occurrence in the file.
  let cursor = 0;
  while (true) {
    const arr = findColumnsArray(src, cursor);
    if (!arr) break;
    const objects = findColumnObjects(src, arr.start, arr.end);
    // Walk objects in REVERSE so earlier indices stay valid.
    for (let oi = objects.length - 1; oi >= 0; oi--) {
      totalCols++;
      const [s, e] = objects[oi];
      const body = src.slice(s, e);
      const parsed = parseColumnBody(body);
      if (!parsed.keyName) continue;
      const adds = [];
      if (!parsed.hasAccessor && parsed.renderBody) {
        const inferred = inferAccessor(parsed.renderBody, parsed.paramName);
        if (inferred) adds.push(`accessor: (${parsed.paramName}) => ${inferred}`);
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
    // Move cursor past this columns array.
    cursor = arr.after;
  }

  if (src === orig) return { changed: false, totalCols, touched };
  fs.writeFileSync(filePath, src);
  return { changed: true, totalCols, touched };
}

function main() {
  const files = walk(APP_DIR).filter((f) => fs.readFileSync(f, "utf8").includes('from "@/components/DataTable"'));
  let totalFiles = 0, totalChanged = 0, totalCols = 0, totalTouched = 0;
  const skipped = [];
  for (const f of files) {
    const res = transformFile(f);
    if (!res) {
      skipped.push(path.relative(ROOT, f));
      continue;
    }
    totalFiles++;
    totalCols += res.totalCols;
    totalTouched += res.touched;
    if (res.changed) totalChanged++;
  }
  console.log(`Scanned ${totalFiles} DataTable files; modified ${totalChanged}; touched ${totalTouched}/${totalCols} column defs.`);
  if (skipped.length) {
    console.log(`Skipped (no DataTable import): ${skipped.length}`);
  }
}

main();
