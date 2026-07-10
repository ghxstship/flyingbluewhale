import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * WCAG contrast guard (alignment Move D2).
 *
 * `tokens.json#contrast.pairs` enumerates every text / link / CTA-fill /
 * focus-ring pair in the system with its foreground `value`, the `on`
 * background, the declared `ratio`, and the `min` it must clear (4.5:1 for
 * body/link text, 3:1 for focus rings + large/UI). This test RECOMPUTES each
 * ratio from the hexes and fails CI when any pair drops below `min` — so a
 * deliberately-broken token (e.g. text-3 reverted to the old #8C95A3 at 3.0:1)
 * can never ship. It also cross-checks the pair `value`s against the actual
 * `color.*` token blocks, so the metadata can't silently drift from the tokens
 * it certifies.
 */

const TOKENS = JSON.parse(
  readFileSync(join(process.cwd(), "src/app/theme/tokens.json"), "utf8"),
) as {
  color: {
    surface: Record<"light" | "dark", Record<string, string>>;
    accent: Record<string, Record<"light" | "dark", Record<string, string>>>;
  };
  chart: { series: Record<string, string> };
  contrast: { pairs: { id: string; value: string; on: string; ratio: number; min: number; wcag: string }[] };
};

function relativeLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const channels = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

const norm = (hex: string) => hex.toLowerCase();

describe("Design tokens — WCAG contrast (Move D2)", () => {
  it("every certified pair clears its AA floor", () => {
    const offenders: string[] = [];
    for (const p of TOKENS.contrast.pairs) {
      const ratio = contrastRatio(p.value, p.on);
      if (ratio < p.min) {
        offenders.push(`${p.id}: ${p.value} on ${p.on} = ${ratio.toFixed(2)}:1 < min ${p.min}`);
      }
    }
    expect(
      offenders,
      `Token pairs below their WCAG AA floor (deepen the foreground or its CTA pair):\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("declared ratios match the recomputed value (metadata stays honest)", () => {
    const drift: string[] = [];
    for (const p of TOKENS.contrast.pairs) {
      const ratio = contrastRatio(p.value, p.on);
      if (Math.abs(ratio - p.ratio) > 0.05) {
        drift.push(`${p.id}: declared ${p.ratio} but computes ${ratio.toFixed(2)} — restamp tokens.json#contrast`);
      }
    }
    expect(drift, `Stale contrast metadata:\n${drift.join("\n")}`).toEqual([]);
  });

  it("contrast pairs reference the live token values (no metadata fork)", () => {
    const s = TOKENS.color.surface;
    const a = TOKENS.color.accent;
    const find = (id: string) => TOKENS.contrast.pairs.find((p) => p.id === id)!;

    // Surface text-3 — the headline a11y fix; pair must equal the token.
    expect(norm(find("text-3.light.surface").value)).toBe(norm(s.light["text-3"]!));
    expect(norm(find("text-3.dark").value)).toBe(norm(s.dark["text-3"]!));

    // Each product's accent-text + accent-cta certify the real token values.
    for (const product of ["atlvs", "compvss", "gvteway", "legend", "ghxstship"] as const) {
      for (const mode of ["light", "dark"] as const) {
        expect(
          norm(find(`${product}.accent-text.${mode}`).value),
          `${product}.accent-text.${mode} contrast pair must equal the token`,
        ).toBe(norm(a[product]![mode]!["accent-text"]!));
        expect(
          norm(find(`${product}.cta.${mode}`).on),
          `${product}.cta.${mode} background must equal the accent-cta token`,
        ).toBe(norm(a[product]![mode]!["accent-cta"]!));
      }
    }
  });
});

/**
 * F-14 — data-viz ramp certification (WCAG 1.4.11 non-text, 3:1).
 *
 * `--chart-1..8` (tokens.json#chart.series, mode-agnostic by design) are
 * graphical objects — bars, lines, donut slices — so each series color must
 * clear 3:1 against the page background of BOTH modes.
 *
 * Certified 2026-07-10: all 8 pass on the dark bg (#111318, 3.60–9.91:1);
 * 6 of 8 pass on the light bg (#F7F8FA). KNOWN EXCEPTIONS (documented, not
 * silently waived — fixing them means changing token values, which is a
 * palette decision, out of scope for this guard):
 *   • chart-4 #f0b255 on light = 1.76:1
 *   • chart-7 #14b8a6 on light = 2.34:1
 * Consumers should avoid chart-4/chart-7 for thin marks (1px lines, small
 * points) on light surfaces, or pair them with the `[data-chart="safe"]`
 * dash-pattern layer. If either token is retuned to clear 3:1, REMOVE it
 * from CHART_LIGHT_EXCEPTIONS so the certification tightens.
 */
const CHART_LIGHT_EXCEPTIONS: Record<string, number> = {
  "chart-4": 1.76,
  "chart-7": 2.34,
};

describe("Data-viz ramp — non-text contrast (F-14)", () => {
  const series = TOKENS.chart.series;
  const lightBg = TOKENS.color.surface.light["bg"]!;
  const darkBg = TOKENS.color.surface.dark["bg"]!;

  it("carries the full 8-color series", () => {
    expect(Object.keys(series).sort()).toEqual([
      "chart-1",
      "chart-2",
      "chart-3",
      "chart-4",
      "chart-5",
      "chart-6",
      "chart-7",
      "chart-8",
    ]);
  });

  it("every series color clears 3:1 on the dark page bg", () => {
    const offenders = Object.entries(series)
      .map(([id, hex]) => ({ id, ratio: contrastRatio(hex, darkBg) }))
      .filter((r) => r.ratio < 3);
    expect(
      offenders.map((r) => `${r.id}: ${r.ratio.toFixed(2)}:1 on ${darkBg}`),
      "Chart series below 3:1 non-text contrast in dark mode",
    ).toEqual([]);
  });

  it("every non-excepted series color clears 3:1 on the light page bg", () => {
    const offenders = Object.entries(series)
      .filter(([id]) => !(id in CHART_LIGHT_EXCEPTIONS))
      .map(([id, hex]) => ({ id, ratio: contrastRatio(hex, lightBg) }))
      .filter((r) => r.ratio < 3);
    expect(
      offenders.map((r) => `${r.id}: ${r.ratio.toFixed(2)}:1 on ${lightBg}`),
      "Chart series below 3:1 non-text contrast in light mode (and not in the documented exception list)",
    ).toEqual([]);
  });

  it("the light-mode exception list stays honest (entries below 3:1, ratios current)", () => {
    for (const [id, declared] of Object.entries(CHART_LIGHT_EXCEPTIONS)) {
      const hex = series[id]!;
      const ratio = contrastRatio(hex, lightBg);
      expect(ratio, `${id} was retuned and now clears 3:1 — remove it from CHART_LIGHT_EXCEPTIONS`).toBeLessThan(3);
      expect(
        Math.abs(ratio - declared),
        `${id} exception ratio drifted (declared ${declared}, computes ${ratio.toFixed(2)}) — restamp the list`,
      ).toBeLessThan(0.05);
    }
  });
});
