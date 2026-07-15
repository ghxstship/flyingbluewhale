"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { filesFrom, uploadFieldPhotos } from "@/lib/mobile/photo-upload";

export type State = { error?: string; warning?: string; fieldErrors?: Record<string, string> } | null;

/** Listing photos get their own private bucket — they're neither incident
 *  evidence nor project record, and `branding` is public. */
const LISTING_PHOTO_BUCKET = "listing-photos";

type ItemCondition = "new" | "like_new" | "used" | "for_parts";

// Maps the kit `listing` form's human-readable condition options → enum values.
const CONDITION_FROM_LABEL: Record<string, ItemCondition> = {
  New: "new",
  "Like new": "like_new",
  Used: "used",
  "For parts": "for_parts",
  new: "new",
  like_new: "like_new",
  used: "used",
  for_parts: "for_parts",
};

const CreateInput = z.object({
  title: z.string().trim().min(1, "A title is required."),
  description: z.string().trim().optional(),
  price: z.string().trim().optional(),
  condition: z.string().trim().optional(),
  category: z.string().trim().optional(),
});

function parsePriceCents(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const dollars = Number(cleaned);
  if (!Number.isFinite(dollars)) return null;
  return Math.round(dollars * 100);
}

/**
 * Create an active marketplace listing. RLS WITH CHECK requires the row's
 * org_id be a member org AND seller_user_id = auth.uid(), so both owner
 * columns are set from the session.
 */
export async function createListing(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Files first — Object.fromEntries would stringify them.
  const photoFiles = filesFrom(fd, "photo");
  const parsed = CreateInput.safeParse(Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string")));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }

  const condition = parsed.data.condition
    ? (CONDITION_FROM_LABEL[parsed.data.condition] ?? null)
    : null;

  const supabase = await createClient();

  // No geotag: this is a crew member's own property, not site evidence.
  // `uploadFieldPhotos` is called without fixes, so the refs carry null
  // coordinates by design — see the column comment on marketplace_listings.
  const upload = await uploadFieldPhotos(
    supabase,
    LISTING_PHOTO_BUCKET,
    session.orgId,
    session.userId,
    photoFiles,
  );

  const { error } = await supabase.from("marketplace_listings").insert({
    org_id: session.orgId,
    seller_user_id: session.userId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    price_cents: parsePriceCents(parsed.data.price),
    item_condition: condition,
    category: parsed.data.category || null,
    listing_state: "active",
    photos: upload.refs,
  });
  if (error) return { error: error.message };

  revalidatePath("/m/market");
  return upload.error ? { warning: `Listing posted. ${upload.error}` } : null;
}

const IdInput = z.object({ id: z.string().uuid() });

/** Mark a listing sold. RLS gates the update to the seller (or org owner/admin). */
export async function markSold(_prev: State, fd: FormData): Promise<State> {
  await requireSession();
  const parsed = IdInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("marketplace_listings")
    .update({ listing_state: "sold" })
    .eq("id", parsed.data.id);
  if (error) return { error: error.message };

  revalidatePath("/m/market");
  return null;
}

/** Withdraw a listing. RLS gates the update to the seller (or org owner/admin). */
export async function withdrawListing(_prev: State, fd: FormData): Promise<State> {
  await requireSession();
  const parsed = IdInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("marketplace_listings")
    .update({ listing_state: "withdrawn" })
    .eq("id", parsed.data.id);
  if (error) return { error: error.message };

  revalidatePath("/m/market");
  return null;
}
