/**
 * GVTEWAY public commerce — shared helpers for the Shopify-style store.
 * Schema-anchored to migration PENDING_gvteway_store_commerce.sql. Pattern
 * mirrors `src/lib/marketplace.ts` / `src/lib/workforce.ts`: enum tuples
 * `as const` → derived types → small helpers + label/tone maps.
 *
 * Used by the public storefront (marketing shell, anon), the cart view,
 * and any operator surfaces. Checkout INITIATION reuses the existing
 * /api/v1/stripe/checkout flow — no payment logic lives here.
 */

// ============================================================
// Product lifecycle — sequential macro arc → `product_state`
// ============================================================
export const STORE_PRODUCT_STATES = ["draft", "published", "archived"] as const;
export type StoreProductState = (typeof STORE_PRODUCT_STATES)[number];

export const STORE_PRODUCT_STATE_LABELS: Record<StoreProductState, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

// ============================================================
// Cart lifecycle — cyclical operational → `cart_state`
// ============================================================
export const STORE_CART_STATES = ["open", "checkout", "converted", "abandoned"] as const;
export type StoreCartState = (typeof STORE_CART_STATES)[number];

export const STORE_CART_STATE_LABELS: Record<StoreCartState, string> = {
  open: "Open",
  checkout: "In checkout",
  converted: "Converted",
  abandoned: "Abandoned",
};

/** Tone mapping for status badges across store surfaces. */
export const STORE_STATE_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  // product
  draft: "muted",
  published: "success",
  archived: "muted",
  // cart
  open: "info",
  checkout: "warning",
  converted: "success",
  abandoned: "muted",
};

// ============================================================
// Row shapes (schema-anchored; avoids depending on generated types
// before the migration is applied)
// ============================================================
export type StoreProduct = {
  id: string;
  org_id: string;
  title: string;
  slug: string;
  description: string | null;
  product_state: StoreProductState;
  price_cents: number;
  currency: string;
  inventory_qty: number;
  image_url: string | null;
  sku: string | null;
  published_at: string | null;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StoreProductVariant = {
  id: string;
  org_id: string;
  product_id: string;
  title: string;
  sku: string | null;
  price_cents: number | null;
  inventory_qty: number;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StoreCart = {
  id: string;
  org_id: string;
  user_id: string | null;
  session_token: string | null;
  cart_state: StoreCartState;
  currency: string;
  checkout_session_id: string | null;
  created_at: string;
  updated_at: string;
};

export type StoreCartItem = {
  id: string;
  org_id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price_cents: number;
  created_at: string;
  updated_at: string;
};

// ============================================================
// Money + slug helpers
// ============================================================

/** Format integer cents as a localized currency string. */
export function formatMoney(cents: number | null | undefined, currency = "USD", locale = "en-US"): string {
  const value = typeof cents === "number" ? cents : 0;
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value / 100);
}

/**
 * Slug a product title for the public store URL — lowercase ASCII +
 * hyphens, runs collapsed, trimmed to 60 chars. Mirrors
 * `marketplace.slugify` so storefront slugs are consistent.
 */
export function slugifyProduct(input: string): string {
  const ascii = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return ascii || "product";
}

/** Effective unit price for a line: variant override falls back to product. */
export function effectiveUnitPriceCents(
  product: Pick<StoreProduct, "price_cents">,
  variant?: Pick<StoreProductVariant, "price_cents"> | null,
): number {
  if (variant && typeof variant.price_cents === "number") return variant.price_cents;
  return product.price_cents;
}

// ============================================================
// Cart math
// ============================================================
export type CartLine = Pick<StoreCartItem, "quantity" | "unit_price_cents">;

/** Sum of quantity × unit price across all lines (in cents). */
export function cartSubtotalCents(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity * l.unit_price_cents, 0);
}

/** Total item count (sum of quantities) — drives the cart-badge counter. */
export function cartItemCount(lines: Pick<StoreCartItem, "quantity">[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

/** Whether a product can still be added given on-hand inventory. */
export function isPurchasable(product: Pick<StoreProduct, "product_state" | "inventory_qty">): boolean {
  return product.product_state === "published" && product.inventory_qty > 0;
}
