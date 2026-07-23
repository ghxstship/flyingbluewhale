"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { PRODUCT_KINDS, PRODUCT_STATES } from "@/lib/legend_store";

/**
 * Store stocking actions (readiness blocker B-4b): credit_products CRUD +
 * voucher batch minting. Manager+ band, mirroring the resources-hub CRUD
 * idiom; RLS backs the gate (write policies widened to the manager band in
 * migration 20260723120000).
 */

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const ProductSchema = z
  .object({
    sku: z.string().min(1, "SKU is required").max(64),
    name: z.string().min(1, "Name is required").max(160),
    description: z.string().max(2000).optional().or(z.literal("")),
    product_kind: z.enum(PRODUCT_KINDS),
    credits: z.coerce.number().int().min(1, "Credits must be at least 1"),
    price_cents: z.coerce.number().int().min(0).default(0),
    stock_qty: z
      .union([z.literal(""), z.coerce.number().int().min(0)])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    product_state: z.enum(PRODUCT_STATES).default("active"),
  })
  .superRefine((d, ctx) => {
    // A pack is bought with money: it needs a real price. An item is bought
    // with credits: its `credits` field IS the price and money price is 0.
    if (d.product_kind === "pack" && d.price_cents < 1) {
      ctx.addIssue({ code: "custom", path: ["price_cents"], message: "A credit pack needs a price" });
    }
  });

export async function createProductAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can stock the store" };
  const parsed = ProductSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db.from("credit_products").insert({
    org_id: session.orgId,
    sku: d.sku,
    name: d.name,
    description: d.description || null,
    product_kind: d.product_kind,
    credits: d.credits,
    price_cents: d.product_kind === "item" ? 0 : d.price_cents,
    stock_qty: d.product_kind === "item" ? d.stock_qty : null,
    product_state: d.product_state,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/legend/store/admin");
  revalidatePath("/legend/store");
  redirect("/legend/store/admin");
}

export async function updateProductAction(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit store products" };
  const parsed = ProductSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("credit_products")
    .update({
      sku: d.sku,
      name: d.name,
      description: d.description || null,
      product_kind: d.product_kind,
      credits: d.credits,
      price_cents: d.product_kind === "item" ? 0 : d.price_cents,
      stock_qty: d.product_kind === "item" ? d.stock_qty : null,
      product_state: d.product_state,
    })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) return actionFail(error.message, fd);
  revalidatePath("/legend/store/admin");
  revalidatePath("/legend/store");
  redirect("/legend/store/admin");
}

/** Retire (archive) / reactivate a product — facet flip, never a delete. */
export async function setProductStateAction(id: string, next: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can change product state");
  const parsed = z.enum(PRODUCT_STATES).safeParse(next);
  if (!parsed.success) throw new Error("Invalid product state");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("credit_products")
    .update({ product_state: parsed.data })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id");
  if (error) throw new Error(`Could not update product: ${error.message}`);
  // RLS no-op returns no error — read back so a silently-skipped write fails loudly.
  if (!data || data.length === 0) throw new Error("Product not found or write not permitted");
  revalidatePath("/legend/store/admin");
  revalidatePath("/legend/store");
}

// Unambiguous voucher alphabet (no 0/O/1/I/L) — 8 chars ≈ 39 bits of entropy.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateVoucherCode(prefix: string): string {
  const bytes = randomBytes(8);
  let body = "";
  for (let i = 0; i < 8; i++) body += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  return `${prefix}-${body}`;
}

const VoucherBatchSchema = z.object({
  prefix: z
    .string()
    .min(2, "Prefix is required")
    .max(16)
    .regex(/^[A-Za-z0-9]+$/, "Letters and numbers only")
    .transform((v) => v.toUpperCase()),
  count: z.coerce.number().int().min(1, "At least 1 code").max(200, "At most 200 codes per batch"),
  credits: z.coerce.number().int().min(1, "Credits must be at least 1"),
  max_redemptions: z.coerce.number().int().min(1).default(1),
  expires_on: z.string().optional().or(z.literal("")),
});

export async function createVoucherBatchAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can mint vouchers" };
  const parsed = VoucherBatchSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;

  const rows = Array.from({ length: d.count }, () => ({
    org_id: session.orgId,
    code: generateVoucherCode(d.prefix),
    credits: d.credits,
    max_redemptions: d.max_redemptions,
    expires_on: d.expires_on || null,
    voucher_state: "active",
    created_by: session.userId,
  }));

  const { data, error } = await db.from("vouchers").insert(rows).select("code");
  if (error) return actionFail(error.message, fd);
  if (!data || data.length === 0) return actionFail("Voucher mint not permitted", fd);
  revalidatePath("/legend/store/admin");
  redirect("/legend/store/admin?minted=" + data.length);
}

/** Void a voucher — terminal facet; existing redemptions keep their credits. */
export async function voidVoucherAction(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can void vouchers");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("vouchers")
    .update({ voucher_state: "void" })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id");
  if (error) throw new Error(`Could not void voucher: ${error.message}`);
  if (!data || data.length === 0) throw new Error("Voucher not found or write not permitted");
  revalidatePath("/legend/store/admin");
}
