import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Design-system guardrails (UI canonicalization audit).
 *
 * Each check walks the source tree and fails CI on regressions we've
 * already paid to clean up. The allowlists are narrow — `ui/`
 * primitives, `/theme/` definitions, and `@react-pdf/renderer` PDFs
 * which can't consume CSS variables.
 */

const REPO_ROOT = process.cwd();
const SRC_DIR = join(REPO_ROOT, "src");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      out.push(...walk(full));
    } else if (st.isFile()) {
      out.push(full);
    }
  }
  return out;
}

const ALL_FILES = walk(SRC_DIR).filter((f) => /\.(tsx?)$/.test(f));

describe("Design system — component primitive adoption", () => {
  it("no hand-rolled brand buttons (`bg-[var(--org-primary)]` + `text-white`)", () => {
    const ALLOW = new Set<string>([
      // Primitives themselves
      "src/components/ui/Button.tsx",
      "src/components/ui/DatePicker.tsx",
      "src/components/ui/Combobox.tsx",
      "src/components/ui/DensityToggle.tsx",
      "src/components/ui/ThemeToggle.tsx",
      "src/components/ui/Checkbox.tsx",
      "src/components/ui/RadioGroup.tsx",
      // Controlled state indicators (not buttons)
      "src/components/forms/Wizard.tsx",
      "src/components/mobile/FAB.tsx",
      "src/components/NotificationsBell.tsx",
      // Clerk / auth UI overrides
      "src/app/layout.tsx",
      // Stage-plot SVG (paper-white fill, not a button)
      "src/components/stage-plots/StagePlotCanvas.tsx",
      // Incident photo overlay (translucent remove button)
      "src/components/incidents/IncidentForm.tsx",
      // Self-reference — this spec names the regex in a doc comment.
      "src/app/design-system.test.ts",
    ]);
    const offenders: string[] = [];
    for (const file of ALL_FILES) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOW.has(rel)) continue;
      const txt = readFileSync(file, "utf8");
      // The danger combination:
      //   bg-[var(--org-primary)] … text-white  (accent button)
      //   bg-[var(--color-error)] … text-white  (destructive button)
      if (/bg-\[var\(--(?:org-primary|color-error)\)\][^"]*text-white/.test(txt)) {
        offenders.push(rel);
      }
    }
    expect(
      offenders,
      `Hand-rolled brand/danger buttons — use <Button variant="primary"|"danger"> instead: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it("no hand-rolled form-error boxes (`border-[color:var(--color-error)]/40`)", () => {
    const ALLOW = new Set<string>([
      "src/components/ui/Alert.tsx",
      "src/app/design-system.test.ts",
    ]);
    const offenders: string[] = [];
    for (const file of ALL_FILES) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOW.has(rel)) continue;
      const txt = readFileSync(file, "utf8");
      // Signature of the old pattern: border-*-error + bg-*-error + text-*-error
      // all on the same div.
      if (
        /border-\[[^\]]*color-error[^\]]*\][^>]*bg-\[[^\]]*color-error[^\]]*\][^>]*text-\[[^\]]*color-error/.test(
          txt,
        )
      ) {
        offenders.push(rel);
      }
    }
    expect(
      offenders,
      `Hand-rolled error boxes — use <Alert kind="error"> instead: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it("no hand-rolled runtime-state pills (`bg-{emerald|amber|sky|rose}-500/10 text-{…}-700`)", () => {
    const ALLOW = new Set<string>([
      // Primitive + its CSS tokens
      "src/components/ui/StatusChip.tsx",
      "src/components/ui/GlobalBanner.tsx",
      // Marketing changelog categories (editorial design with fixed palette)
      "src/app/(marketing)/changelog/page.tsx",
    ]);
    const offenders: string[] = [];
    for (const file of ALL_FILES) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOW.has(rel)) continue;
      const txt = readFileSync(file, "utf8");
      if (/bg-(?:emerald|amber|sky|rose|slate)-500\/10[^"]*text-(?:emerald|amber|sky|rose|slate)-[67]00/.test(txt)) {
        offenders.push(rel);
      }
    }
    expect(
      offenders,
      `Hand-rolled runtime status pills — use <StatusChip tone="success|info|warning|danger|neutral">: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it("no hand-rolled brand-tinted tag pills (use <Badge variant=\"brand-soft\">)", () => {
    const ALLOW = new Set<string>([
      "src/components/ui/Badge.tsx",
      // Icon backgrounds, not tag pills (h-9 w-9 rounded-full container)
      "src/app/(marketing)/contact/page.tsx",
      "src/app/(marketing)/about/page.tsx",
      // Changelog editorial category palette
      "src/app/(marketing)/changelog/page.tsx",
      // Proposal progress segmented control
      "src/app/proposals/[token]/ProposalTopBar.tsx",
      // Self-reference
      "src/app/design-system.test.ts",
    ]);
    const offenders: string[] = [];
    for (const file of ALL_FILES) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOW.has(rel)) continue;
      const txt = readFileSync(file, "utf8");
      if (/bg-\[var\(--org-primary\)\]\/10[^"]*text-\[var\(--org-primary\)\]/.test(txt)) {
        offenders.push(rel);
      }
    }
    expect(
      offenders,
      `Hand-rolled brand-tinted pills — use <Badge variant="brand-soft">: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it("no `[data-theme=\"dark\"]` CSS selectors (dead — should be `[data-mode=\"dark\"]`)", () => {
    const css = readFileSync(join(REPO_ROOT, "src/app/globals.css"), "utf8");
    const offenders = css.split("\n").filter((l) => /\[data-theme="dark"\]/.test(l));
    expect(
      offenders,
      `Dead [data-theme="dark"] selectors in globals.css — no CHROMA theme uses slug "dark"; use [data-mode="dark"] instead:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("no `window.confirm` destructive prompts outside allowlist (use <Dialog>)", () => {
    const ALLOW = new Set<string>([
      // In-flow editor prompts where a modal is excessive UX.
      "src/components/ui/RichText.tsx",
      "src/components/stage-plots/NewStagePlotButton.tsx",
    ]);
    const offenders: string[] = [];
    for (const file of ALL_FILES) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOW.has(rel)) continue;
      const txt = readFileSync(file, "utf8");
      if (/window\.confirm\s*\(/.test(txt)) {
        offenders.push(rel);
      }
    }
    expect(
      offenders,
      `\`window.confirm\` bypasses <Dialog>: ${offenders.join(", ")}`,
    ).toEqual([]);
  });
});
