"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { filesFrom, uploadFieldPhotos } from "@/lib/mobile/photo-upload";
import { findOrCreateDirectRoom } from "@/lib/db/chat-rooms";

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

/** Case/spacing-tolerant map from any condition label → the enum value. */
function conditionFromLabel(raw: string | undefined): ItemCondition | null {
  if (!raw) return null;
  const n = raw.trim().toLowerCase();
  if (n.startsWith("like")) return "like_new";
  if (n.startsWith("for")) return "for_parts";
  if (n.startsWith("used")) return "used";
  if (n.startsWith("new")) return "new";
  return CONDITION_FROM_LABEL[raw] ?? null;
}

const UpdateInput = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, "A title is required."),
  description: z.string().trim().optional(),
  price: z.string().trim().optional(),
  condition: z.string().trim().optional(),
  category: z.string().trim().optional(),
});

/**
 * Edit an existing listing. RLS gates the update to the seller (or org
 * owner/admin). Photos are only replaced when new files are attached — an edit
 * that doesn't re-upload keeps the existing gallery rather than blanking it.
 */
export async function updateListing(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const photoFiles = filesFrom(fd, "photo");
  const parsed = UpdateInput.safeParse(
    Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string")),
  );
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }

  const supabase = await createClient();

  // Only replace photos when new files are attached — an edit that doesn't
  // re-upload keeps the existing gallery.
  const upload =
    photoFiles.length > 0
      ? await uploadFieldPhotos(supabase, LISTING_PHOTO_BUCKET, session.orgId, session.userId, photoFiles)
      : null;

  // NOTE: the kit `listing` form collects item/price/cond/desc/photo — NOT
  // category — so category is intentionally left untouched here (patching it
  // from an absent field would blank an existing category).
  const { data, error } = await supabase
    .from("marketplace_listings")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      price_cents: parsePriceCents(parsed.data.price),
      item_condition: conditionFromLabel(parsed.data.condition),
      ...(upload ? { photos: upload.refs } : {}),
    })
    .eq("id", parsed.data.id)
    .is("deleted_at", null)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "You can only edit your own listing." };

  revalidatePath("/m/market");
  return upload?.error ? { warning: `Listing updated. ${upload.error}` } : null;
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

/**
 * Open (or reuse) a direct thread with a listing's seller so a buyer can ask
 * about it in-app. The seller is resolved server-side from the listing (never
 * trusted from the client), and `findOrCreateDirectRoom` — the same helper the
 * inbox's New DM uses — creates the 2-party room under the creator-bootstrap RLS
 * path (both parties are members of the same org; listings are org-scoped). The
 * buyer writes the first message in the thread, so no message is fabricated on
 * their behalf. Returns the room id for the caller to navigate to.
 */
export async function contactSeller(listingId: string): Promise<{ error?: string; roomId?: string }> {
  const session = await requireSession();
  if (!listingId) return { error: "Invalid request." };

  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("seller_user_id")
    .eq("id", listingId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!listing) return { error: "That listing is no longer available." };

  const sellerId = (listing as { seller_user_id: string }).seller_user_id;
  if (sellerId === session.userId) return { error: "That's your own listing." };

  const res = await findOrCreateDirectRoom(supabase, session, sellerId);
  return "error" in res ? { error: res.error } : { roomId: res.roomId };
}
