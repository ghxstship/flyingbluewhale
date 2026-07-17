import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, normalize, relative } from "node:path";

/**
 * Client ⇄ server module-boundary guard.
 *
 * A `"use client"` module that VALUE-imports a `server-only` module (or
 * anything that reaches `next/headers`) is a Turbopack BUILD error — not a
 * tsc error, not a vitest error — so it survives every local gate and dies
 * on the Vercel builder. Exactly that killed deploy d48d580f (TriageRow →
 * incident-fsm → audit → supabase/server → next/headers, 7 build errors
 * from one import). This guard makes the class fail HERE first.
 *
 * Legal and therefore ignored:
 *   - imports of `"use server"` modules (the bundler swaps them for RPC
 *     stubs; their own server imports never enter the client graph);
 *   - type-only imports, both `import type {...}` and inline
 *     `import { type X }` (erased at compile);
 *   - package imports (next/*, react, libs — the bundler polices those).
 *
 * Scope: DIRECT imports only. Transitive graphs are the bundler's job; the
 * direct edge is where the mistake is made and where the fix belongs (split
 * the pure data out of the server module — see incident-states.ts).
 */

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "__generated__") continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.(test|spec)\./.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function classify(path: string): { client: boolean; server: boolean; action: boolean } {
  const raw = readFileSync(path, "utf8");
  const code = stripComments(raw);
  const head = code.slice(0, 800);
  return {
    client: /^\s*["']use client["']/.test(code),
    action: /^\s*["']use server["']/.test(code),
    server: /import\s+["']server-only["']/.test(head) || /from\s+["']next\/headers["']/.test(head),
  };
}

function resolveSpec(spec: string, importer: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = normalize(join(dirname(importer), spec));
  else return null;
  for (const cand of [base + ".ts", base + ".tsx", join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(cand)) return cand;
  }
  return null;
}

describe("client ⇄ server boundary", () => {
  it("no 'use client' module VALUE-imports a server-only module", () => {
    const files = walk(SRC);
    const meta = new Map(files.map((f) => [f, classify(f)]));
    const offenders: string[] = [];

    for (const file of files) {
      if (!meta.get(file)!.client) continue;
      const code = stripComments(readFileSync(file, "utf8"));
      for (const m of code.matchAll(/import\s+(type\s+)?(\{[^}]*\}|[\w$]+|\*\s+as\s+[\w$]+)\s+from\s+["']([^"']+)["']/g)) {
        if (m[1]) continue; // import type {...}
        const names = m[2]!;
        // `{ type A, type B }` with every specifier type-only is erased too.
        if (names.startsWith("{")) {
          const specifiers = names
            .slice(1, -1)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          if (specifiers.length > 0 && specifiers.every((s) => s.startsWith("type "))) continue;
        }
        const target = resolveSpec(m[3]!, file);
        if (!target) continue;
        const t = meta.get(target);
        if (!t) continue;
        if (t.action) continue; // "use server" → RPC stub, legal
        if (t.server) {
          offenders.push(`${relative(ROOT, file)} value-imports server-only ${relative(ROOT, target)}`);
        }
      }
    }

    expect(
      offenders,
      `Client modules value-importing server-only modules — this DIES on the Vercel builder ` +
        `(tsc cannot see it). Split the pure data out of the server module (see ` +
        `src/lib/db/incident-states.ts) or make the import type-only:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
