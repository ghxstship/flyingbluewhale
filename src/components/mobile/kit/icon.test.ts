import { describe, expect, it } from "vitest";
import * as Lucide from "lucide-react";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * KIcon registry guard.
 *
 * `KIcon` (src/components/mobile/kit/icon.tsx) resolves an icon by name from an
 * EXPLICIT `ICONS` registry so the bundler can tree-shake `lucide-react` (the
 * old `import * as Lucide` + namespace-index shipped all ~1,600 icons to every
 * /m route). These checks keep the registry honest:
 *   1. every registered name is a real lucide export (no typos / renamed icons);
 *   2. every STATIC `name="…"` literal used in the mobile scope is registered
 *      (dynamic names sourced from data maps degrade to the HelpCircle fallback,
 *      and KIcon dev-warns on a miss).
 */

const REPO_ROOT = process.cwd();
const ICON_SRC = join(REPO_ROOT, "src", "components", "mobile", "kit", "icon.tsx");

/** Names in the ICONS registry, read from the source (no client-component import). */
function registeredNames(): Set<string> {
  const src = readFileSync(ICON_SRC, "utf8");
  const start = src.indexOf("const ICONS");
  const end = src.indexOf("};", start);
  const block = src.slice(src.indexOf("{", start) + 1, end);
  const names = new Set<string>();
  for (const m of block.matchAll(/\b([A-Z][A-Za-z0-9]+)\b/g)) if (m[1]) names.add(m[1]);
  return names;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(name) && !name.endsWith(".test.ts") && !name.endsWith(".test.tsx")) out.push(full);
  }
  return out;
}

const MOBILE_DIRS = [
  join(REPO_ROOT, "src", "app", "(mobile)"),
  join(REPO_ROOT, "src", "components", "mobile"),
];

describe("KIcon registry", () => {
  const registry = registeredNames();

  it("every registered icon resolves to a real lucide-react export", () => {
    const missing = [...registry].filter((n) => !(n in Lucide) || !(Lucide as Record<string, unknown>)[n]);
    expect(missing, `not lucide exports: ${missing.join(", ")}`).toEqual([]);
  });

  it("includes the HelpCircle fallback", () => {
    expect(registry.has("HelpCircle")).toBe(true);
  });

  it("every static name=\"…\" literal in the mobile scope is registered", () => {
    const used = new Set<string>();
    for (const dir of MOBILE_DIRS) {
      for (const file of walk(dir)) {
        const src = readFileSync(file, "utf8");
        for (const m of src.matchAll(/name="([A-Z][A-Za-z0-9]+)"/g)) if (m[1]) used.add(m[1]);
      }
    }
    const missing = [...used].filter((n) => !registry.has(n));
    expect(missing, `unregistered KIcon names: ${missing.join(", ")}`).toEqual([]);
  });
});
