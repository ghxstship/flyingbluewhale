import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { custodianPatchFor, movementKindFor } from "./assets";

/**
 * F1 ratchet — field custody moves must land in the `asset_movements` ledger
 * (docs/compvss/MOBILE_BEST_PRACTICES_2026-07.md, fix-now F1).
 *
 * The defect class: a COMPVSS custody surface writing `assets` directly (or
 * pointing at the assignment domain) while the UAL custody ledger stays
 * silent at the exact moment custody physically changes hands. The fix wires
 * every custody surface through the shared `transitionAssetState`, which
 * appends a custodian-stamped ledger row and reads it back; migration
 * `20260723120000_asset_movements_field_write.sql` sanctions that write for
 * the field band at the DB.
 *
 * Mechanical source-level guard (mirrors compvss-field-rls-crew-canon.test.ts:
 * no live DB, runs under the standard vitest gate) + unit tests on the pure
 * custodian/kind mapping the ledger row is built from.
 */

const ROOT = process.cwd();

const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("F1 · field custody surfaces write the asset_movements ledger", () => {
  it("/m/inventory custody action routes through the shared ledgered transition", () => {
    const src = read("src/app/(mobile)/m/inventory/actions.ts");
    expect(src).toMatch(/transitionAssetState/);
    // The defect shape: flipping assets.state from the action itself, off
    // the ledgered path. Any direct assets write here is a regression.
    expect(src).not.toMatch(/from\(\s*["']assets["']\s*\)/);
    expect(src).not.toMatch(/from\(\s*["']asset_movements["']\s*\)/); // ledger writes live in the shared transition, not ad-hoc
  });

  it("/m/check-in asset quick-look rides the same custody action", () => {
    const src = read("src/app/(mobile)/m/check-in/AssetQuickLook.tsx");
    expect(src).toMatch(/moveAssetCustody/);
  });

  it("the shared transition appends a custodian-stamped ledger row and reads it back", () => {
    const src = read("src/lib/db/asset-transition.ts");
    expect(src).toMatch(/from\("asset_movements"\)/);
    expect(src).toMatch(/custodianPatchFor/);
    expect(src).toMatch(/recorded_by:\s*session\.userId/);
    // Read-back per the RLS canon: an insert whose row does not come back
    // must surface as an error, never as silent success.
    expect(src).toMatch(/mvRows/);
  });

  it("the F1 migration exists, grants INSERT only, and keeps the ledger append-only", () => {
    const sql = read("supabase/migrations/20260723120000_asset_movements_field_write.sql");
    expect(sql).toMatch(/create policy ual_mv_field_custody_insert on public\.asset_movements/);
    expect(sql).toMatch(/create policy ual_mv_manager_insert on public\.asset_movements/);
    expect(sql).toMatch(/create policy assets_custody_update on public\.assets/);
    // Actor binding: every arm pins recorded_by to the caller.
    expect(sql.match(/recorded_by = \(select auth\.uid\(\)\)/g)?.length).toBeGreaterThanOrEqual(2);
    // Append-only stays append-only: the migration must not touch the
    // no-update/no-delete policies, and every policy it creates on the
    // ledger table must be an INSERT arm.
    expect(sql).not.toMatch(/(drop|alter) policy[^;]*ual_mv_no_(update|delete)/i);
    const ledgerPolicies = sql.match(/create policy \S+ on public\.asset_movements[\s\S]*?;/g) ?? [];
    expect(ledgerPolicies.length).toBe(2);
    for (const stmt of ledgerPolicies) {
      expect(stmt).toMatch(/for insert/);
    }
  });
});

describe("custodianPatchFor — the custody chain binding", () => {
  it("checkout stamps the taker (to_custodian)", () => {
    expect(custodianPatchFor("available", "in_use", "p1")).toEqual({ to_custodian_id: "p1" });
    expect(custodianPatchFor("reserved", "in_use", "p1")).toEqual({ to_custodian_id: "p1" });
  });

  it("check-in stamps the releaser (from_custodian) from both eligible states", () => {
    expect(custodianPatchFor("in_use", "available", "p1")).toEqual({ from_custodian_id: "p1" });
    expect(custodianPatchFor("in_transit", "available", "p1")).toEqual({ from_custodian_id: "p1" });
  });

  it("non-custody transitions stamp nothing", () => {
    expect(custodianPatchFor("in_maintenance", "available", "p1")).toEqual({});
    expect(custodianPatchFor("lost", "available", "p1")).toEqual({});
    expect(custodianPatchFor("in_use", "in_maintenance", "p1")).toEqual({});
    expect(custodianPatchFor("available", "retired", "p1")).toEqual({});
  });

  it("tolerates a missing party without fabricating a custodian", () => {
    expect(custodianPatchFor("available", "in_use", null)).toEqual({});
  });

  it("covers every movement_kind the RLS field-custody arm admits", () => {
    // The DB arm admits checkout | return | transfer. The three custody
    // moves map inside that set — if movementKindFor ever remaps one, the
    // field write would start bouncing off RLS.
    expect(movementKindFor("available", "in_use")).toBe("checkout");
    expect(movementKindFor("in_use", "available")).toBe("return");
    expect(["return", "transfer"]).toContain(movementKindFor("in_transit", "available"));
  });
});
