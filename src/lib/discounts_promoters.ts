/**
 * GVTEWAY commerce admin — discount codes + promoter/affiliate splits.
 *
 * Single helper file for the discounts + promoters module (migration
 * PENDING_discounts_promoter_splits). Mirrors Shopify discounts and
 * Posh.VIP affiliate commission attribution. Pattern matches
 * `src/lib/workforce.ts` / `src/lib/marketplace.ts`: enum tuples
 * `as const` → derived types → label maps + small pure helpers.
 */

import { formatMoney, formatNumber } from "@/lib/i18n/format";

// ============================================================
// Discount codes
// ============================================================
export const DISCOUNT_KINDS = ["percent", "fixed"] as const;
export type DiscountKind = (typeof DISCOUNT_KINDS)[number];

export const DISCOUNT_STATES = ["active", "paused", "expired"] as const;
export type DiscountState = (typeof DISCOUNT_STATES)[number];

export const DISCOUNT_KIND_LABELS: Record<DiscountKind, string> = {
  percent: "Percent off",
  fixed: "Fixed amount off",
};

export const DISCOUNT_STATE_LABELS: Record<DiscountState, string> = {
  active: "Active",
  paused: "Paused",
  expired: "Expired",
};

// ============================================================
// Promoters (affiliates)
// ============================================================
export const PROMOTER_STATES = ["active", "paused", "archived"] as const;
export type PromoterState = (typeof PROMOTER_STATES)[number];

export const PROMOTER_STATE_LABELS: Record<PromoterState, string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

// ============================================================
// Helpers
// ============================================================

/** Render a discount value for display given its kind. percent → "10%"
 *  (value is basis points); fixed → "$12.50" (value is cents). */
export function formatDiscountValue(kind: DiscountKind, value: number): string {
  if (kind === "percent") {
    return `${formatNumber(value / 100, { maximumFractionDigits: 2 })}%`;
  }
  return formatMoney(value);
}

/** Apply a discount to an order subtotal (in cents). Never returns a
 *  negative total; fixed discounts are clamped at the subtotal. */
export function applyDiscount(kind: DiscountKind, value: number, subtotalCents: number): number {
  if (subtotalCents <= 0) return 0;
  const off = kind === "percent" ? Math.round((subtotalCents * value) / 10000) : value;
  return Math.max(0, subtotalCents - Math.min(off, subtotalCents));
}

/** True when a code has hit its redemption cap. Null/0 cap = unlimited. */
export function isRedemptionExhausted(maxRedemptions: number | null, redeemedCount: number): boolean {
  if (maxRedemptions === null || maxRedemptions === 0) return false;
  return redeemedCount >= maxRedemptions;
}

/** Whether a code is usable right now: active state, within any date
 *  window, and under its redemption cap. */
export function isDiscountRedeemable(
  code: {
    discount_state: DiscountState;
    starts_at: string | null;
    ends_at: string | null;
    max_redemptions: number | null;
    redeemed_count: number;
  },
  now: Date = new Date(),
): boolean {
  if (code.discount_state !== "active") return false;
  if (isRedemptionExhausted(code.max_redemptions, code.redeemed_count)) return false;
  if (code.starts_at && new Date(code.starts_at) > now) return false;
  if (code.ends_at && new Date(code.ends_at) < now) return false;
  return true;
}

/** Commission owed on a gross amount for a given bps rate, in cents. */
export function commissionCents(amountCents: number, commissionBps: number): number {
  if (amountCents <= 0 || commissionBps <= 0) return 0;
  return Math.round((amountCents * commissionBps) / 10000);
}

/** "1500" bps → "15%" for display. */
export function formatBps(bps: number): string {
  return `${formatNumber(bps / 100, { maximumFractionDigits: 2 })}%`;
}

/** Normalize a user-entered code/ref to the canonical stored form:
 *  trimmed, uppercased, spaces collapsed to single dashes. */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "-");
}
