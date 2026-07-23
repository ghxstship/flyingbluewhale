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

/** String-aware comment stripper — comment bodies blanked, newlines kept so
 *  reported line numbers stay true; string literals (which may contain `//`,
 *  e.g. URLs) are never treated as comment openers. */
function stripCommentsPreservingLines(src: string): string {
  let out = "";
  let i = 0;
  let mode: "code" | "line" | "block" | '"' | "'" | "`" = "code";
  while (i < src.length) {
    const ch = src[i]!;
    const next = src[i + 1];
    if (mode === "code") {
      if (ch === "/" && next === "/") {
        mode = "line";
        i += 2;
      } else if (ch === "/" && next === "*") {
        mode = "block";
        i += 2;
      } else {
        if (ch === '"' || ch === "'" || ch === "`") mode = ch;
        out += ch;
        i++;
      }
    } else if (mode === "line") {
      if (ch === "\n") {
        mode = "code";
        out += ch;
      }
      i++;
    } else if (mode === "block") {
      if (ch === "*" && next === "/") {
        mode = "code";
        i += 2;
      } else {
        if (ch === "\n") out += ch;
        i++;
      }
    } else {
      if (ch === "\\") {
        out += ch + (next ?? "");
        i += 2;
      } else {
        if (ch === mode) mode = "code";
        out += ch;
        i++;
      }
    }
  }
  return out;
}

describe("Design system — component primitive adoption", () => {
  it("no hand-rolled brand buttons (`bg-[var(--p-accent)]` + `text-white`)", () => {
    const ALLOW = new Set<string>([
      // Primitives themselves
      "src/components/ui/Button.tsx",
      "src/components/ui/Combobox.tsx",
      "src/components/ui/DensityToggle.tsx",
      "src/components/ui/ThemeToggle.tsx",
      "src/components/ui/Checkbox.tsx",
      // Controlled state indicators (not buttons)
      "src/components/NotificationsBell.tsx",
      // Phase-stepper active-step dot (XPMS Axis B chrome — semantic indicator, not a button)
      "src/components/xpms/PhaseStepper.tsx",
      // Sign / Decline mode toggle (segmented-control pattern, not a primary button)
      "src/app/(portal)/p/[slug]/client/proposals/[proposalId]/approvals/[approvalId]/ApprovalSignBlock.tsx",
      // Pipeline switcher pill row (segmented-control pattern, not a primary button)
      "src/app/(platform)/studio/pipeline/page.tsx",
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
        const line = lines[i]!;
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
      "src/app/(platform)/studio/schedule/baselines/[id]/gantt/page.tsx",
      // RiskHeatmap renders a row-per-risk grid that needs horizontal
      // scroll on mobile — wrapped at the page level.
      "src/app/(platform)/studio/programs/risk/RiskHeatmap.tsx",
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
        const line = lines[i]!;
        if (/^\s*(\/\/|\*)/.test(line)) continue;
        let m: RegExpExecArray | null;
        const re = new RegExp(MIN_W_RE.source, "g");
        while ((m = re.exec(line)) !== null) {
          const px = parseInt(m[1]!, 10);
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

  it("no dead font references survive (Bermuda-Triangle / CHROMA BEACON / kit-v2)", () => {
    // Three retired typography stacks must not resurrect dead bytes:
    //  1. Bermuda Triangle / HVRBOR — Share Tech / Share Tech Mono / DM Sans
    //     (retired with the two-skin lock 453bbd7c).
    //  2. CHROMA BEACON 8-theme picker — Fraunces / Instrument Serif / DM
    //     Serif Display / Bricolage / Geist / Geist Mono / Cormorant Garamond.
    //  3. Kit v2 "Industrial Wide" — Archivo (display) / Space Grotesk (body)
    //     plus the never-canon Inter / JetBrains Mono — all superseded by the
    //     v3 "MONUMENT" stack, ratified 2026-06-13.
    //  NOTE: both Anton AND Bebas Neue are now CANONICAL and intentionally
    //  absent from this list. Type v8.0 "Wired Scale" (2026-07-05) made Bebas
    //  Neue the semantic HEADING face (h1/h2 + card/section/nav titles) and
    //  reserved Anton for DISPLAY + METRICS only (.ps-hero / .hed-* / KPIs).
    const DEAD_FONTS = [
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
      // kit v2 "Industrial Wide" faces — retired by MONUMENT (kit v3).
      "Archivo",
      "Space_Grotesk",
      "JetBrains_Mono",
    ];
    const DEAD_VARS = [
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
      // kit v2 "Industrial Wide" + never-canon faces — retired by MONUMENT.
      "--font-archivo",
      "--font-space-grotesk",
      "--font-inter",
      "--font-jetbrains-mono",
    ];
    const importRe = new RegExp(`\\b(${DEAD_FONTS.join("|")})\\b`);
    const varRe = new RegExp(`var\\((${DEAD_VARS.join("|")})\\b`);
    const ALLOW = new Set<string>([
      // The design-system test itself enumerates the dead names.
      "src/app/design-system.test.ts",
      // The v8.1 trend axis (opt-in [data-trend] personalization) deliberately
      // uses Space Grotesk / Archivo Black / Fraunces / Baloo 2 / Poppins /
      // Orbitron as trend DISPLAY faces — distinct from the retired v2 DEFAULT
      // stack. They render only when a user explicitly picks a trend, behind a
      // safe fallback chain (Anton / Hanken Grotesk). Sanctioned by the kit.
      "src/app/theme/kit-trends.css",
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
        const line = lines[i]!;
        if (/^\s*(\/\/|\*|#)/.test(line)) continue;
        if (importRe.test(line) || varRe.test(line)) {
          offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
        }
      }
    }
    expect(
      offenders,
      `Dead-font references resurrect retired typography (Bermuda Triangle / CHROMA BEACON / kit-v2 Industrial Wide). The canonical stack is MONUMENT "Wired Scale" (v8.0) — Bebas Neue (headings) + Anton (display/metrics) + Hanken Grotesk + Space Mono + Jost:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("kit v8.1 palette-locked (OKLCH) — per-product accents + ATLVS-red house accent, no retired cyan hexes survive in src/", () => {
    // v8.0 palette-locked: each product owns its accent (ATLVS red · COMPVSS
    // yellow · GVTEWAY blue · LEG3ND orange) and GHXSTSHIP green is the house/
    // marketing default. The retired cyan hexes (v5.1, pre-blue) must still
    // never resurface in src/ — distinct from CVRGO's cargo cyan #06b6d4.
    const DEAD_CYAN = ["#12b5b5", "#0b7e7e", "#2bd6d6", "#3fe0e0", "#0e9e9e"];
    const deadRe = new RegExp(`(${DEAD_CYAN.join("|")})`, "i");
    const ALLOW = new Set<string>([
      // The design-system test itself enumerates the dead hexes.
      "src/app/design-system.test.ts",
    ]);
    const scan = walk(SRC_DIR).filter((f) => /\.(tsx?|css)$/.test(f));
    const offenders: string[] = [];
    for (const file of scan) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOW.has(rel)) continue;
      const txt = readFileSync(file, "utf8");
      const lines = txt.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (deadRe.test(lines[i]!)) offenders.push(`${rel}:${i + 1}: ${lines[i]!.trim().slice(0, 120)}`);
      }
    }
    expect(
      offenders,
      `Retired cyan hexes survive — these brand colors are dead:\n${offenders.join("\n")}`,
    ).toEqual([]);

    // Positive assertion: as of v8.1 the color layer is authored in OKLCH +
    // light-dark(). The ATLVS volcanic-red seed (sRGB-equal of #e23414) is the
    // base accent and the cold-start default for house/marketing surfaces.
    // Ratified 2026-07-17: there is NO GHXSTSHIP theme (identity mark only) —
    // no --brand-ghxstship* seeds, no ghxstship product/platform scopes. The
    // retired house green (#2edb3a, or its OKLCH hue ~143) must not survive.
    const theme = readFileSync(join(REPO_ROOT, "src/app/theme/themes/atlvs-product.css"), "utf8");
    expect(theme, "ATLVS volcanic-red OKLCH seed must be present").toMatch(
      /--brand-atlvs:\s*oklch\(0\.5964 0\.2136 32\.25\)/i,
    );
    expect(theme, "ATLVS product accent must resolve from the ATLVS seed").toMatch(
      /\[data-product="atlvs"\][\s\S]*?--p-accent:\s*light-dark\(var\(--brand-atlvs\)/i,
    );
    expect(theme, "no GHXSTSHIP theming — --brand-ghxstship* seeds are removed").not.toMatch(/--brand-ghxstship/i);
    expect(theme, "no GHXSTSHIP theming — product/platform scopes are removed").not.toMatch(
      /data-(?:product|platform)="ghxstship"/i,
    );
    expect(theme, "retired house green #2edb3a must not survive").not.toMatch(/#2edb3a/i);
  });

  it("no bare legacy color tokens — --success/--warning/--danger/--info must be --p-*", () => {
    // The bare (--success / --warning / --danger / --info) namespace was deleted
    // in the v6.4 alignment; only --p-* survives. A bare reference resolves to
    // nothing — a silent colorless-rendering bug (e.g. status dots, checkmarks).
    const BARE = /var\(\s*--(?:success|warning|danger|info)\s*\)/;
    const scan = walk(SRC_DIR).filter((f) => /\.(tsx?|css)$/.test(f));
    const offenders: string[] = [];
    for (const file of scan) {
      const rel = relative(REPO_ROOT, file);
      if (rel === "src/app/design-system.test.ts") continue;
      const lines = readFileSync(file, "utf8").split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (BARE.test(lines[i]!)) offenders.push(`${rel}:${i + 1}: ${lines[i]!.trim().slice(0, 120)}`);
      }
    }
    expect(
      offenders,
      `Bare legacy color tokens found — use var(--p-success) / var(--p-warning) / var(--p-danger) / var(--p-info):\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("kit v5.1 — role-based --p-case-* casing tokens are defined + wired", () => {
    // v5.1 made casing token-controlled. The base block must define the role
    // tokens, and the consuming primitives must read them (never hardcode).
    const theme = readFileSync(join(REPO_ROOT, "src/app/theme/themes/atlvs-product.css"), "utf8");
    for (const tok of ["--p-case-eyebrow", "--p-case-label", "--p-case-button", "--p-case-tablehead", "--p-case-body"]) {
      expect(theme, `Missing v5.1 casing token ${tok}`).toContain(tok);
    }
    // .ps-btn must read the button casing token (sentence case by default).
    expect(theme, ".ps-btn must consume var(--p-case-button)").toMatch(/text-transform:\s*var\(--p-case-button/);
    // table headers + eyebrows must consume their casing tokens.
    expect(theme, "table headers must consume var(--p-case-tablehead)").toMatch(/text-transform:\s*var\(--p-case-tablehead/);
    expect(theme, "eyebrows must consume var(--p-case-eyebrow)").toMatch(/text-transform:\s*var\(--p-case-eyebrow/);
  });

  it("mobile responsiveness — platform sidebar carries the `hidden md:flex/block` toggle", () => {
    // PlatformSidebar (240px) and PortalRail (224px) must hide at
    // viewports below `md` (768px); the topbar MobileNavDrawer replaces
    // them. Without this, a 375px phone gives 135px / 151px main
    // content — sub-readable.
    const sidebarTxt = readFileSync(join(REPO_ROOT, "src/components/PlatformSidebar.tsx"), "utf8");
    // PortalRail was extracted from Shell.tsx into its own module.
    const railTxt = readFileSync(join(REPO_ROOT, "src/components/PortalRail.tsx"), "utf8");
    expect(
      sidebarTxt.includes("hidden md:block") || sidebarTxt.includes("hidden md:flex"),
      "PlatformSidebar must hide below md — add `hidden md:block` (or `md:flex`) to the outer <aside>",
    ).toBe(true);
    expect(
      railTxt.includes("hidden w-56") && railTxt.includes("md:flex"),
      "PortalRail (PortalRail.tsx) must hide below md — add `hidden md:flex` to the outer <aside>",
    ).toBe(true);
  });

  it("GH-1 — raw hex colors in TSX may only shrink (pinned legacy debt)", () => {
    // The palette guard above matches Tailwind CLASS literals only; raw hex in
    // JSX props, SVG attributes, and inline TS constants sailed past it (lane-F
    // GH-1: StagePlotCanvas slate hexes, MapShell fallback blue). This ratchet
    // scans every non-test TSX line for hex color literals.
    //
    // Sanctioned media that genuinely cannot consume CSS variables are EXEMPT:
    //   - src/lib/pdf/**            (@react-pdf/renderer)
    //   - src/app/og/** + opengraph-image (satori image generation)
    //   - */print/page.tsx          (print-sheet palettes, W7 consolidates)
    //   - email/social/OAuth mirrors (guarded for tokens.json containment by
    //     coldstart-fallback-tokens.test.ts instead)
    //
    // Everything else is legacy debt pinned at the 2026-07-22 count. The pin
    // may ONLY SHRINK — new raw hexes fail immediately; when you fix a spot,
    // lower the pin. Target: 0 (remediation waves W2/W5 + owner ruling 4
    // re-seeds the branding/proposal seed hexes).
    const LEGACY_HEX_PIN = 90;
    const HEX_RE = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/;
    const EXEMPT_RE = [/^src\/lib\/pdf\//, /^src\/app\/og\//, /^src\/app\/opengraph-image/, /print\/page\.tsx$/];
    const ALLOW = new Set<string>([
      "src/components/email/blocks.ts",
      "src/components/social/SocialCard.tsx",
      "src/components/auth/OAuthButtons.tsx",
    ]);
    const offenders: string[] = [];
    for (const file of ALL_FILES) {
      const relPath = relative(REPO_ROOT, file);
      if (!relPath.endsWith(".tsx")) continue;
      if (ALLOW.has(relPath) || EXEMPT_RE.some((re) => re.test(relPath))) continue;
      const lines = stripCommentsPreservingLines(readFileSync(file, "utf8")).split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (HEX_RE.test(lines[i]!)) offenders.push(`${relPath}:${i + 1}`);
      }
    }
    expect(
      offenders.length,
      `Raw hex color literals in TSX grew past the pinned legacy count (${LEGACY_HEX_PIN}). ` +
        `New paint must route through var(--p-*) / var(--chart-*). If you cleaned spots, shrink the pin.\n` +
        offenders.join("\n"),
    ).toBeLessThanOrEqual(LEGACY_HEX_PIN);
  });

  it("kit v7.1 — platform contracts (forced-colors / prefers-contrast / print / RTL) are present + imported", () => {
    // The v7.1 enrichment layer (ported from the kit tokens/base.css) restores
    // keyboard focus in Windows HCM, firms contrast on request, prints legibly,
    // and ships the RTL/logical-property canon. Guard the file + its import.
    const platform = readFileSync(join(REPO_ROOT, "src/app/theme/kit-platform.css"), "utf8");
    expect(platform, "forced-colors focus restoration missing").toMatch(/@media\s*\(forced-colors:\s*active\)/);
    expect(platform, "prefers-contrast firming missing").toMatch(/@media\s*\(prefers-contrast:\s*more\)/);
    expect(platform, "print floor missing").toMatch(/@media\s*print/);
    expect(platform, "RTL flip canon missing").toContain('[dir="rtl"]');
    expect(platform, "logical-property rail utility missing").toContain("border-inline-start");
    const index = readFileSync(join(REPO_ROOT, "src/app/theme/index.css"), "utf8");
    expect(index, "kit-platform.css must be imported from theme/index.css").toContain('@import "./kit-platform.css"');
  });
});
