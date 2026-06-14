import "server-only";

import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { StoreCart, StoreCartItem, StoreProduct, StoreProductVariant } from "@/lib/commerce_store";

/**
 * Cart session plumbing for the GVTEWAY public store.
 *
 * Anon shoppers are tracked via an httpOnly `store_cart` cookie holding an
 * opaque session token. Cart rows + items are created/read through the
 * service-role client because the anon RLS path is intentionally absent
 * (the token is the bearer secret and never leaves the cookie). All reads
 * are still strictly scoped to the cookie's token so one shopper can never
 * see another's cart.
 */

const CART_COOKIE = "store_cart";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function svc(): LooseSupabase {
  return createServiceClient() as unknown as LooseSupabase;
}

/** Read the current session token from the cookie, if any. */
export async function getCartToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

async function setCartToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/** Resolve the shopper's open cart from the cookie token — read-only. */
export async function getCurrentCart(): Promise<StoreCart | null> {
  const token = await getCartToken();
  if (!token) return null;
  const { data } = await svc()
    .from("store_carts")
    .select("*")
    .eq("session_token", token)
    .eq("cart_state", "open")
    .maybeSingle();
  return (data ?? null) as StoreCart | null;
}

/**
 * Resolve the shopper's open cart, creating one (bound to `orgId`) if none
 * exists. Issues + persists a session token cookie on first creation.
 * Carts are single-org: if the existing cart belongs to a different org,
 * it is converted-out (abandoned) and a fresh one is created.
 */
export async function ensureCart(orgId: string, currency = "USD"): Promise<StoreCart> {
  const token = await getCartToken();
  const supabase = svc();

  if (token) {
    const { data } = await supabase
      .from("store_carts")
      .select("*")
      .eq("session_token", token)
      .eq("cart_state", "open")
      .maybeSingle();
    const existing = (data ?? null) as StoreCart | null;
    if (existing) {
      if (existing.org_id === orgId) return existing;
      // Different org — close the old cart, fall through to create a new one
      // under the same token.
      await supabase.from("store_carts").update({ cart_state: "abandoned" }).eq("id", existing.id);
      const { data: created } = await supabase
        .from("store_carts")
        .insert({ org_id: orgId, session_token: token, currency, cart_state: "open" })
        .select("*")
        .single();
      return created as StoreCart;
    }
  }

  const newToken = crypto.randomUUID();
  const { data: created } = await supabase
    .from("store_carts")
    .insert({ org_id: orgId, session_token: newToken, currency, cart_state: "open" })
    .select("*")
    .single();
  await setCartToken(newToken);
  return created as StoreCart;
}

/** Cart line joined with its product (+ optional variant) for display. */
export type CartLineDisplay = {
  item: StoreCartItem;
  product: StoreProduct;
  variant: StoreProductVariant | null;
};

/** Read the current cart's lines hydrated with product + variant data. */
export async function getCartLines(cartId: string): Promise<CartLineDisplay[]> {
  const supabase = svc();
  const { data: items } = await supabase
    .from("store_cart_items")
    .select("*")
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });
  const rows = (items ?? []) as StoreCartItem[];
  if (rows.length === 0) return [];

  const productIds = [...new Set(rows.map((r) => r.product_id))];
  const variantIds = [...new Set(rows.map((r) => r.variant_id).filter(Boolean))] as string[];

  const { data: products } = await supabase.from("store_products").select("*").in("id", productIds);
  const productList = (products ?? []) as StoreProduct[];
  const productMap = new Map<string, StoreProduct>(productList.map((p) => [p.id, p]));

  const variantMap = new Map<string, StoreProductVariant>();
  if (variantIds.length > 0) {
    const { data: variants } = await supabase.from("store_product_variants").select("*").in("id", variantIds);
    const variantList = (variants ?? []) as StoreProductVariant[];
    for (const v of variantList) variantMap.set(v.id, v);
  }

  return rows
    .map((item) => {
      const product = productMap.get(item.product_id);
      if (!product) return null;
      return {
        item,
        product,
        variant: item.variant_id ? (variantMap.get(item.variant_id) ?? null) : null,
      } satisfies CartLineDisplay;
    })
    .filter((x): x is CartLineDisplay => x !== null);
}

export { CART_COOKIE };
