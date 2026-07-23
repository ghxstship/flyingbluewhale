/**
 * LEG3ND credits + voucher store vocabulary. Enum tuples → types → label
 * maps + pure helpers. Backed by migration 20260623150030_legend_store
 * (credit_products, credit_ledger, credit_orders, vouchers,
 * voucher_redemptions). Checkout reuses the Stripe invoice pattern.
 */
import type { StateTone } from "@/lib/tones";

export const PRODUCT_STATES = ["active", "archived"] as const;
export type ProductState = (typeof PRODUCT_STATES)[number];

/**
 * Product facet (migration 20260723172000_legend_store_economy):
 * `pack` — money buys credits (Stripe checkout; `credits` = amount granted).
 * `item` — credits buy the product (`credits` = price debited via the
 * `purchase_store_item` RPC, yielding a `credit_purchases` entitlement row).
 */
export const PRODUCT_KINDS = ["pack", "item"] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number];
export const PRODUCT_KIND_LABELS: Record<ProductKind, string> = {
  pack: "Credit pack",
  item: "Store item",
};

export const PURCHASE_STATES = ["fulfilled", "reversed"] as const;
export type PurchaseState = (typeof PURCHASE_STATES)[number];
export const PURCHASE_STATE_LABELS: Record<PurchaseState, string> = {
  fulfilled: "Fulfilled",
  reversed: "Reversed",
};
export const PURCHASE_STATE_TONES: Record<PurchaseState, StateTone> = {
  fulfilled: "success",
  reversed: "warning",
};

export const ORDER_STATES = ["pending", "paid", "fulfilled", "cancelled", "refunded"] as const;
export type OrderState = (typeof ORDER_STATES)[number];
export const ORDER_STATE_LABELS: Record<OrderState, string> = {
  pending: "Pending",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
  refunded: "Refunded",
};
export const ORDER_STATE_TONES: Record<OrderState, StateTone> = {
  pending: "muted",
  paid: "info",
  fulfilled: "success",
  cancelled: "muted",
  refunded: "warning",
};

export const VOUCHER_STATES = ["active", "redeemed", "expired", "void"] as const;
export type VoucherState = (typeof VOUCHER_STATES)[number];
export const VOUCHER_STATE_TONES: Record<VoucherState, StateTone> = {
  active: "success",
  redeemed: "muted",
  expired: "warning",
  void: "error",
};

export type CreditProduct = {
  id: string;
  org_id: string;
  sku: string;
  name: string;
  description: string | null;
  /** Credit magnitude: granted to the buyer for a pack, debited for an item. */
  credits: number;
  price_cents: number;
  currency: string;
  stripe_price_id: string | null;
  product_state: ProductState;
  product_kind: ProductKind;
  /** Remaining sellable units for an item; null = unlimited. */
  stock_qty: number | null;
};

/** A fulfilled item purchase — the buyer's entitlement record. */
export type CreditPurchase = {
  id: string;
  org_id: string;
  user_id: string;
  credit_product_id: string;
  item_name: string;
  credits_spent: number;
  purchase_state: PurchaseState;
  created_at: string;
};

export type Voucher = {
  id: string;
  org_id: string;
  code: string;
  credits: number;
  max_redemptions: number;
  redeemed_count: number;
  expires_on: string | null;
  voucher_state: VoucherState;
};

/** Format cents → "$49.00" (USD default; other currencies via Intl). */
export function formatPrice(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

/** Sum a credit ledger into a balance. */
export function creditBalance(ledger: ReadonlyArray<{ delta: number }>): number {
  return ledger.reduce((s, r) => s + r.delta, 0);
}

export type PurchaseCheck =
  | { ok: true }
  | { ok: false; reason: "not_purchasable" | "inactive" | "out_of_stock" | "insufficient_balance"; shortfall?: number };

/**
 * Pure mirror of the `purchase_store_item` RPC's guards, in check order, so
 * the store UI can render honest disabled states (the RPC remains the
 * authority — this never replaces the server-side check). Invariant: a
 * purchase is only ok when `balance >= price`, i.e. a debit can never exceed
 * the balance.
 */
export function canPurchase(
  product: Pick<CreditProduct, "product_kind" | "product_state" | "stock_qty" | "credits">,
  balance: number,
): PurchaseCheck {
  if (product.product_kind !== "item") return { ok: false, reason: "not_purchasable" };
  if (product.product_state !== "active") return { ok: false, reason: "inactive" };
  if (product.stock_qty !== null && product.stock_qty < 1) return { ok: false, reason: "out_of_stock" };
  if (balance < product.credits) {
    return { ok: false, reason: "insufficient_balance", shortfall: product.credits - balance };
  }
  return { ok: true };
}
