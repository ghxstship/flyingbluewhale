import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * URL canon guardrail.
 *
 * Per CLAUDE.md (`Conventions › Cross-shell URLs`):
 *   "Always use `urlFor(shell, path)` from `@/lib/urls` — never hardcode
 *   `https://...atlvs.pro` and never concat `NEXT_PUBLIC_APP_URL` with
 *   `/studio`/`/p`/`/m`."
 *
 * The single source of truth for the apex base URL is `SITE.baseUrl` in
 * `src/lib/seo.ts`. Every other call site that needs an absolute apex URL
 * must consume `SITE.baseUrl` (or `urlFor(shell, path)` for cross-shell).
 *
 * This spec asserts that:
 *   1. The literal string `"https://atlvs.pro"` only appears in a
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

const ALLOW_FALLBACK_PATTERN = new Set<string>([
  // Only the canonical definition resolves NEXT_PUBLIC_APP_URL with a
  // string fallback. Every other site delegates to `SITE.baseUrl`.
  "src/lib/seo.ts",
  // urls.ts uses its own internal apexBase() helper with the same fallback.
  "src/lib/urls.ts",
]);

/**
 * Cross-shell raw-href guard.
 *
 * A raw `href="/studio/..."` rendered inside the portal/mobile shells (or a
 * raw `href="/p/..."` / `href="/m/..."` inside the platform shell) 404s in
 * subdomain mode: `internalPathFor` prefixes non-matching paths, so
 * `/studio/x` on the portal host becomes `/p/studio/x`. Cross-shell links
 * MUST go through `urlFor(shell, path)` from `@/lib/urls`.
 *
 * Same-shell links (e.g. `/m/...` inside `(mobile)`) are fine — the prefix
 * matches the shell and `internalPathFor` is a no-op — so each route group is
 * only scanned for the *foreign* shell prefixes.
 */
const CROSS_SHELL_SCANS: Array<{
  group: string;
  foreignPrefixes: string[];
}> = [
  // Portal pages must not raw-link into the console or mobile shells.
  { group: "src/app/(portal)", foreignPrefixes: ["/studio", "/m"] },
  // Mobile pages must not raw-link into the console or portal shells.
  { group: "src/app/(mobile)", foreignPrefixes: ["/studio", "/p"] },
  // Platform pages must not raw-link into the portal or mobile shells.
  // (/legend is an allowed deep-link target — the Knowledge rail links into it.)
  { group: "src/app/(platform)", foreignPrefixes: ["/p", "/m"] },
  // LEG3ND shell pages must not raw-link into console / portal / mobile.
  { group: "src/app/(legend)", foreignPrefixes: ["/studio", "/p", "/m"] },
  // Personal (/me) lives on the apex — every shell prefix is foreign.
  { group: "src/app/(personal)", foreignPrefixes: ["/studio", "/p", "/m"] },
];

const ALLOW_RAW_CROSS_SHELL_HREF = new Set<string>([]);

/** Build matchers for `href="/prefix..."` and `href={\`/prefix...\`}` forms. */
function rawHrefPatterns(prefix: string): RegExp[] {
  const p = prefix.replace(/\//g, "\\/");
  return [
    // href="/studio" · href="/studio/..." · href="/p/..." etc.
    new RegExp(`href="${p}(?:\\/|")`),
    // href={`/studio/${id}`} template-literal form.
    new RegExp(`href=\\{\`${p}(?:\\/|\\$|\`)`),
  ];
}

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

  it("the `NEXT_PUBLIC_APP_URL ?? ...` fallback pattern lives only in src/lib/seo.ts and src/lib/urls.ts", () => {
    const offenders: string[] = [];
    // Catch both the raw `process.env.NEXT_PUBLIC_APP_URL ??` form and the
    // validated-env-module `env.NEXT_PUBLIC_APP_URL ??` form. The optional
    // `process.` prefix + a leading word-boundary keep the match anchored to a
    // real `env` identifier (not an arbitrary `…env`).
    const RE = /\b(?:process\.)?env\.NEXT_PUBLIC_APP_URL\s*\?\?/;
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

  it("no raw cross-shell hrefs — foreign shell prefixes must go through urlFor(shell, path)", () => {
    const offenders: string[] = [];
    for (const { group, foreignPrefixes } of CROSS_SHELL_SCANS) {
      const groupDir = join(REPO_ROOT, group);
      if (!statSync(groupDir, { throwIfNoEntry: false })?.isDirectory()) continue;
      for (const file of walk(groupDir).filter((f) => !/\.test\.[tj]sx?$/.test(f))) {
        const rel = relative(REPO_ROOT, file);
        if (ALLOW_RAW_CROSS_SHELL_HREF.has(rel)) continue;
        const txt = readFileSync(file, "utf8");
        for (const prefix of foreignPrefixes) {
          if (rawHrefPatterns(prefix).some((re) => re.test(txt))) {
            offenders.push(`${rel} (raw href into ${prefix})`);
          }
        }
      }
    }
    expect(
      offenders,
      `Raw cross-shell hrefs 404 in subdomain mode — use urlFor(shell, path) from @/lib/urls instead. Offenders: ${offenders.join(", ")}`,
    ).toEqual([]);
  });
});
