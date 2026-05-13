import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * URL canon guardrail.
 *
 * Per CLAUDE.md (`Conventions › Cross-shell URLs`):
 *   "Always use `urlFor(shell, path)` from `@/lib/urls` — never hardcode
 *   `https://...flytehaus.studio` and never concat `NEXT_PUBLIC_APP_URL` with
 *   `/console`/`/p`/`/m`."
 *
 * The single source of truth for the apex base URL is `SITE.baseUrl` in
 * `src/lib/seo.ts`. Every other call site that needs an absolute apex URL
 * must consume `SITE.baseUrl` (or `urlFor(shell, path)` for cross-shell).
 *
 * This spec asserts that:
 *   1. The literal string `"https://flytehaus.studio"` only appears in a
 *      narrowly allowlisted set of files — the canon definition itself,
 *      env wiring, urls helper, sample fixtures, docs/JSDoc.
 *   2. Nobody else duplicates `process.env.NEXT_PUBLIC_APP_URL ?? "..."`
 *      — they should call `SITE.baseUrl` instead.
 *
 * Test files (`.test.ts`) are excluded because they pin literal URLs in
 * assertions intentionally.
 */

const REPO_ROOT = process.cwd();
const SRC_DIR = join(REPO_ROOT, "src");

const ALLOW_HTTPS_LITERAL = new Set<string>([
  // Single source of truth — the canonical fallback definition.
  "src/lib/seo.ts",
  // urls.ts has the literal in JSDoc examples documenting `urlFor`.
  "src/lib/urls.ts",
  // env wiring + comments referencing the production hostnames.
  "src/lib/env.ts",
  // The proxy lists it for CORS allow-origin and references the apex.
  "src/proxy.ts",
  // This canon spec itself contains the literal in the rule description.
  "src/app/url-canon.test.ts",
]);

const ALLOW_FALLBACK_PATTERN = new Set<string>([
  // Only the canonical definition resolves NEXT_PUBLIC_APP_URL with a
  // string fallback. Every other site delegates to `SITE.baseUrl`.
  "src/lib/seo.ts",
  // urls.ts uses its own internal apexBase() helper with the same fallback.
  "src/lib/urls.ts",
]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      out.push(...walk(full));
    } else if (st.isFile() && /\.(ts|tsx)$/.test(full)) {
      out.push(full);
    }
  }
  return out;
}

const ALL = walk(SRC_DIR).filter((f) => !/\.test\.[tj]sx?$/.test(f));

describe("URL canon", () => {
  it('the literal "https://flytehaus.studio" is only allowed in narrowly allowlisted files', () => {
    const offenders: string[] = [];
    for (const file of ALL) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOW_HTTPS_LITERAL.has(rel)) continue;
      const txt = readFileSync(file, "utf8");
      if (txt.includes('"https://flytehaus.studio"') || txt.includes("'https://flytehaus.studio'")) {
        offenders.push(rel);
      }
    }
    expect(
      offenders,
      `Files contain the literal "https://flytehaus.studio" — use SITE.baseUrl from @/lib/seo instead. Offenders: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it("the `NEXT_PUBLIC_APP_URL ?? ...` fallback pattern lives only in src/lib/seo.ts and src/lib/urls.ts", () => {
    const offenders: string[] = [];
    const RE = /process\.env\.NEXT_PUBLIC_APP_URL\s*\?\?/;
    for (const file of ALL) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOW_FALLBACK_PATTERN.has(rel)) continue;
      const txt = readFileSync(file, "utf8");
      if (RE.test(txt)) offenders.push(rel);
    }
    expect(
      offenders,
      `Files duplicate the NEXT_PUBLIC_APP_URL fallback — use SITE.baseUrl from @/lib/seo instead. Offenders: ${offenders.join(", ")}`,
    ).toEqual([]);
  });
});
