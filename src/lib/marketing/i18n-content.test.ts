/**
 * I18N-WRAP drift guard (decision 7 rider).
 *
 * The generated overlay modules ({industries,teams,glossary}.i18n.ts) carry
 * one literal t(key, undefined, fallback) call per slug × prose field so the
 * i18n extractor can see them. Their fallbacks are duplicated verbatim from
 * the data files by scripts/gen-marketing-i18n.mjs. If someone edits copy in
 * a data file without re-running the generator, the fallbacks go stale —
 * this suite makes that a CI failure instead of a silent drift:
 *
 *   1. Identity translator (returns the fallback) must reproduce every
 *      source entry byte-for-byte → en behavior is provably unchanged.
 *   2. A marking translator must touch every prose field → every entry has
 *      a generated localizer (a new data entry without regeneration fails).
 *   3. Every key handed to t() is a dot-path of [a-z0-9-] segments in the
 *      reserved namespaces.
 */
import { describe, expect, it } from "vitest";
import { INDUSTRIES } from "./industries";
import { TEAMS } from "./teams";
import { GLOSSARY, GLOSSARY_CATEGORIES } from "./glossary";
import { localizeIndustry, type Translator } from "./industries.i18n";
import { localizeTeam } from "./teams.i18n";
import { localizeGlossaryCategoryLabel, localizeGlossaryCategoryToken, localizeGlossaryTerm } from "./glossary.i18n";

/** Behaves exactly like t() with no catalogs loaded: the fallback wins. */
const idT: Translator = (key, _vars, fallback) => fallback ?? key;

/** Wraps every translated string so coverage is observable. */
const markT: Translator = (key, _vars, fallback) => `«${fallback ?? key}»`;

/** Collects every key routed through t() for shape validation. */
function collectKeys(run: (t: Translator) => void): string[] {
  const keys: string[] = [];
  run((key, _vars, fallback) => {
    keys.push(key);
    return fallback ?? key;
  });
  return keys;
}

const KEY_RE = /^marketing\.(industriesContent|teams|glossaryContent)(\.[a-z0-9-]+)+$/;

describe("marketing content i18n overlays (generated — see scripts/gen-marketing-i18n.mjs)", () => {
  it("industries: identity translator reproduces every source entry verbatim", () => {
    for (const slug of Object.keys(INDUSTRIES)) {
      expect(localizeIndustry(slug, idT), slug).toEqual(INDUSTRIES[slug]);
    }
  });

  it("industries: every entry has a generated localizer covering its prose", () => {
    for (const slug of Object.keys(INDUSTRIES)) {
      const loc = localizeIndustry(slug, markT);
      expect(loc?.name, `${slug} has no generated localizer — re-run the generator`).toContain("«");
      expect(loc?.hero.title, slug).toContain("«");
      for (const o of loc?.outcomes ?? []) expect(o, slug).toContain("«");
      for (const f of loc?.faqs ?? []) expect(f.a, slug).toContain("«");
    }
  });

  it("teams: identity translator reproduces every source entry verbatim", () => {
    for (const entry of TEAMS) {
      expect(localizeTeam(entry.slug, idT), entry.slug).toEqual(entry);
    }
  });

  it("teams: every entry has a generated localizer covering its prose", () => {
    for (const entry of TEAMS) {
      const loc = localizeTeam(entry.slug, markT);
      expect(loc?.role, `${entry.slug} has no generated localizer — re-run the generator`).toContain("«");
      expect(loc?.hero.title, entry.slug).toContain("«");
      for (const p of loc?.painPoints ?? []) expect(p, entry.slug).toContain("«");
      for (const f of loc?.faqs ?? []) expect(f.q, entry.slug).toContain("«");
    }
  });

  it("glossary: identity translator reproduces every source entry verbatim", () => {
    for (const entry of GLOSSARY) {
      expect(localizeGlossaryTerm(entry.slug, idT), entry.slug).toEqual(entry);
    }
  });

  it("glossary: every entry has a generated localizer covering its prose", () => {
    for (const entry of GLOSSARY) {
      const loc = localizeGlossaryTerm(entry.slug, markT);
      expect(loc?.term, `${entry.slug} has no generated localizer — re-run the generator`).toContain("«");
      expect(loc?.short, entry.slug).toContain("«");
      expect(loc?.long, entry.slug).toContain("«");
      for (const a of loc?.aka ?? []) expect(a, entry.slug).toContain("«");
    }
  });

  it("glossary categories: labels and eyebrow tokens match the source under identity translation", () => {
    for (const cat of GLOSSARY_CATEGORIES) {
      expect(localizeGlossaryCategoryLabel(cat.slug, idT), cat.slug).toBe(cat.label);
      // The detail-page eyebrow renders category.replace(/-/g, " ") today —
      // the token fallback must be exactly that derived string.
      expect(localizeGlossaryCategoryToken(cat.slug, idT), cat.slug).toBe(cat.slug.replace(/-/g, " "));
    }
  });

  it("every generated key is a dot-path of [a-z0-9-] segments in a reserved namespace", () => {
    const keys = collectKeys((t) => {
      for (const slug of Object.keys(INDUSTRIES)) localizeIndustry(slug, t);
      for (const entry of TEAMS) localizeTeam(entry.slug, t);
      for (const entry of GLOSSARY) localizeGlossaryTerm(entry.slug, t);
      for (const cat of GLOSSARY_CATEGORIES) {
        localizeGlossaryCategoryLabel(cat.slug, t);
        localizeGlossaryCategoryToken(cat.slug, t);
      }
    });
    expect(keys.length).toBeGreaterThan(1000);
    for (const key of keys) expect(key).toMatch(KEY_RE);
    // No duplicate keys — every slug × field must be uniquely addressable.
    expect(new Set(keys).size).toBe(keys.length);
  });
});
