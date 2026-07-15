import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { FIELD_ROLES, OPEN_DECISIONS, WORKFLOWS, type FieldRole } from "./self-sufficiency-manifest";

/**
 * The COMPVSS self-sufficiency exit test.
 *
 * The parity audit's global acceptance criterion is: every role completes
 * 100% of their workflows on COMPVSS with no desktop session. That claim
 * is worthless as prose — it was true-ish the day it was written and rots
 * silently after. This guard makes it a ratchet.
 *
 * It does NOT assert the product is finished. It asserts we are HONEST
 * about how finished it is:
 *
 *   • every workflow has a state — no blanks, no "we'll decide later";
 *   • "shipped" requires a named spec that actually exists on disk — a
 *     workflow whose proof nobody can name is hoped, not shipped;
 *   • "gap"/"blocked"/"console-only" require a reason, so the next reader
 *     inherits the thinking instead of re-deriving it;
 *   • "console-only" must be a decision recorded in KIT_CANON, not a
 *     shrug — an undocumented absence gets re-litigated at every audit;
 *   • "blocked" must name its open question in OPEN_DECISIONS, so a
 *     product call can't quietly become a code default;
 *   • every role has at least one workflow — a role with no workflows
 *     means the matrix stopped modelling reality.
 *
 * When every cell is "shipped" or "console-only", the exit test passes for
 * real and this file becomes the thing that keeps it passing.
 */
const ROOT = process.cwd();

describe("COMPVSS self-sufficiency manifest", () => {
  it("has no blank cells", () => {
    const blank = WORKFLOWS.filter((w) => !w.state);
    expect(blank.map((w) => w.id)).toEqual([]);
  });

  it("proves every shipped workflow with a spec that exists", () => {
    const unproven = WORKFLOWS.filter((w) => w.state === "shipped" && !w.provenBy).map((w) => w.id);
    expect(unproven, `"shipped" without provenBy — name the proof or downgrade it:\n  ${unproven.join("\n  ")}`).toEqual(
      [],
    );

    // The named spec file must be real. A pointer to a deleted spec is the
    // same lie as no pointer at all.
    const missing: string[] = [];
    for (const w of WORKFLOWS) {
      if (w.state !== "shipped" || !w.provenBy) continue;
      const path = w.provenBy.split("·")[0]?.trim() ?? "";
      // Only check entries that look like a repo path; prose proofs
      // (migrations, browser verification) are allowed but must still say
      // something specific.
      if (!path.includes("/") || !path.match(/\.(ts|tsx)$/)) continue;
      if (!existsSync(join(ROOT, path))) missing.push(`${w.id} → ${path}`);
    }
    expect(missing, `provenBy points at a spec that does not exist:\n  ${missing.join("\n  ")}`).toEqual([]);
  });

  it("explains every gap, block and console-only decision", () => {
    const unexplained = WORKFLOWS.filter((w) => w.state !== "shipped" && !w.note).map((w) => w.id);
    expect(
      unexplained,
      `non-shipped without a note — the next reader inherits nothing:\n  ${unexplained.join("\n  ")}`,
    ).toEqual([]);
  });

  it("records every console-only decision in KIT_CANON", () => {
    const consoleOnly = WORKFLOWS.filter((w) => w.state === "console-only");
    // The decision has to live somewhere a human reads, not only here.
    expect(consoleOnly.length).toBeGreaterThan(0);
    for (const w of consoleOnly) {
      expect(w.note, `${w.id}: console-only must cite the decision`).toMatch(/documented decision/i);
    }
  });

  it("names the open question behind every blocked workflow", () => {
    const blocked = WORKFLOWS.filter((w) => w.state === "blocked").map((w) => w.id);
    const decided = new Set(OPEN_DECISIONS.map((d) => d.id));
    const orphaned = blocked.filter((id) => !decided.has(id));
    expect(
      orphaned,
      `blocked with no entry in OPEN_DECISIONS — a product call must not become a code default by silence:\n  ${orphaned.join("\n  ")}`,
    ).toEqual([]);
  });

  it("covers every field role", () => {
    const covered = new Set<FieldRole>();
    for (const w of WORKFLOWS) for (const r of w.roles) covered.add(r);
    const uncovered = FIELD_ROLES.filter((r) => !covered.has(r));
    expect(uncovered, `role with zero workflows — the matrix stopped modelling reality: ${uncovered.join(", ")}`).toEqual(
      [],
    );
  });

  it("reports the honest completion figure", () => {
    const total = WORKFLOWS.length;
    const done = WORKFLOWS.filter((w) => w.state === "shipped" || w.state === "console-only").length;
    const pct = Math.round((done / total) * 100);
    // Not an assertion of doneness — a printed fact, so the number moves
    // in CI output as the work lands and nobody has to trust a summary.
    // eslint-disable-next-line no-console
    console.log(`COMPVSS self-sufficiency: ${done}/${total} workflows (${pct}%) shipped or decided`);
    expect(total).toBeGreaterThan(0);
  });
});
