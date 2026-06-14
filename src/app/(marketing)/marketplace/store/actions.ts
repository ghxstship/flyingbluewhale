"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { httpFetch } from "@/lib/http";
import { urlFor } from "@/lib/urls";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { StoreCartItem, StoreProduct, StoreProductVariant } from "@/lib/commerce_store";
import { effectiveUnitPriceCents, cartSubtotalCents } from "@/lib/commerce_store";
import { ensureCart, getCurrentCart, getCartLines } from "./cart";

export type State = { error?: string; ok?: true } | null;

function svc(): LooseSupabase {
  return createServiceClient() as unknown as LooseSupabase;
}

// ─────────────────────────────────────────────────────────────────────
// Add to cart
// ─────────────────────────────────────────────────────────────────────
const AddSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export async function addToCart(_: State, fd: FormData): Promise<State> {
  const parsed = AddSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  const { product_id, quantity } = parsed.data;
  const variant_id = parsed.data.variant_id || null;
  const supabase = svc();

  // Only published, in-stock products are addable. Service-role read is
  // gated explicitly here since RLS is bypassed for the service client.
  const { data: product } = await supabase
    .from("store_products")
    .select("*")
    .eq("id", product_id)
    .eq("product_state", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (!product) return { error: "Product is not available." };
  const p = product as StoreProduct;
  if (p.inventory_qty <= 0) return { error: "This product is out of stock." };

  let variant: StoreProductVariant | null = null;
  if (variant_id) {
    const { data: v } = await supabase
      .from("store_product_variants")
      .select("*")
      .eq("id", variant_id)
      .eq("product_id", product_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!v) return { error: "Selected option is not available." };
    variant = v as StoreProductVariant;
  }

  const cart = await ensureCart(p.org_id, p.currency);
  const unitPrice = effectiveUnitPriceCents(p, variant);

  // Upsert the line — bump quantity if the same product/variant is already
  // in the cart (the unique constraint enforces this).
  const { data: existing } = await supabase
    .from("store_cart_items")
    .select("*")
    .eq("cart_id", cart.id)
    .eq("product_id", product_id)
    .is("variant_id", variant_id)
    .maybeSingle();

  if (existing) {
    const row = existing as StoreCartItem;
    await supabase
      .from("store_cart_items")
      .update({ quantity: Math.min(99, row.quantity + quantity) })
      .eq("id", row.id);
  } else {
    await supabase.from("store_cart_items").insert({
      org_id: p.org_id,
      cart_id: cart.id,
      product_id,
      variant_id,
      quantity,
      unit_price_cents: unitPrice,
    });
  }

  revalidatePath("/marketplace/store/cart");
  redirect("/marketplace/store/cart");
}

// ─────────────────────────────────────────────────────────────────────
// Update line quantity
// ─────────────────────────────────────────────────────────────────────
const UpdateSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(0).max(99),
});

export async function updateCartItem(_: State, fd: FormData): Promise<State> {
  const parsed = UpdateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  const cart = await getCurrentCart();
  if (!cart) return { error: "Cart not found." };
  const supabase = svc();

  // Scope the mutation to the cookie's cart so a forged item_id from
  // another cart can't be touched.
  if (parsed.data.quantity === 0) {
    await supabase.from("store_cart_items").delete().eq("id", parsed.data.item_id).eq("cart_id", cart.id);
  } else {
    await supabase
      .from("store_cart_items")
      .update({ quantity: parsed.data.quantity })
      .eq("id", parsed.data.item_id)
      .eq("cart_id", cart.id);
  }
  revalidatePath("/marketplace/store/cart");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
// Remove line
// ─────────────────────────────────────────────────────────────────────
const RemoveSchema = z.object({ item_id: z.string().uuid() });

export async function removeCartItem(_: State, fd: FormData): Promise<State> {
  const parsed = RemoveSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  const cart = await getCurrentCart();
  if (!cart) return { error: "Cart not found." };
  await svc().from("store_cart_items").delete().eq("id", parsed.data.item_id).eq("cart_id", cart.id);
  revalidatePath("/marketplace/store/cart");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
// Checkout INITIATION — reuses the Stripe Checkout Sessions API directly
// (same shape as /api/v1/stripe/checkout). NO payment processing here:
// we only create the hosted-checkout session and redirect to its URL.
// ─────────────────────────────────────────────────────────────────────
export async function startCheckout(_: State, __: FormData): Promise<State> {
  if (!env.STRIPE_SECRET_KEY) return { error: "Checkout is not configured." };
  const cart = await getCurrentCart();
  if (!cart) return { error: "Your cart is empty." };
  const lines = await getCartLines(cart.id);
  if (lines.length === 0) return { error: "Your cart is empty." };

  const subtotal = cartSubtotalCents(lines.map((l) => l.item));
  if (subtotal <= 0) return { error: "Your cart total is zero." };

  const form = new URLSearchParams();
  form.set("mode", "payment");
  lines.forEach((line, i) => {
    const name = line.variant ? `${line.product.title} — ${line.variant.title}` : line.product.title;
    form.set(`line_items[${i}][quantity]`, String(line.item.quantity));
    form.set(`line_items[${i}][price_data][currency]`, cart.currency.toLowerCase());
    form.set(`line_items[${i}][price_data][product_data][name]`, name);
    form.set(`line_items[${i}][price_data][unit_amount]`, String(line.item.unit_price_cents));
  });
  form.set("success_url", urlFor("marketing", "/marketplace/store/cart?checkout=success"));
  form.set("cancel_url", urlFor("marketing", "/marketplace/store/cart?checkout=cancelled"));
  form.set("metadata[store_cart_id]", cart.id);
  form.set("metadata[org_id]", cart.org_id);

  const res = await httpFetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
    timeoutMs: 10000,
  });
  if (!res.ok) return { error: "Could not start checkout. Please try again." };
  const s = (await res.json()) as { id: string; url: string };

  // Mark the cart as in-checkout and remember the session id. The Stripe
  // webhook (existing /api/v1/webhooks/stripe) is the source of truth for
  // converting it on payment_intent.succeeded.
  await svc().from("store_carts").update({ cart_state: "checkout", checkout_session_id: s.id }).eq("id", cart.id);

  redirect(s.url);
}
