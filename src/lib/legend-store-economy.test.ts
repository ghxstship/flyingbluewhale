import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canPurchase, creditBalance, type CreditProduct } from "./legend_store";

/**
 * Ratchet for the LEG3ND store economy closure (readiness blocker B-4,
 * migration 20260723172000_legend_store_economy). Mirrors the
 * payments-fulfillment guard idiom: the migration is not applied from unit
 * tests, so this suite locks
 *
 *   1. THE DEBIT PATH EXISTS — `credit_ledger` gains its first negative-delta
 *      writer (`purchase_store_item`) and the store action actually calls it.
 *      Before this ratchet the economy was open-loop: credits in, never out.
 *   2. The RPC's atomicity/integrity primitives: SECURITY DEFINER, the
 *      per-(org,user) advisory xact lock serializing debits, the balance
 *      check BEFORE the debit, FOR UPDATE on the product row, the guarded
 *      stock decrement, and the anon revoke.
 *   3. The stocking RLS widens to the manager band (store admin surface).
 *   4. The pure balance math the UI mirrors (debit never exceeds balance).
 */

const MIGRATION = readFileSync(
  join(__dirname, "../../supabase/migrations/20260723172000_legend_store_economy.sql"),
  "utf8",
).toLowerCase();

const STORE_ACTIONS = readFileSync(
  join(__dirname, "../app/(legend)/legend/(org)/store/actions.ts"),
  "utf8",
);

describe("credit_ledger debit path (grep guard)", () => {
  it("the migration inserts a NEGATIVE delta into credit_ledger (the spend loop's debit)", () => {
    expect(MIGRATION).toMatch(/insert into public\.credit_ledger[\s\S]*?-v_credits/);
  });

  it("the store server action calls the purchase_store_item RPC (credits are spendable in-app)", () => {
    expect(STORE_ACTIONS).toMatch(/rpc\("purchase_store_item"/);
  });

  it("the purchase yields a visible fulfillment row (credit_purchases) referenced by the debit", () => {
    expect(MIGRATION).toMatch(/insert into public\.credit_purchases/);
    expect(MIGRATION).toMatch(/'credit_purchase', v_purchase_id/);
  });

  it("insufficient balance surfaces honestly (reason + balance + price in the contract)", () => {
    expect(MIGRATION).toMatch(/'insufficient_balance'/);
    expect(MIGRATION).toMatch(/'balance', v_balance[\s\S]*'price', v_credits/);
    expect(STORE_ACTIONS).toMatch(/insufficient_balance/);
  });
});

describe("purchase_store_item — atomicity + integrity primitives", () => {
  it("is SECURITY DEFINER with a pinned search_path", () => {
    expect(MIGRATION).toMatch(/purchase_store_item[\s\S]*security definer[\s\S]*set search_path to 'public'/);
  });

  it("serializes concurrent debits per (org, user) with an advisory xact lock", () => {
    expect(MIGRATION).toMatch(/pg_advisory_xact_lock\(hashtextextended\(p_org_id::text \|\| ':' \|\| p_user_id::text/);
  });

  it("checks the ledger balance BEFORE inserting the debit", () => {
    const balanceCheck = MIGRATION.indexOf("if v_balance < v_credits");
    const debitInsert = MIGRATION.indexOf("-v_credits");
    expect(balanceCheck).toBeGreaterThan(-1);
    expect(debitInsert).toBeGreaterThan(-1);
    expect(balanceCheck).toBeLessThan(debitInsert);
  });

  it("locks the product row FOR UPDATE (stock decrement can't race)", () => {
    expect(MIGRATION).toMatch(/from public\.credit_products[\s\S]*?for update/);
  });

  it("guards the stock decrement (null = unlimited, floor via out_of_stock branch)", () => {
    expect(MIGRATION).toMatch(/v_stock is not null and v_stock < 1/);
    expect(MIGRATION).toMatch(/set stock_qty = stock_qty - 1[\s\S]*?stock_qty is not null/);
  });

  it("revokes anon and grants only authenticated", () => {
    expect(MIGRATION).toMatch(/revoke all on function public\.purchase_store_item[\s\S]*from public, anon/);
    expect(MIGRATION).toMatch(/grant execute on function public\.purchase_store_item[\s\S]*to authenticated/);
  });

  it("never debits for a pack (packs are money-priced, not credit-priced)", () => {
    expect(MIGRATION).toMatch(/v_kind <> 'item'[\s\S]*?'not_purchasable'/);
  });
});

describe("stocking RLS — manager band", () => {
  it("credit_products and vouchers write policies are recreated for the manager band", () => {
    const bands = MIGRATION.match(
      /create policy (?:credit_products_write|vouchers_write)[\s\S]*?array\['owner', 'admin', 'manager', 'controller'\]/g,
    );
    expect(bands?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("credit_purchases is select-only for authenticated (writes go through the RPC)", () => {
    expect(MIGRATION).toMatch(/grant select on public\.credit_purchases to authenticated/);
    expect(MIGRATION).not.toMatch(/grant [^;]*insert[^;]* on public\.credit_purchases/);
  });
});

describe("balance math (pure mirror of the RPC guards)", () => {
  const item = (over: Partial<CreditProduct> = {}): Pick<CreditProduct, "product_kind" | "product_state" | "stock_qty" | "credits"> => ({
    product_kind: "item",
    product_state: "active",
    stock_qty: null,
    credits: 50,
    ...over,
  });

  it("a debit never exceeds the balance: purchase refused whenever price > balance", () => {
    for (const balance of [0, 1, 49]) {
      const check = canPurchase(item(), balance);
      expect(check.ok).toBe(false);
      if (!check.ok) {
        expect(check.reason).toBe("insufficient_balance");
        expect(check.shortfall).toBe(50 - balance);
      }
    }
  });

  it("purchase allowed at exactly the balance (post-debit balance is zero, never negative)", () => {
    expect(canPurchase(item(), 50)).toEqual({ ok: true });
    expect(canPurchase(item(), 51)).toEqual({ ok: true });
  });

  it("packs are never credit-purchasable; archived and out-of-stock items refuse", () => {
    expect(canPurchase(item({ product_kind: "pack" }), 1000)).toEqual({ ok: false, reason: "not_purchasable" });
    expect(canPurchase(item({ product_state: "archived" }), 1000)).toEqual({ ok: false, reason: "inactive" });
    expect(canPurchase(item({ stock_qty: 0 }), 1000)).toEqual({ ok: false, reason: "out_of_stock" });
    expect(canPurchase(item({ stock_qty: 1 }), 1000)).toEqual({ ok: true });
  });

  it("creditBalance sums credits and debits (the ledger is the balance SSOT)", () => {
    expect(creditBalance([])).toBe(0);
    expect(creditBalance([{ delta: 100 }, { delta: -40 }, { delta: 25 }])).toBe(85);
    // A ledger produced under the RPC's invariant can never sum negative:
    // simulate grant → spend → spend-refused (no row).
    const ledger: Array<{ delta: number }> = [{ delta: 100 }];
    const spend = (price: number) => {
      if (creditBalance(ledger) >= price) ledger.push({ delta: -price });
    };
    spend(60);
    spend(60); // refused — only 40 left
    spend(40);
    expect(creditBalance(ledger)).toBe(0);
    expect(ledger).toHaveLength(3);
  });
});
