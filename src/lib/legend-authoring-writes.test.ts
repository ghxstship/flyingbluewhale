import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * L-P6a ratchet — the LEG3ND content supply side must keep app write paths.
 *
 * PERSONA_MATRIX (reports/LEGEND_READINESS_2026-07) blockers B-1/B-2 were
 * exactly this finding: ZERO `insert/update/upsert` against the five
 * learning-content tables anywhere in src/ — content was seed-only while
 * the marketing sold "Author courses". The /legend/teach authoring
 * surfaces closed that. This guard greps the app tree so the finding can't
 * silently regress (e.g. a refactor deleting the teach actions, or a
 * "cleanup" that drops a table's writer).
 *
 * Rule: each content table must have at least one INSERT-ish writer and at
 * least one UPDATE writer somewhere under src/app (excluding tests). The
 * scan matches a `.from("<table>")` chain followed closely by
 * `.insert(` / `.upsert(` / `.update(` — the repo's uniform supabase call
 * shape.
 */

const REPO_ROOT = process.cwd();
const APP_DIR = join(REPO_ROOT, "src", "app");

/** The five seed-only tables from the PERSONA_MATRIX zero-writes finding. */
const CONTENT_TABLES = [
  "legend_courses",
  "lessons",
  "assessments",
  "assessment_questions",
  "legend_live_sessions",
] as const;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules") continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

describe("legend authoring writes — content tables have app write paths", () => {
  const files = walk(APP_DIR).map((f) => ({ rel: relative(REPO_ROOT, f), src: readFileSync(f, "utf8") }));

  for (const table of CONTENT_TABLES) {
    const chain = (verb: string) =>
      // `.from("<table>")` then (whitespace/newlines) `.<verb>(` within the
      // same fluent chain. 200 chars of slack covers prettier line breaks.
      new RegExp(`\\.from\\("${table}"\\)[\\s\\S]{0,200}?\\.${verb}\\(`);

    it(`${table} has an app INSERT path`, () => {
      const insertRe = chain("insert");
      const upsertRe = chain("upsert");
      const writers = files.filter(({ src }) => insertRe.test(src) || upsertRe.test(src));
      expect(
        writers.map((w) => w.rel),
        `No .from("${table}").insert/upsert( anywhere under src/app — the PERSONA_MATRIX B-1/B-2 zero-writes state has regressed`,
      ).not.toEqual([]);
    });

    it(`${table} has an app UPDATE path`, () => {
      const updateRe = chain("update");
      const writers = files.filter(({ src }) => updateRe.test(src));
      expect(
        writers.map((w) => w.rel),
        `No .from("${table}").update( anywhere under src/app — authoring lifecycle transitions are gone`,
      ).not.toEqual([]);
    });
  }
});
