import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Database } from "./supabase/database.types";

/**
 * Contract + static-analysis guard for the payments-correctness migration
 * (20260625182645_payments_atomicity_idempotency). We can't reach the live
 * Postgres functions from unit tests, so this suite locks two things:
 *
 *   1. The RPC wire shape (param names) in the regenerated database.types —
 *      so the webhook / store action can't silently drift from the function
 *      signatures (matches the approve_time_off_request guard pattern).
 *   2. The migration SQL contains the atomicity + idempotency primitives the
 *      fixes depend on: the credit_ledger idempotency index, SELECT ... FOR
 *      UPDATE row locks, ON CONFLICT DO NOTHING ledger guards, terminal-state
 *      short-circuits, and SECURITY DEFINER. If any is dropped in a future
 *      edit, the double-credit / lost-credit / oversell defects regress and
 *      this test fails first.
 */

const MIGRATION = readFileSync(
  join(__dirname, "../../supabase/migrations/20260625182645_payments_atomicity_idempotency.sql"),
  "utf8",
).toLowerCase();

describe("payments-fulfillment RPC shapes", () => {
  it("fulfill_credit_order takes (p_order_id, p_event_id)", () => {
    type RPC = Database["public"]["Functions"]["fulfill_credit_order"];
    const args: RPC["Args"] = { p_order_id: "00000000-0000-0000-0000-000000000000", p_event_id: undefined };
    expect(args.p_order_id).toBeTypeOf("string");
  });

  it("convert_store_cart takes (p_cart_id, p_event_id)", () => {
    type RPC = Database["public"]["Functions"]["convert_store_cart"];
    const args: RPC["Args"] = { p_cart_id: "00000000-0000-0000-0000-000000000000", p_event_id: undefined };
    expect(args.p_cart_id).toBeTypeOf("string");
  });

  it("redeem_voucher takes (p_org_id, p_user_id, p_code)", () => {
    type RPC = Database["public"]["Functions"]["redeem_voucher"];
    const args: RPC["Args"] = {
      p_org_id: "00000000-0000-0000-0000-000000000000",
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_code: "ABC123",
    };
    expect(args.p_code).toBeTypeOf("string");
  });
});

describe("payments-fulfillment migration — atomicity + idempotency primitives", () => {
  it("creates the credit_ledger idempotency index scoped per (ref_kind, ref_id, user_id)", () => {
    // Partial unique index — exempts manual/seed grants (null ref), blocks a
    // redelivered grant for the same source, but allows a second user to
    // redeem a multi-use voucher (user_id in the key).
    expect(MIGRATION).toMatch(
      /create unique index[\s\S]*credit_ledger_ref_uniq[\s\S]*\(ref_kind, ref_id, user_id\)[\s\S]*where ref_kind is not null and ref_id is not null/,
    );
  });

  it("declares all three RPCs SECURITY DEFINER", () => {
    const securityDefiners = MIGRATION.match(/security definer/g) ?? [];
    expect(securityDefiners.length).toBeGreaterThanOrEqual(3);
  });

  it("locks the target row with SELECT ... FOR UPDATE in each RPC (no read-modify-write race)", () => {
    // One lock per function: credit_orders, store_carts, vouchers.
    const forUpdates = MIGRATION.match(/for update/g) ?? [];
    expect(forUpdates.length).toBeGreaterThanOrEqual(3);
  });

  it("guards every ledger grant with ON CONFLICT DO NOTHING on the idempotency key", () => {
    const onConflicts = MIGRATION.match(/on conflict \(ref_kind, ref_id, user_id\)[\s\S]*?do nothing/g) ?? [];
    // fulfill_credit_order (1) + redeem_voucher (2: backfill + grant) = 3.
    expect(onConflicts.length).toBeGreaterThanOrEqual(3);
  });

  it("short-circuits fulfill_credit_order on already-fulfilled (idempotent redelivery)", () => {
    expect(MIGRATION).toMatch(/v_state = 'fulfilled'[\s\S]*already_fulfilled/);
  });

  it("short-circuits convert_store_cart on already-converted (no double inventory decrement)", () => {
    expect(MIGRATION).toMatch(/v_state = 'converted'[\s\S]*already_converted/);
  });

  it("floors store inventory at zero (never writes a negative count)", () => {
    expect(MIGRATION).toMatch(/greatest\(0, coalesce\(inventory_qty, 0\) - it\.qty\)/);
  });

  it("decrements inventory in a single set statement (no SELECT-then-UPDATE)", () => {
    // The decrement must be a self-referential UPDATE, not a read-back of qty.
    expect(MIGRATION).toMatch(/set inventory_qty = greatest\(0, coalesce\(inventory_qty, 0\) - it\.qty\)/);
  });
});
