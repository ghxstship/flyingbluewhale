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
  it("no hand-rolled brand buttons (`bg-[var(--p-accent)]` + `text-white`)", () => {
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
      "src/components/mobile/FAB.tsx",
      "src/components/NotificationsBell.tsx",
      // Calendar day-cell highlight (today marker — semantic indicator, not a button)
      "src/app/(platform)/console/schedule/ScheduleCalendar.tsx",
      // Phase-stepper active-step dot (XPMS Axis B chrome — semantic indicator, not a button)
      "src/components/xpms/PhaseStepper.tsx",
      // Sign / Decline mode toggle (segmented-control pattern, not a primary button)
      "src/app/(portal)/p/[slug]/client/proposals/[proposalId]/approvals/[approvalId]/ApprovalSignBlock.tsx",
      // Pipeline switcher pill row (segmented-control pattern, not a primary button)
      "src/app/(platform)/console/pipeline/page.tsx",
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
      //   bg-[var(--p-accent)] … text-white  (accent button)
      //   bg-[var(--p-danger)] … text-white  (destructive button)
      if (/bg-\[var\(--(?:org-primary|color-error)\)\][^"]*text-white/.test(txt)) {
        offenders.push(rel);
      }
    }
    expect(
      offenders,
      `Hand-rolled brand/danger buttons — use <Button variant="primary"|"danger"> instead: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it("no hand-rolled form-error boxes (`border-[color:var(--p-danger)]/40`)", () => {
    const ALLOW = new Set<string>(["src/components/ui/Alert.tsx", "src/app/design-system.test.ts"]);
    const offenders: string[] = [];
    for (const file of ALL_FILES) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOW.has(rel)) continue;
      const txt = readFileSync(file, "utf8");
      // Signature of the old pattern: border-*-error + bg-*-error + text-*-error
      // all on the same div.
      if (
        /border-\[[^\]]*color-error[^\]]*\][^>]*bg-\[[^\]]*color-error[^\]]*\][^>]*text-\[[^\]]*color-error/.test(txt)
      ) {
        offenders.push(rel);
      }
    }
    expect(offenders, `Hand-rolled error boxes — use <Alert kind="error"> instead: ${offenders.join(", ")}`).toEqual(
      [],
    );
  });

  it("no hand-rolled runtime-state pills (`bg-{emerald|amber|sky|rose}-500/10 text-{…}-700`)", () => {
    const ALLOW = new Set<string>([
      // Primitive + its CSS tokens
      "src/components/ui/StatusChip.tsx",
      "src/components/ui/GlobalBanner.tsx",
      // Marketing changelog categories (editorial design with fixed palette)
      "src/app/(marketing)/changelog/page.tsx",
      // Diff renderer — added/removed chunk coloring, not a runtime state pill
      "src/components/charts/DiffViewer.tsx",
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

  it('no hand-rolled brand-tinted tag pills (use <Badge variant="brand-soft">)', () => {
    const ALLOW = new Set<string>([
      "src/components/ui/Badge.tsx",
      // Icon backgrounds, not tag pills (h-9 w-9 rounded-full container)
      "src/app/(marketing)/contact/page.tsx",
      "src/app/(marketing)/about/page.tsx",
      "src/app/(marketing)/careers/page.tsx",
      "src/app/(marketing)/help/page.tsx",
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
      if (/bg-\[var\(--p-accent\)\]\/10[^"]*text-\[var\(--p-accent\)\]/.test(txt)) {
        offenders.push(rel);
      }
    }
    expect(
      offenders,
      `Hand-rolled brand-tinted pills — use <Badge variant="brand-soft">: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it('no `[data-theme="dark"]` CSS selectors (dead — should be `[data-mode="dark"]`)', () => {
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
      "src/components/stage-plots/NewStagePlotButton.tsx",
      // Same pattern — trash button on a step card inside an automation editor.
      "src/components/automations/StepCard.tsx",
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
    expect(offenders, `\`window.confirm\` bypasses <Dialog>: ${offenders.join(", ")}`).toEqual([]);
  });

  it("no raw Tailwind color-scale literals — token vars only", () => {
    // Every paint must route through a CSS var (--p-success,
    // --p-warning, --p-danger, --p-info, --p-accent,
    // --p-text-*, --p-border, --p-surface*, etc.). A hardcoded
    // `bg-emerald-500` / `text-amber-700` / `bg-red-500/10` bypasses
    // the token contract and silently drifts from the kit's canonical
    // hex values (success #2fbf71 ≠ emerald #10b981, etc.). When the
    // kit's product palette updates, those literals stay frozen.
    //
    // Pattern catches utilities of the form
    //   {prefix}-{color}-{scale}[/opacity]
    // for every Tailwind color-scale palette name. Neutrals (slate,
    // gray, zinc, neutral, stone) are included — use --p-text-* /
    // --p-border / --p-surface-* tokens instead.
    const TAILWIND_PALETTE_RE =
      /\b(bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|caret|accent|divide|placeholder)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900|950)\b/;
    const ALLOW = new Set<string>([
      // Print-medium pages set hex inline for the printed sheet; the
      // on-screen banner above the print rules uses tokens already.
      // (Update this allowlist only when the page truly cannot consume
      // a CSS variable — e.g. @media print sheets.)
    ]);
    const offenders: string[] = [];
    for (const file of ALL_FILES) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOW.has(rel)) continue;
      // Skip test files — they may reference these classes as test data.
      if (/\.test\.tsx?$/.test(rel)) continue;
      const txt = readFileSync(file, "utf8");
      const lines = txt.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip pure-comment lines (// or *).
        if (/^\s*(\/\/|\*)/.test(line)) continue;
        if (TAILWIND_PALETTE_RE.test(line)) {
          offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
        }
      }
    }
    expect(
      offenders,
      `Raw Tailwind palette literals — replace with token vars (var(--p-success) / var(--p-warning) / var(--p-danger) / var(--p-info) / var(--p-accent) / var(--p-text-*) / var(--p-border) / var(--p-surface*)):\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("mobile responsiveness — no min-w hardcoded ≥ 375px outside allowlist", () => {
    // 375px is the iPhone SE / standard small-phone viewport. Any
    // `min-w-[Xpx]` ≥ 375 on a primitive that doesn't sit inside an
    // `overflow-x-auto` parent is a horizontal-scroll bug waiting to
    // happen. Calendar / Gantt / Wide-grid surfaces are allow-listed
    // because they intentionally render wider than mobile + are
    // wrapped in a scroll container at the page level.
    const MIN_W_RE = /\bmin-w-\[(\d{3,})(?:px|rem)\]/g;
    const ALLOW = new Set<string>([
      // Calendars: month/week grids intentionally exceed 375px and are
      // wrapped in `overflow-x-auto` containers by the parent page.
      "src/components/views/CalendarWeekGrid.tsx",
      "src/components/views/CalendarMonthGrid.tsx",
      // Schedule / Gantt: same pattern as calendars.
      "src/app/(platform)/console/schedule/baselines/[id]/gantt/page.tsx",
      // RiskHeatmap renders a row-per-risk grid that needs horizontal
      // scroll on mobile — wrapped at the page level.
      "src/app/(platform)/console/programs/risk/RiskHeatmap.tsx",
      // TrackerView columns target a desktop table layout; parent
      // wraps in overflow-x-auto via .console-content media query.
      "src/components/xpms/TrackerView.tsx",
      // Pricing comparison table — wider than mobile by design,
      // wrapped in `overflow-x-auto` (confirmed at line 328).
      "src/app/(marketing)/pricing/page.tsx",
    ]);
    const offenders: string[] = [];
    for (const file of ALL_FILES) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOW.has(rel)) continue;
      if (/\.test\.tsx?$/.test(rel)) continue;
      const txt = readFileSync(file, "utf8");
      const lines = txt.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*(\/\/|\*)/.test(line)) continue;
        let m: RegExpExecArray | null;
        const re = new RegExp(MIN_W_RE.source, "g");
        while ((m = re.exec(line)) !== null) {
          const px = parseInt(m[1], 10);
          // Treat rem ≥ 24 as ≥ 384px (24×16). Conservative threshold.
          if (px >= 375) {
            offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
          }
        }
      }
    }
    expect(
      offenders,
      `Hardcoded min-widths ≥ 375px outside the calendar/gantt allowlist will overflow the mobile viewport. Wrap the offending block in an \`overflow-x-auto\` container OR move the min-width into a responsive class (\`min-w-0 md:min-w-[Xpx]\`):\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("no dead Bermuda-Triangle / HVRBOR font references survive", () => {
    // The pre-v3 codebase loaded Anton / Bebas Neue / Share Tech /
    // Share Tech Mono / DM Sans for the dead Bermuda Triangle stack and
    // Fraunces / Instrument Serif / DM Serif Display / Bricolage / Geist
    // / Geist Mono / Cormorant Garamond for the CHROMA BEACON 8-theme
    // picker. Both were retired with the two-skin lock (453bbd7c) and
    // the v3 ATLVS kit. Re-importing any of them or referencing the
    // matching `--font-*` CSS var resurrects dead bytes on every page.
    const DEAD_FONTS = [
      "Anton",
      "Bebas_Neue",
      "Share_Tech",
      "Share_Tech_Mono",
      "DM_Sans",
      "Fraunces",
      "Instrument_Serif",
      "DM_Serif_Display",
      "Bricolage_Grotesque",
      "Geist",
      "Geist_Mono",
      "Cormorant_Garamond",
    ];
    const DEAD_VARS = [
      "--font-anton",
      "--font-bebas-neue",
      "--font-share-tech",
      "--font-share-tech-mono",
      "--font-dm-sans",
      "--font-fraunces",
      "--font-instrument-serif",
      "--font-dm-serif-display",
      "--font-bricolage",
      "--font-geist",
      "--font-geist-mono",
      "--font-serif",
    ];
    const importRe = new RegExp(`\\b(${DEAD_FONTS.join("|")})\\b`);
    const varRe = new RegExp(`var\\((${DEAD_VARS.join("|")})\\b`);
    const ALLOW = new Set<string>([
      // The design-system test itself enumerates the dead names.
      "src/app/design-system.test.ts",
    ]);
    const offenders: string[] = [];
    const scan = walk(SRC_DIR).filter((f) => /\.(tsx?|css|md)$/.test(f));
    for (const file of scan) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOW.has(rel)) continue;
      // Skip memory/history docs — they reference dead canon as history.
      if (/\.md$/.test(rel) && /README|memory/i.test(rel)) continue;
      const txt = readFileSync(file, "utf8");
      const lines = txt.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*(\/\/|\*|#)/.test(line)) continue;
        if (importRe.test(line) || varRe.test(line)) {
          offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
        }
      }
    }
    expect(
      offenders,
      `Dead-font references resurrect the Bermuda Triangle / CHROMA BEACON typography purged in commit 34b0b073:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("mobile responsiveness — platform sidebar carries the `hidden md:flex/block` toggle", () => {
    // PlatformSidebar (240px) and PortalRail (224px) must hide at
    // viewports below `md` (768px); the topbar MobileNavDrawer replaces
    // them. Without this, a 375px phone gives 135px / 151px main
    // content — sub-readable.
    const sidebarTxt = readFileSync(join(REPO_ROOT, "src/components/PlatformSidebar.tsx"), "utf8");
    const shellTxt = readFileSync(join(REPO_ROOT, "src/components/Shell.tsx"), "utf8");
    expect(
      sidebarTxt.includes("hidden md:block") || sidebarTxt.includes("hidden md:flex"),
      "PlatformSidebar must hide below md — add `hidden md:block` (or `md:flex`) to the outer <aside>",
    ).toBe(true);
    expect(
      shellTxt.includes("hidden w-56") && shellTxt.includes("md:flex"),
      "PortalRail (Shell.tsx) must hide below md — add `hidden md:flex` to the outer <aside>",
    ).toBe(true);
  });
});
