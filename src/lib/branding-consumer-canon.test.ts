import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Brand-consumer canon (L-P3 Brand Studio ratchet).
 *
 * `src/lib/branding.ts` is the ONE resolution layer for the branding jsonb
 * (`orgs.branding` / `clients.branding` / `projects.branding` /
 * `proposals.branding`). Two rules, grep-level:
 *
 *  1. Every file that SELECTs the `branding` column through Supabase must
 *     import the canonical layer — `@/lib/branding` directly, or
 *     `@/lib/pdf/branding` (the PDF flattening wrapper, which itself
 *     delegates to `resolveBrand`) — or be pinned below with a reason.
 *
 *  2. Nobody outside `src/lib/branding.ts` may cast-parse the jsonb
 *     (`...branding ?? {}) as {` / `.branding as {`). That exact pattern
 *     produced the resolveDocBrand defect where the nonexistent
 *     `accent`/`accentText` keys were read and org accents never reached
 *     white-label documents. Parse via `safeBranding`/`resolveBrand` only.
 */

const REPO_ROOT = process.cwd();
const SRC = join(REPO_ROOT, "src");

/** Files that select the column but are exempt from rule 1 — each with a reason. */
const SELECT_EXCEPTIONS = new Set<string>([
  // Fetch-only loader (drift-guard for the invoice artifact): it returns the
  // raw rows untouched; BOTH consumers (doc resolvers + the react-pdf
  // pipeline) resolve them through the canonical layer.
  "src/lib/documents/sources/invoice.ts",
  // Selects the column as part of the workspaces join but never reads it —
  // the switcher payload uses name/name_override/logo_url only.
  "src/app/api/v1/me/workspaces/route.ts",
]);

const CANON_IMPORT_RE = /from ["']@\/lib\/(pdf\/)?branding["']/;
// A supabase `.select("...")` whose column list mentions the branding jsonb.
const SELECT_BRANDING_RE = /\.select\(\s*["'][^"')]*\bbranding\b/;
// Ad-hoc jsonb cast-parse: `(x.branding ?? {}) as {` or `.branding as {`.
const CAST_PARSE_RE = /branding(\s*\?\?\s*\{\}\s*\))?\s+as\s+\{/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

describe("brand-consumer canon", () => {
  const files = walk(SRC);

  it("every file selecting the branding jsonb imports the canonical resolver layer", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const rel = relative(REPO_ROOT, file);
      if (SELECT_EXCEPTIONS.has(rel)) continue;
      const src = readFileSync(file, "utf8");
      if (!SELECT_BRANDING_RE.test(src)) continue;
      if (!CANON_IMPORT_RE.test(src)) offenders.push(rel);
    }
    expect(
      offenders,
      `Files select the branding jsonb without importing @/lib/branding (or @/lib/pdf/branding). ` +
        `Resolve through resolveBrand/safeBranding, or pin the file in SELECT_EXCEPTIONS with a reason:\n` +
        offenders.join("\n"),
    ).toEqual([]);
  });

  it("nobody cast-parses the branding jsonb outside src/lib/branding.ts", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const rel = relative(REPO_ROOT, file);
      if (rel === "src/lib/branding.ts") continue;
      const src = readFileSync(file, "utf8");
      if (CAST_PARSE_RE.test(src)) offenders.push(rel);
    }
    expect(
      offenders,
      `Ad-hoc branding jsonb casts found (parse via safeBranding/resolveBrand instead):\n` + offenders.join("\n"),
    ).toEqual([]);
  });

  it("the pinned exceptions still exist and still select the column (self-pruning)", () => {
    for (const rel of SELECT_EXCEPTIONS) {
      const src = readFileSync(join(REPO_ROOT, rel), "utf8");
      expect(SELECT_BRANDING_RE.test(src), `${rel} no longer selects branding; remove it from SELECT_EXCEPTIONS`).toBe(
        true,
      );
    }
  });
});
