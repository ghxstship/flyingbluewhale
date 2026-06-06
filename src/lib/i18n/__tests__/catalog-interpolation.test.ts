import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { makeT, type Messages } from "../t";

/**
 * Regression guard for the i18n interpolation defect surfaced by the
 * 2026-06-06 browser E2E (reports/BROWSER_E2E_CASA_WYNWOOD.md §2):
 *
 *   The message catalogs stored JS template-literal syntax — e.g.
 *   "${projects.length} Total", "Mark ${next}", "On track ${counts.green}" —
 *   but the `t()` interpolator only resolves `{placeholder}` tokens, so the
 *   raw `${...}` leaked into the UI verbatim.
 *
 * Every catalog value must use `{placeholder}` syntax, and the placeholder
 * names must match the params the call sites pass.
 */

const MSG_DIR = join(process.cwd(), "src/messages");
const LOCALES = ["en", "es", "de", "fr", "pt", "ja", "ar"] as const;

function load(locale: string): Messages {
  return JSON.parse(readFileSync(join(MSG_DIR, `${locale}.json`), "utf8")) as Messages;
}

function flatten(obj: Messages, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v as Messages, key, out);
    else if (typeof v === "string") out[key] = v;
  }
  return out;
}

describe("i18n catalog interpolation", () => {
  it.each(LOCALES)("%s.json contains no raw JS template literals", (locale) => {
    const flat = flatten(load(locale));
    const offenders = Object.entries(flat)
      .filter(([, v]) => v.includes("${"))
      .map(([k, v]) => `${k}: ${v}`);
    expect(offenders, `Found ${offenders.length} value(s) with unresolved \${...}`).toEqual([]);
  });

  it("resolves the three labels the E2E flagged (en)", () => {
    const t = makeT(load("en"));
    // projects list header
    expect(t("console.projects.totalCount", { count: 4 })).toBe("4 Total");
    // portfolio health legend
    expect(t("console.projects.portfolio.legend.onTrack", { count: 2 })).toBe("On track 2");
    expect(t("console.projects.portfolio.legend.watch", { count: 1 })).toBe("Watch 1");
    expect(t("console.projects.portfolio.legend.atRisk", { count: 1 })).toBe("At risk 1");
    // project phase button + toast — note the param name is `state`, not `next`
    expect(t("console.projects.statusToggle.markAction", { state: "Active" })).toBe("Mark Active");
    expect(t("console.projects.statusToggle.markedToast", { state: "Active" })).toBe("Marked Active");
  });

  it("resolves the singular plural-branch labels with their call-site params", () => {
    const t = makeT(load("en"));
    // knowledge subtitleOne passes no vars → count baked as literal 1
    expect(t("console.knowledge.subtitleOne")).toBe("1 article");
    expect(t("console.knowledge.subtitleTaggedOne", { tag: "rigging" })).toBe('1 article tagged "rigging"');
    expect(t("p.apply.changes.subtitle.one", { open: 1 })).toBe("1 Request · 1 Open");
    expect(t("p.delegation.transport.subtitleOne", { upcoming: 1 })).toBe("1 Run · 1 Active");
    expect(t("console.bim.detail.hotLinkCount", { count: 3 })).toBe("3 hot links");
  });

  it("resolves across non-English locales", () => {
    expect(makeT(load("es"))("console.projects.totalCount", { count: 4 })).toBe("4 Total");
    expect(makeT(load("de"))("console.projects.totalCount", { count: 4 })).toBe("4 Gesamt");
    expect(makeT(load("ja"))("console.projects.totalCount", { count: 4 })).toBe("4件");
    expect(makeT(load("fr"))("console.projects.portfolio.legend.onTrack", { count: 2 })).toBe("Sur les rails 2");
  });
});
