import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Component status taxonomy guard (design-system inventory §Guidelines).
 *
 * `src/app/theme/component-maturity.json` is the SSOT for every `ui/` primitive's
 * stability level (stable / beta / deprecated). This test keeps it honest:
 *   1. every `src/components/ui/*.tsx` (a real component) has a registry entry,
 *   2. every registry entry resolves to a real component file,
 *   3. every status is one of the allowed levels.
 * So the taxonomy can never silently drift from the shipped component set.
 */
const ROOT = process.cwd();
const REGISTRY = JSON.parse(
  readFileSync(join(ROOT, "src/app/theme/component-maturity.json"), "utf8"),
) as { levels: Record<string, string>; components: Record<string, string> };

const UI_DIR = join(ROOT, "src/components/ui");
const componentFiles = readdirSync(UI_DIR)
  .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"))
  .map((f) => f.replace(/\.tsx$/, ""));

describe("component maturity registry (taxonomy ↔ ui/)", () => {
  it("every ui/ component has a maturity entry", () => {
    const missing = componentFiles.filter((c) => !(c in REGISTRY.components));
    expect(missing, `ui components missing from component-maturity.json:\n${missing.join("\n")}`).toEqual([]);
  });

  it("every maturity entry resolves to a real ui/ component file", () => {
    const orphans = Object.keys(REGISTRY.components).filter((c) => !componentFiles.includes(c));
    expect(orphans, `registry entries with no component file:\n${orphans.join("\n")}`).toEqual([]);
  });

  it("every status is an allowed level", () => {
    const allowed = new Set(Object.keys(REGISTRY.levels));
    const bad = Object.entries(REGISTRY.components).filter(([, s]) => !allowed.has(s));
    expect(bad, `entries with an invalid status:\n${bad.map(([c, s]) => `${c}=${s}`).join("\n")}`).toEqual([]);
  });
});

/**
 * GH-5 (lane-F, W1 2026-07-22) — the registry tracked existence + level but
 * had no ADOPTION dimension, so zero-importer primitives sat at "stable"
 * indefinitely (15 dead primitives found in the audit). This adds the
 * importer-count check: a ui/ primitive with ZERO importers anywhere in src
 * must be a known, grandfathered case — anything else is vocabulary shipped
 * without consumers, which is how the fork debt grew.
 *
 * The grandfather set is the audit's frozen inventory (owner ruling 3
 * dispositions them: Divider is ADOPT (absorb AuthDivider, W5), 14 are
 * DELETE (W5); DatePicker demotes with its deletion). The set may only
 * SHRINK: a new zero-importer primitive fails immediately, and an entry that
 * gains an importer (or is deleted) must leave the set.
 */
const ZERO_ADOPTION_GRANDFATHER = new Set<string>([
  "ButtonGroup",
  "Carousel",
  "DatePicker",
  "DescriptionList",
  "Divider",
  "ListRow",
  "MediaCard",
  "Meter",
  "NumberInput",
  "PinInput",
  "RadioGroup",
  "RecordHeader",
  "RoleControl",
  "Slider",
  "TimePicker",
  "UploadZone",
]);

describe("component adoption ratchet (GH-5)", () => {
  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (name === "node_modules" || name.startsWith(".")) continue;
        out.push(...walk(full));
      } else if (st.isFile() && /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) {
        out.push(full);
      }
    }
    return out;
  }

  it("no NEW zero-importer ui primitive; grandfathered entries may only shrink", () => {
    const sources = walk(join(ROOT, "src"))
      .filter((f) => !f.startsWith(UI_DIR))
      .map((f) => readFileSync(f, "utf8"));
    const zero: string[] = [];
    for (const c of componentFiles) {
      const pathNeedle = `ui/${c}"`;
      const barrelRe = new RegExp(`import\\s*\\{[^}]*\\b${c}\\b[^}]*\\}\\s*from\\s*["']@/components/ui["']`);
      const adopted = sources.some((t) => t.includes(pathNeedle) || barrelRe.test(t));
      if (!adopted) zero.push(c);
    }
    const fresh = zero.filter((c) => !ZERO_ADOPTION_GRANDFATHER.has(c));
    const stale = [...ZERO_ADOPTION_GRANDFATHER].filter((c) => !zero.includes(c));
    expect(
      fresh,
      `ui/ primitives with ZERO importers that aren't grandfathered — don't ship vocabulary without a consumer ` +
        `(wire it up, or don't add it):\n${fresh.join("\n")}`,
    ).toEqual([]);
    expect(
      stale,
      `Grandfathered zero-adoption entries that now have importers (or no longer exist) — remove them from ` +
        `ZERO_ADOPTION_GRANDFATHER so the ratchet stays tight:\n${stale.join("\n")}`,
    ).toEqual([]);
  });
});
