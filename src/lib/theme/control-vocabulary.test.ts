import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Control-vocabulary guard (R2 canonization sweep, 2026-07-22).
 *
 * Form controls and buttons speak the kit vocabulary — `.ps-input` (+ `--sm`
 * / `--lg`) and `.ps-btn` (+ `--ghost` / `--sm` / `--cta` / …). Hand-rolled
 * re-implementations (`rounded-md border border-[var(--p-border)]
 * bg-[var(...)] px-3 py-2 with a forked bg token`) silently lose the focus ring, the
 * density axis, the disabled affordance, and fork the control background
 * between `--p-bg` and `--p-surface`. The 2026-07-22 sweep replaced ~80 such
 * sites; this test pins the residual so the pattern can't creep back.
 *
 * Heuristic: walk every `.tsx` under the four app shells — (platform),
 * (mobile), (portal), (legend) — and flag any `<input|select|textarea|button>`
 * whose className carries the hand-rolled control cluster:
 *   border-[var(--p-border…)]  AND  a px-* + py-* padding pair
 * without any `ps-input` / `ps-btn` class. Non-control elements (divs, chips,
 * anchors, wrappers) are out of scope — composed surfaces legitimately reuse
 * the border+padding cluster.
 *
 * Sanctioned exceptions (distinct primitives, NOT ps-btn/ps-input duplicates):
 * each entry pins a file to its exact current count. Shrinking is welcome
 * (tighten the pin); growing fails.
 */

const ROOT = process.cwd();
const SHELLS = [
  "src/app/(platform)",
  "src/app/(mobile)",
  "src/app/(portal)",
  "src/app/(legend)",
];

/**
 * file (repo-relative, forward slashes) -> allowed match count.
 *
 * - BrandingForm.tsx — branding surface owned by the branding/map exclusion
 *   lane of the canonization program; swept separately.
 * - WhatsNewClient.tsx — selectable filter PILL (rounded-full, selected =
 *   accent fill). A `.ps-chip--selectable` candidate, not a ps-btn.
 * - ConsoleChat.tsx — message reaction chip (rounded-full, mine/other accent
 *   states); a chip primitive, not a button.
 * - ProposalEditor.tsx — rounded-full add-item pill; pill affordance is
 *   intentional (ps-btn is r-sm).
 * - gantt-client.tsx — segmented lookahead toggle (selected = filled step);
 *   segmented-control affordance, not a ps-btn.
 */
const SANCTIONED: Record<string, number> = {
  "src/app/(platform)/studio/projects/[projectId]/branding/BrandingForm.tsx": 1,
  "src/app/(platform)/studio/help/whats-new/WhatsNewClient.tsx": 1,
  "src/app/(platform)/studio/inbox/ConsoleChat.tsx": 1,
  "src/app/(platform)/studio/proposals/[proposalId]/edit/ProposalEditor.tsx": 1,
  "src/app/(platform)/studio/schedule/baselines/[id]/gantt-client.tsx": 1,
};

const CONTROL_TAGS = new Set(["input", "select", "textarea", "button"]);
// className="…" | className={`…`} | className={"…"}
const CLASSNAME = /className=(?:"([^"]*)"|\{\s*`([^`]*)`\s*\}|\{\s*"([^"]*)"\s*\})/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".tsx") && !/\.test\.tsx$/.test(p)) out.push(p);
  }
  return out;
}

type Violation = { file: string; line: number; tag: string; cls: string };

function scan(): Violation[] {
  const violations: Violation[] = [];
  for (const shell of SHELLS) {
    let files: string[] = [];
    try {
      files = walk(join(ROOT, shell));
    } catch {
      continue; // shell absent in a partial checkout
    }
    for (const f of files) {
      const rel = relative(ROOT, f).replaceAll("\\", "/");
      const src = readFileSync(f, "utf8");
      CLASSNAME.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = CLASSNAME.exec(src))) {
        const cls = m[1] ?? m[2] ?? m[3] ?? "";
        // the hand-rolled control cluster
        if (!/border-\[var\(--p-border/.test(cls)) continue;
        if (!/\bpx-[\d.]/.test(cls) || !/\bpy-[\d.]/.test(cls)) continue;
        // already on the kit vocabulary
        if (/\bps-(input|btn)\b/.test(cls)) continue;
        // owning element must be a form control / button
        const before = src.slice(0, m.index);
        const tagMatch = before.match(/<([a-zA-Z][\w.]*)(?:\s[^<]*)?$/);
        const tag = tagMatch?.[1] ?? "";
        if (!CONTROL_TAGS.has(tag)) continue;
        violations.push({ file: rel, line: before.split("\n").length, tag, cls });
      }
    }
  }
  return violations;
}

describe("control vocabulary (.ps-input / .ps-btn) — shell TSX", () => {
  const violations = scan();
  const byFile = new Map<string, Violation[]>();
  for (const v of violations) {
    const list = byFile.get(v.file) ?? [];
    list.push(v);
    byFile.set(v.file, list);
  }

  it("no unsanctioned hand-rolled control styling (target 0)", () => {
    const offenders: string[] = [];
    for (const [file, list] of byFile) {
      const allowed = SANCTIONED[file] ?? 0;
      if (list.length > allowed) {
        for (const v of list) {
          offenders.push(
            `${v.file}:${v.line} <${v.tag}> — hand-rolled control chrome ` +
              `(${list.length} in file, ${allowed} sanctioned). ` +
              `Use className="ps-input w-full" (controls) or "ps-btn ps-btn--ghost|--sm|--cta" (buttons).`,
          );
        }
      }
    }
    expect(
      offenders,
      `Hand-rolled control styling found — bind to the .ps-input/.ps-btn kit vocabulary instead:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("sanctioned exception list stays honest (no dead entries)", () => {
    // If a sanctioned file drops its exception, tighten the pin here so the
    // allowlist can't be silently repurposed by a future regression.
    const dead: string[] = [];
    for (const [file, allowed] of Object.entries(SANCTIONED)) {
      const actual = byFile.get(file)?.length ?? 0;
      if (actual < allowed) dead.push(`${file}: sanctioned ${allowed}, found ${actual} — lower the pin`);
    }
    expect(dead, `Stale sanction entries:\n${dead.join("\n")}`).toEqual([]);
  });
});
