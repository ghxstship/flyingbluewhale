import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { legendNav } from "./nav";
import { LEGEND_READ_ONLY_PERSONAS } from "./legend_access";
import { PERSONAS } from "./supabase/types";

/**
 * L-P6d ratchet — LEG3ND persona hardening (PERSONA_MATRIX P-1 / P-3 / S-4).
 *
 * (a) Every legend server-action WRITE carries an authorization floor: either
 *     a manager-band gate (`isManagerPlus` / `isAdmin`, directly or via the
 *     file's `requireAuthor()` / `requireHost()` wrappers) or the read-only
 *     persona assert (`assertLegendWrite` from src/lib/legend_access.ts).
 *     RLS deliberately admits any org member for learner writes (see
 *     legend-learner-rls-canon.test.ts), so without the assert the read-only
 *     personas (viewer / client / community — entitlements reach `ro`) could
 *     enroll, post, purchase, and register.
 *
 * (b) The MANAGE nav group is band-filtered: every item carries
 *     minRole:"manager" and the legend layout routes the rail through
 *     `filterNavByRole`, so non-managers never see surfaces that resolve to
 *     AccessDenied.
 *
 * (c) The signage/resources authoring pages are page-gated (AccessDenied),
 *     matching the engine/teach denial UX instead of rendering forms whose
 *     actions refuse.
 *
 * Grep-level like the sibling legend guards: mechanical, no live DB.
 */

const REPO_ROOT = process.cwd();
const LEGEND_DIR = join(REPO_ROOT, "src", "app", "(legend)");

/** Writes that are deliberately NOT floor-gated, with the reason. */
const EXEMPT: ReadonlyArray<{ file: string; fn: string; reason: string }> = [
  {
    file: "src/app/(legend)/legend/(org)/start/actions.ts",
    fn: "createStartOrgAction",
    reason:
      "org-genesis funnel: creates a NEW org via the create_org_with_owner RPC where the caller becomes owner — not a write into the org where the persona is read-only",
  },
];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/actions\.ts$/.test(name)) out.push(full);
  }
  return out;
}

/** Split a "use server" module into its exported async function chunks. */
function exportedChunks(src: string): Array<{ fn: string; body: string }> {
  const marker = /export async function ([A-Za-z0-9_]+)/g;
  const hits: Array<{ fn: string; start: number }> = [];
  for (const m of src.matchAll(marker)) hits.push({ fn: m[1]!, start: m.index! });
  return hits.map((h, i) => ({
    fn: h.fn,
    body: src.slice(h.start, i + 1 < hits.length ? hits[i + 1]!.start : src.length),
  }));
}

// Direct supabase chains plus the repo's helper-mediated writes
// (updateOrgScopedWithCheck routes an UPDATE through @/lib/db/concurrency).
const WRITE_RE = /\.(insert|update|upsert|delete|rpc)\(|updateOrgScopedWithCheck\(/;
const GATE_RE = /isManagerPlus\(|isAdmin\(|assertLegendWrite\(|requireAuthor\(\)|requireHost\(\)/;

describe("LEG3ND persona gating — every action write carries an authorization floor", () => {
  const files = walk(LEGEND_DIR).map((f) => ({
    rel: relative(REPO_ROOT, f),
    src: readFileSync(f, "utf8"),
  }));

  it("finds the legend actions population", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("every exported action that writes is manager-gated or learner-write asserted", () => {
    const offenders: string[] = [];
    for (const { rel, src } of files) {
      for (const { fn, body } of exportedChunks(src)) {
        if (!WRITE_RE.test(body)) continue;
        if (GATE_RE.test(body)) continue;
        if (EXEMPT.some((e) => e.file === rel && e.fn === fn)) continue;
        offenders.push(`${rel}#${fn}`);
      }
    }
    expect(
      offenders,
      "legend action writes without a manager gate or assertLegendWrite — read-only personas (viewer/client/community) would pass. Gate it or add a documented EXEMPT entry.",
    ).toEqual([]);
  });

  it("the EXEMPT list only names writes that still exist (shrink-only)", () => {
    for (const e of EXEMPT) {
      const file = files.find((f) => f.rel === e.file);
      expect(file, `${e.file} disappeared — drop its EXEMPT entry`).toBeTruthy();
      expect(
        exportedChunks(file!.src).some((c) => c.fn === e.fn),
        `${e.file}#${e.fn} disappeared — drop its EXEMPT entry`,
      ).toBe(true);
    }
  });
});

describe("LEG3ND persona gating — read-only persona set", () => {
  it("names only valid personas and stays the entitlements 'ro' trio", () => {
    for (const p of LEGEND_READ_ONLY_PERSONAS) {
      expect(PERSONAS, `${p} is not a Persona`).toContain(p);
    }
    expect([...LEGEND_READ_ONLY_PERSONAS].sort()).toEqual(["client", "community", "viewer"]);
  });
});

describe("LEG3ND persona gating — MANAGE nav group is band-filtered (P-3)", () => {
  it("every Manage item carries minRole:'manager'", () => {
    const manage = legendNav.find((g) => g.label === "Manage");
    expect(manage, "legendNav lost its Manage group").toBeTruthy();
    for (const item of manage!.items) {
      expect(item.minRole, `${item.href} must carry minRole:"manager" so the rail hides it below the band`).toBe(
        "manager",
      );
    }
  });

  it("the legend layout routes the rail through filterNavByRole", () => {
    const layout = readFileSync(join(REPO_ROOT, "src/app/(legend)/layout.tsx"), "utf8");
    expect(
      /filterNavByRole\(\s*legendNav/.test(layout),
      "(legend)/layout.tsx must pass filterNavByRole(legendNav, session role) to LegendSidebar",
    ).toBe(true);
  });
});

describe("LEG3ND persona gating — signage/resources authoring pages are page-gated (S-4)", () => {
  const AUTHORING_PAGES = [
    "src/app/(legend)/legend/(org)/signage/new/page.tsx",
    "src/app/(legend)/legend/(org)/signage/[signId]/edit/page.tsx",
    "src/app/(legend)/legend/(org)/signage/[signId]/placements/new/page.tsx",
    "src/app/(legend)/legend/(org)/resources/new/page.tsx",
    "src/app/(legend)/legend/(org)/resources/[id]/edit/page.tsx",
    "src/app/(legend)/legend/(org)/resources/collections/new/page.tsx",
  ];

  for (const rel of AUTHORING_PAGES) {
    it(`${rel} renders AccessDenied below the manager band`, () => {
      const src = readFileSync(join(REPO_ROOT, rel), "utf8");
      expect(/isManagerPlus\(/.test(src), `${rel} must check isManagerPlus`).toBe(true);
      expect(/AccessDenied/.test(src), `${rel} must render <AccessDenied> when the check fails`).toBe(true);
    });
  }
});
