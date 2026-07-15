import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { NOTIF_KINDS } from "@/components/notifications/kinds";

/**
 * The third mirror of the PushKind taxonomy.
 *
 * `PushKind` (src/lib/push/send.ts) and `NOTIF_KINDS`
 * (src/components/notifications/kinds.ts) are already held in lockstep by a
 * `satisfies` plus an exhaustiveness assert — add a kind to one without the
 * other and the build fails.
 *
 * The `notification_kind_catalog` view is the third, and it was hand-synced
 * with NO guard. That matters more than it sounds: the view is what
 * /m/settings/notifications renders its matrix from, and `matrix[kind].push`
 * is the ONLY opt-out signal `filterByPushPrefs` reads. So a kind present in
 * the union but missing from the view produces notifications a user receives
 * and cannot find a switch for — the exact "placebo" failure the kinds module
 * warns about, arrived at from the other direction.
 *
 * This parses the kind literals out of the latest migration that (re)defines
 * the view and asserts they match the TS tuple exactly.
 */
const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase/migrations");

/** The most recent migration that defines the catalog view. */
function latestCatalogMigration(): string {
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  let found: string | null = null;
  for (const f of files) {
    const sql = readFileSync(join(MIGRATIONS, f), "utf8");
    if (/CREATE OR REPLACE VIEW\s+"?public"?\.\s*"?notification_kind_catalog"?/i.test(sql)) found = f;
  }
  if (!found) throw new Error("No migration defines notification_kind_catalog");
  return join(MIGRATIONS, found);
}

/** Pull the first column of each VALUES tuple: ('announcement'::text, …). */
function kindsInView(sql: string): string[] {
  const body = sql.slice(sql.search(/CREATE OR REPLACE VIEW[\s\S]*?FROM \( VALUES/i));
  const out: string[] = [];
  for (const m of body.matchAll(/\(\s*'([a-z_]+)'::text\s*,/g)) {
    if (m[1]) out.push(m[1]);
  }
  return out;
}

describe("notification_kind_catalog mirrors the PushKind taxonomy", () => {
  const sql = readFileSync(latestCatalogMigration(), "utf8");
  const viewKinds = kindsInView(sql);

  it("parses kinds out of the view definition", () => {
    // Guard the guard: a regex that silently matches nothing would make every
    // assertion below vacuously pass.
    expect(viewKinds.length).toBeGreaterThan(5);
  });

  it("lists exactly the toggleable kinds, in the same set as NOTIF_KINDS", () => {
    expect([...viewKinds].sort()).toEqual([...NOTIF_KINDS].sort());
  });

  it("does not list an unsilenceable kind", () => {
    // `crisis` ignores the matrix entirely. Listing it would render a switch
    // that does nothing — which is what the kinds module calls a placebo.
    expect(viewKinds).not.toContain("crisis");
  });
});
