#!/usr/bin/env node
/**
 * Generate the render-site i18n overlay modules for the three marketing
 * content data files (I18N-WRAP, decision 7 rider):
 *
 *   src/lib/marketing/industries.ts → src/lib/marketing/industries.i18n.ts
 *   src/lib/marketing/teams.ts      → src/lib/marketing/teams.i18n.ts
 *   src/lib/marketing/glossary.ts   → src/lib/marketing/glossary.i18n.ts
 *
 * Why generated: the i18n extractor (scripts/extract-i18n-keys.mjs) only
 * sees t() call sites whose KEY and FALLBACK are plain string literals.
 * The pages that render these catalogs are dynamic ([industry]/[role]/[slug])
 * so the per-slug key can never be a literal at the page level — the
 * enumeration has to live in a companion module with one literal call per
 * slug × field. Hand-maintaining ~1,000 duplicated fallback strings would
 * drift; this script re-derives them from the data files (the SSOT).
 *
 * Run after editing any copy in the three data files:
 *   node --experimental-strip-types scripts/gen-marketing-i18n.mjs
 *
 * Drift guard: src/lib/marketing/i18n-content.test.ts asserts the
 * identity-translator output of each localizer deep-equals its source entry.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, "src", "lib", "marketing");

const { INDUSTRIES } = await import(join(ROOT, "src/lib/marketing/industries.ts"));
const { TEAMS } = await import(join(ROOT, "src/lib/marketing/teams.ts"));
const { GLOSSARY, GLOSSARY_CATEGORIES } = await import(join(ROOT, "src/lib/marketing/glossary.ts"));

const SLUG_RE = /^[a-z0-9-]+$/;
function assertSlug(slug, where) {
  if (!SLUG_RE.test(slug)) throw new Error(`Non-kebab slug "${slug}" in ${where} — key segments must be [a-z0-9-]`);
}

/** Emit a literal 3-arg t() call. JSON.stringify keeps the fallback verbatim. */
function tc(key, fallback) {
  return `t(${JSON.stringify(key)}, undefined, ${JSON.stringify(fallback)})`;
}

const TRANSLATOR_TYPE =
  "export type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;";

function header(sourceFile) {
  return `/**
 * GENERATED FILE — do not hand-edit. Regenerate with:
 *   node --experimental-strip-types scripts/gen-marketing-i18n.mjs
 *
 * Render-site i18n overlay for ${sourceFile} (I18N-WRAP, decision 7 rider).
 * The data file stays the SSOT for structure + English copy; this module
 * wraps every user-visible prose field in the 3-arg t(key, undefined,
 * fallback) form with PLAIN-STRING key and fallback literals so
 * scripts/extract-i18n-keys.mjs can land the keys in the locale catalogs.
 * Template-literal keys are invisible to the extractor, which is why every
 * slug is enumerated here instead of composed at the render site.
 *
 * Drift guard: i18n-content.test.ts asserts the identity-translator output
 * deep-equals the source entries, so data-file copy edits without a re-run
 * of the generator fail CI instead of silently shipping stale fallbacks.
 */
`;
}

// ---------------------------------------------------------------- industries
{
  const NS = "marketing.industriesContent"; // marketing.industries.<slug> already holds plain-string nav labels
  const lines = [];
  for (const [slug, e] of Object.entries(INDUSTRIES)) {
    assertSlug(slug, "INDUSTRIES");
    const k = (rest) => `${NS}.${slug}.${rest}`;
    lines.push(`  "${slug}": (e, t) => ({`);
    lines.push(`    ...e,`);
    lines.push(`    name: ${tc(k("name"), e.name)},`);
    lines.push(`    tagline: ${tc(k("tagline"), e.tagline)},`);
    lines.push(`    description: ${tc(k("description"), e.description)},`);
    lines.push(`    hero: {`);
    lines.push(`      eyebrow: ${tc(k("hero.eyebrow"), e.hero.eyebrow)},`);
    lines.push(`      title: ${tc(k("hero.title"), e.hero.title)},`);
    lines.push(`      body: ${tc(k("hero.body"), e.hero.body)},`);
    lines.push(`    },`);
    lines.push(`    stats: [`);
    e.stats.forEach((s, i) => {
      // Stat values ("15k+", "< 100ms") are figures, not prose — they stay
      // untranslated but must be emitted literally (index access is not
      // provable under noUncheckedIndexedAccess). The drift test covers them.
      lines.push(`      { value: ${JSON.stringify(s.value)}, label: ${tc(k(`stats.${i}.label`), s.label)} },`);
    });
    lines.push(`    ],`);
    lines.push(`    outcomes: [`);
    e.outcomes.forEach((o, i) => lines.push(`      ${tc(k(`outcomes.${i}`), o)},`));
    lines.push(`    ],`);
    lines.push(`    modules: [`);
    e.modules.forEach((m, i) => {
      lines.push(`      { name: ${tc(k(`modules.${i}.name`), m.name)}, body: ${tc(k(`modules.${i}.body`), m.body)} },`);
    });
    lines.push(`    ],`);
    lines.push(`    faqs: [`);
    e.faqs.forEach((f, i) => {
      lines.push(`      { q: ${tc(k(`faqs.${i}.q`), f.q)}, a: ${tc(k(`faqs.${i}.a`), f.a)} },`);
    });
    lines.push(`    ],`);
    lines.push(`  }),`);
  }

  const src = `${header("src/lib/marketing/industries.ts")}
import { INDUSTRIES, type IndustryConfig } from "./industries";

${TRANSLATOR_TYPE}

const LOCALIZERS: Record<string, (e: IndustryConfig, t: Translator) => IndustryConfig> = {
${lines.join("\n")}
};

/**
 * Localized view of INDUSTRIES[slug]. Structure (slugs, related lists, stat
 * figures) rides through from the data file; prose resolves through the
 * catalog and falls back to the verbatim English copy.
 */
export function localizeIndustry(slug: string, t: Translator): IndustryConfig | undefined {
  const e = INDUSTRIES[slug];
  if (!e) return undefined;
  const loc = LOCALIZERS[slug];
  return loc ? loc(e, t) : e;
}
`;
  writeFileSync(join(OUT_DIR, "industries.i18n.ts"), src);
}

// -------------------------------------------------------------------- teams
{
  const NS = "marketing.teams"; // no collision: marketing.teams currently holds only crumbsLabel + detail chrome keys
  const lines = [];
  for (const e of TEAMS) {
    assertSlug(e.slug, "TEAMS");
    const k = (rest) => `${NS}.${e.slug}.${rest}`;
    lines.push(`  "${e.slug}": (e, t) => ({`);
    lines.push(`    ...e,`);
    lines.push(`    role: ${tc(k("role"), e.role)},`);
    lines.push(`    blurb: ${tc(k("blurb"), e.blurb)},`);
    lines.push(`    hero: {`);
    lines.push(`      eyebrow: ${tc(k("hero.eyebrow"), e.hero.eyebrow)},`);
    lines.push(`      title: ${tc(k("hero.title"), e.hero.title)},`);
    lines.push(`      body: ${tc(k("hero.body"), e.hero.body)},`);
    lines.push(`    },`);
    lines.push(`    workflows: [`);
    e.workflows.forEach((w, i) => {
      lines.push(
        `      { title: ${tc(k(`workflows.${i}.title`), w.title)}, body: ${tc(k(`workflows.${i}.body`), w.body)} },`,
      );
    });
    lines.push(`    ],`);
    lines.push(`    painPoints: [`);
    e.painPoints.forEach((p, i) => lines.push(`      ${tc(k(`pain-points.${i}`), p)},`));
    lines.push(`    ],`);
    lines.push(`    faqs: [`);
    e.faqs.forEach((f, i) => {
      lines.push(`      { q: ${tc(k(`faqs.${i}.q`), f.q)}, a: ${tc(k(`faqs.${i}.a`), f.a)} },`);
    });
    lines.push(`    ],`);
    lines.push(`  }),`);
  }

  const src = `${header("src/lib/marketing/teams.ts")}
import { TEAMS_BY_SLUG, type TeamRole } from "./teams";

${TRANSLATOR_TYPE}

const LOCALIZERS: Record<string, (e: TeamRole, t: Translator) => TeamRole> = {
${lines.join("\n")}
};

/**
 * Localized view of TEAMS_BY_SLUG[slug]. Structure (slug, module + industry
 * slug lists) rides through from the data file; prose resolves through the
 * catalog and falls back to the verbatim English copy.
 */
export function localizeTeam(slug: string, t: Translator): TeamRole | undefined {
  const e = TEAMS_BY_SLUG[slug];
  if (!e) return undefined;
  const loc = LOCALIZERS[slug];
  return loc ? loc(e, t) : e;
}
`;
  writeFileSync(join(OUT_DIR, "teams.i18n.ts"), src);
}

// ----------------------------------------------------------------- glossary
{
  const NS = "marketing.glossaryContent"; // marketing.glossary holds the page chrome keys (crumbsLabel/detail)
  const lines = [];
  for (const e of GLOSSARY) {
    assertSlug(e.slug, "GLOSSARY");
    const k = (rest) => `${NS}.${e.slug}.${rest}`;
    lines.push(`  "${e.slug}": (e, t) => ({`);
    lines.push(`    ...e,`);
    lines.push(`    term: ${tc(k("term"), e.term)},`);
    lines.push(`    short: ${tc(k("short"), e.short)},`);
    lines.push(`    long: ${tc(k("long"), e.long)},`);
    if (e.aka && e.aka.length > 0) {
      lines.push(`    aka: [`);
      e.aka.forEach((a, i) => lines.push(`      ${tc(k(`aka.${i}`), a)},`));
      lines.push(`    ],`);
    }
    lines.push(`  }),`);
  }

  const catLabelLines = [];
  const catTokenLines = [];
  for (const c of GLOSSARY_CATEGORIES) {
    assertSlug(c.slug, "GLOSSARY_CATEGORIES");
    catLabelLines.push(`  ${c.slug}: (t) => ${tc(`${NS}.categories.${c.slug}`, c.label)},`);
    // The detail-page eyebrow interpolates category.replace(/-/g, " ") — the
    // token fallback must be that exact derived string for en parity.
    catTokenLines.push(`  ${c.slug}: (t) => ${tc(`${NS}.category-tokens.${c.slug}`, c.slug.replace(/-/g, " "))},`);
  }

  const src = `${header("src/lib/marketing/glossary.ts")}
import { GLOSSARY_BY_SLUG, type GlossaryTerm } from "./glossary";

${TRANSLATOR_TYPE}

const LOCALIZERS: Record<string, (e: GlossaryTerm, t: Translator) => GlossaryTerm> = {
${lines.join("\n")}
};

const CATEGORY_LABELS: Record<string, (t: Translator) => string> = {
${catLabelLines.join("\n")}
};

const CATEGORY_TOKENS: Record<string, (t: Translator) => string> = {
${catTokenLines.join("\n")}
};

/**
 * Localized view of GLOSSARY_BY_SLUG[slug]. Structure (slug, category,
 * related + module slug lists) rides through from the data file; term,
 * short, long, and aka resolve through the catalog and fall back to the
 * verbatim English copy.
 */
export function localizeGlossaryTerm(slug: string, t: Translator): GlossaryTerm | undefined {
  const e = GLOSSARY_BY_SLUG[slug];
  if (!e) return undefined;
  const loc = LOCALIZERS[slug];
  return loc ? loc(e, t) : e;
}

/** Localized section label for a GLOSSARY_CATEGORIES entry (index page). */
export function localizeGlossaryCategoryLabel(slug: string, t: Translator): string | undefined {
  return CATEGORY_LABELS[slug]?.(t);
}

/** Localized inline category token for the detail-page eyebrow. */
export function localizeGlossaryCategoryToken(slug: string, t: Translator): string | undefined {
  return CATEGORY_TOKENS[slug]?.(t);
}
`;
  writeFileSync(join(OUT_DIR, "glossary.i18n.ts"), src);
}

// Format to repo style so lint-staged/prettier never rewrites the output.
execFileSync("npx", ["prettier", "--write", join(OUT_DIR, "industries.i18n.ts"), join(OUT_DIR, "teams.i18n.ts"), join(OUT_DIR, "glossary.i18n.ts")], {
  stdio: "inherit",
});

console.log("gen-marketing-i18n: wrote industries.i18n.ts, teams.i18n.ts, glossary.i18n.ts");
