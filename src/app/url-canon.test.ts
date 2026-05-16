import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * URL canon guardrail.
 *
 * Per CLAUDE.md (`Conventions › Cross-shell URLs`):
 *   "Always use `urlFor(shell, path)` from `@/lib/urls` — never hardcode
 *   `https://...atlvs.pro` and never concat `NEXT_PUBLIC_APP_URL` with
 *   `/console`/`/p`/`/m`."
 *
 * The single source of truth for the apex base URL is `SITE.baseUrl` in
 * `src/lib/seo.ts`. Every other call site that needs an absolute apex URL
 * must consume `SITE.baseUrl` (or `urlFor(shell, path)` for cross-shell).
 *
 * This spec asserts that:
 *   1. The literal string `"https://atlvs.pro"` (apex) only appears in a
 *      narrowly allowlisted set of files — the canon definition itself,
 *      env wiring, urls helper, sample fixtures, docs/JSDoc.
 *   2. Subdomain literals (`https://app.atlvs.pro`, `https://gvteway.atlvs.pro`,
 *      `https://compvss.atlvs.pro`) are likewise restricted to SSOT files and
 *      designated fixture files. Runtime code must use `urlFor(shell, path)`.
 *   3. Nobody else duplicates `process.env.NEXT_PUBLIC_APP_URL ?? "..."`
 *      — they should call `SITE.baseUrl` instead.
 *
 * Test files (`.test.ts`) are excluded because they pin literal URLs in
 * assertions intentionally.
 */

const REPO_ROOT = process.cwd();
const SRC_DIR = join(REPO_ROOT, "src");

const ALLOW_HTTPS_LITERAL = new Set<string>([
  // Brand canon — defines `BRAND.apexUrl`, the literal everyone else reads.
  "src/lib/brand.ts",
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

const ALLOW_SUBDOMAIN_LITERAL = new Set<string>([
  // SSOT files that already appear in ALLOW_HTTPS_LITERAL.
  "src/lib/brand.ts",
  "src/lib/seo.ts",
  "src/lib/urls.ts",
  "src/lib/env.ts",
  "src/proxy.ts",
  "src/app/url-canon.test.ts",
  // Supabase client wiring — explains cookie domain scope in a comment.
  "src/lib/supabase/server.ts",
  // Zapier webhook sample payloads — static fixture objects showing what real
  // webhook events look like; these are documentation, not runtime URL generation.
  "src/lib/integrations/zapier/payloads.ts",
  // Email template editor — merge-tag sample values shown to operators in UI.
  "src/app/(platform)/console/settings/email-templates/EmailTemplatesPanel.tsx",
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

const SUBDOMAIN_RE = /["'](https:\/\/(app|gvteway|compvss)\.atlvs\.pro)[/"']/;

describe("URL canon", () => {
  it('the literal "https://atlvs.pro" is only allowed in narrowly allowlisted files', () => {
    const offenders: string[] = [];
    for (const file of ALL) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOW_HTTPS_LITERAL.has(rel)) continue;
      const txt = readFileSync(file, "utf8");
      if (txt.includes('"https://atlvs.pro"') || txt.includes("'https://atlvs.pro'")) {
        offenders.push(rel);
      }
    }
    expect(
      offenders,
      `Files contain the literal "https://atlvs.pro" — use SITE.baseUrl from @/lib/seo instead. Offenders: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it("subdomain literals (app/gvteway/compvss.atlvs.pro) are restricted to SSOT + fixture files", () => {
    const offenders: string[] = [];
    for (const file of ALL) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOW_SUBDOMAIN_LITERAL.has(rel)) continue;
      const txt = readFileSync(file, "utf8");
      if (SUBDOMAIN_RE.test(txt)) offenders.push(rel);
    }
    expect(
      offenders,
      `Files contain hardcoded subdomain URLs — use urlFor(shell, path) from @/lib/urls instead. Offenders: ${offenders.join(", ")}`,
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
