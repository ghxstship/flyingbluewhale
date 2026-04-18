/**
 * OpenAPI ↔ filesystem drift test.
 *
 * Enumerates every route handler under `src/app/api/v1/**` and asserts that
 * each `(path, method)` pair appears in `docs/api/openapi.yaml`, and vice
 * versa. If a developer adds a route without documenting it (or deletes one
 * without cleaning up the spec), this test fails in CI — the spec stays the
 * single source of truth that external consumers can trust.
 *
 * Intentionally avoids a YAML dependency — the subset of YAML we need is
 * trivial (flat `paths:` block with method keys) and a light line parser
 * keeps the test fast + boring.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROUTES_ROOT = join(process.cwd(), "src/app/api/v1");
const OPENAPI_PATH = join(process.cwd(), "docs/api/openapi.yaml");

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;
type Method = (typeof HTTP_METHODS)[number];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry === "route.ts") out.push(full);
  }
  return out;
}

// Translate `src/app/api/v1/ai/conversations/[id]/route.ts` → `/api/v1/ai/conversations/{id}`
function routePathFromFile(file: string): string {
  const rel = relative(join(process.cwd(), "src/app"), file).replace(/\/route\.ts$/, "");
  const withParams = rel.replace(/\[([^\]]+)\]/g, "{$1}");
  return "/" + withParams;
}

function methodsFromFile(file: string): Method[] {
  const src = readFileSync(file, "utf8");
  const out: Method[] = [];
  for (const m of HTTP_METHODS) {
    // Match both direct function exports and const-bound handlers (e.g. via withIdempotency).
    const upper = m.toUpperCase();
    const direct = new RegExp(`^export\\s+async\\s+function\\s+${upper}\\b`, "m");
    const bound = new RegExp(`^export\\s+const\\s+${upper}\\b`, "m");
    if (direct.test(src) || bound.test(src)) out.push(m);
  }
  return out;
}

// Parse openapi.yaml's `paths:` block into a Map<path, Set<method>>.
// Deliberately shallow — only supports the exact shape this project uses.
function parseOpenapi(): Map<string, Set<Method>> {
  const text = readFileSync(OPENAPI_PATH, "utf8");
  const lines = text.split("\n");
  const pathsIdx = lines.findIndex((l) => /^paths\s*:\s*$/.test(l));
  if (pathsIdx < 0) throw new Error("openapi.yaml is missing `paths:` top-level key");
  const map = new Map<string, Set<Method>>();
  let currentPath: string | null = null;
  for (let i = pathsIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    // Top-level key (no leading space) ends the paths block.
    if (/^[^\s#]/.test(line)) break;
    // A path entry is indented exactly 2 spaces and starts with `/`.
    const pathMatch = line.match(/^ {2}(\/[^\s:]+):\s*$/);
    if (pathMatch) {
      currentPath = pathMatch[1];
      map.set(currentPath, new Set());
      continue;
    }
    // A method entry is indented exactly 4 spaces.
    const methodMatch = line.match(/^ {4}(get|post|put|patch|delete)\s*:/);
    if (methodMatch && currentPath) {
      map.get(currentPath)!.add(methodMatch[1] as Method);
    }
  }
  return map;
}

describe("OpenAPI drift", () => {
  const filesystem = new Map<string, Set<Method>>();
  for (const file of walk(ROUTES_ROOT)) {
    const p = routePathFromFile(file);
    const methods = methodsFromFile(file);
    if (methods.length === 0) continue;
    filesystem.set(p, new Set(methods));
  }
  const spec = parseOpenapi();

  it("every handler on disk is documented in openapi.yaml", () => {
    const missing: string[] = [];
    for (const [path, methods] of filesystem) {
      const documented = spec.get(path);
      if (!documented) {
        missing.push(`${path} (all methods)`);
        continue;
      }
      for (const m of methods) {
        if (!documented.has(m)) missing.push(`${m.toUpperCase()} ${path}`);
      }
    }
    expect(missing, `Undocumented: ${missing.join(", ")}`).toEqual([]);
  });

  it("every documented path has a matching handler on disk", () => {
    const orphaned: string[] = [];
    for (const [path, methods] of spec) {
      const onDisk = filesystem.get(path);
      if (!onDisk) {
        orphaned.push(`${path} (no route.ts)`);
        continue;
      }
      for (const m of methods) {
        if (!onDisk.has(m)) orphaned.push(`${m.toUpperCase()} ${path}`);
      }
    }
    expect(orphaned, `Documented but missing: ${orphaned.join(", ")}`).toEqual([]);
  });
});
