import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SITE, CANONICAL_CTAS, organizationSchema } from "@/lib/seo";
import { XPMS_PHASES } from "@/lib/xpms";

/**
 * WORLDS canon guard (design_handoff_worlds). Locks the SSOT/consistency the
 * remediation established so it can't drift back (Parts A + B acceptance):
 *  - four apps everywhere (SITE.apps + organizationSchema.brand)
 *  - one CTA constant + one free-tier name
 *  - lifecycle = XPMS_PHASES (no retired Strike/Activation/R&D taxonomy)
 *  - the locked app one-liners are byte-identical across seo.ts + en.json (GEO)
 */
const EN = JSON.parse(readFileSync(join(process.cwd(), "src/messages/en.json"), "utf8"));
const CANON_PHASES = ["Discovery", "Design", "Advance", "Procurement", "Build", "Install", "Operate", "Close"];

describe("WORLDS canon", () => {
  it("four apps — SITE.apps + organizationSchema.brand", () => {
    expect(Object.keys(SITE.apps).sort()).toEqual(["atlvs", "compvss", "gvteway", "legend"]);
    expect(organizationSchema().brand.map((b) => b.name).sort()).toEqual(["ATLVS", "COMPVSS", "GVTEWAY", "LEG3ND"]);
    expect(SITE.description).not.toMatch(/three apps|three shells/i);
  });

  it("one CTA constant + canon primary label", () => {
    expect(CANONICAL_CTAS.primary.label).toBe("Start building free");
    expect(EN.marketing.pages.home.hero.ctaPrimary).toBe("Start building free");
  });

  it("lifecycle = XPMS_PHASES, retired taxonomy gone", () => {
    expect(XPMS_PHASES.map((p) => p.label)).toEqual(CANON_PHASES);
    const lc = JSON.stringify(EN.marketing.pages.home.lifecycle);
    expect(lc).not.toMatch(/Strike|Activation|R&D|Compliance|Discovery to Strike/);
  });

  it("hero adopts the World Builder's Ecosystem voice (kit canon)", () => {
    const h = EN.marketing.pages.home.hero;
    // Headline: "THE WORLD BUILDER'S ECOSYSTEM." with "Ecosystem." in --p-accent.
    expect(`${h.titleLine1} ${h.titleLine2} ${h.titleLine3}`).toBe("The World Builder's Ecosystem.");
    expect(h.eyebrow).toBe("Production · Operations · Experience · Knowledge");
    // Subtitle: one category-defining line. The four-app verb parade is RETIRED —
    // never reintroduce "runs the build / works the floor / opens the doors / holds the standard".
    expect(h.subtitleLead).toContain("ultimate tool");
    for (const k of ["subtitleAtlvs", "subtitleCompvss", "subtitleGvteway", "subtitleLegend"]) {
      expect(h[k], `retired hero key ${k} must not return`).toBeUndefined();
    }
    expect(JSON.stringify(EN.marketing.pages.home)).not.toMatch(
      /runs the build|works the floor|opens the doors|holds the standard/,
    );
  });

  it("app one-liners are identical across seo.ts and en.json (GEO G2)", () => {
    for (const k of ["atlvs", "compvss", "gvteway", "legend"] as const) {
      expect(EN.marketing.pages.home.products[k].body).toBe(SITE.apps[k].tagline);
    }
  });

  it("no titlecase 'Start Free' / 'Sign Up Free' CTA labels remain in en.json", () => {
    const hits: string[] = [];
    (function walk(o: unknown, p: string) {
      if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, p ? `${p}.${k}` : k);
      else if (typeof o === "string" && /\bStart Free\b|\bSign Up Free\b/.test(o)) hits.push(p);
    })(EN, "");
    expect(hits).toEqual([]);
  });
});
