import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Inclusive-language guard (design-system inventory §Voice & Copy).
 *
 * Scans every shipped locale message catalog (`src/messages/*.json`) for an
 * unambiguous denylist of non-inclusive terms and their inclusive replacements.
 * User-facing copy lives in these catalogs, so this is the highest-signal place
 * to enforce the voice canon's "inclusive language" rule in CI. The denylist is
 * deliberately conservative (whole-word, only clear offenders) to avoid false
 * positives on legitimate domain vocabulary (e.g. "master catalog").
 */
const ROOT = process.cwd();
const MESSAGES_DIR = join(ROOT, "src/messages");

/** term (case-insensitive, whole-word) → preferred replacement. */
const DENYLIST: Record<string, string> = {
  whitelist: "allowlist",
  blacklist: "denylist",
  "master/slave": "primary/replica",
  grandfathered: "legacy-exempt",
  "sanity check": "quick check",
  crazy: "wild / intense",
  insane: "intense",
  lame: "weak",
  retarded: "delayed",
  crippled: "limited",
  handicapped: "limited",
};

function collectStrings(node: unknown, acc: string[]): string[] {
  if (typeof node === "string") acc.push(node);
  else if (Array.isArray(node)) for (const v of node) collectStrings(v, acc);
  else if (node && typeof node === "object") for (const v of Object.values(node)) collectStrings(v, acc);
  return acc;
}

describe("inclusive language (locale catalogs)", () => {
  const catalogs = readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json"));

  it("ships at least one locale catalog", () => {
    expect(catalogs.length).toBeGreaterThan(0);
  });

  for (const file of catalogs) {
    it(`${file} uses inclusive language`, () => {
      const strings = collectStrings(JSON.parse(readFileSync(join(MESSAGES_DIR, file), "utf8")), []);
      const hay = strings.join("\n").toLowerCase();
      const offenders: string[] = [];
      for (const [term, repl] of Object.entries(DENYLIST)) {
        const re = new RegExp(`\\b${term.replace(/[/\\]/g, "\\$&")}\\b`, "i");
        if (re.test(hay)) offenders.push(`"${term}" → use "${repl}"`);
      }
      expect(offenders, `Non-inclusive term(s) in ${file}:\n${offenders.join("\n")}`).toEqual([]);
    });
  }
});
