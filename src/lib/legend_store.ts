/**
 * LEG3ND credits + voucher store vocabulary. Enum tuples → types → label
 * maps + pure helpers. Backed by migration 20260623150030_legend_store
 * (credit_products, credit_ledger, credit_orders, vouchers,
 * voucher_redemptions). Checkout reuses the Stripe invoice pattern.
 */
import type { StateTone } from "@/lib/tones";

export const PRODUCT_STATES = ["active", "archived"] as const;
export type ProductState = (typeof PRODUCT_STATES)[number];

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
  credits: number;
  price_cents: number;
  currency: string;
  stripe_price_id: string | null;
  product_state: ProductState;
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
