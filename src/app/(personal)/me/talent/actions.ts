"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/marketplace";
import { formFail } from "@/lib/forms/fail";

const HANDLE_RE = /^[a-z0-9_-]{3,64}$/;

const Schema = z.object({
  act_name: z.string().min(1).max(200),
  public_handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(HANDLE_RE, "3-64 characters: lowercase letters, digits, hyphen, underscore")
    .optional()
    .or(z.literal("")),
  tagline: z.string().max(200).optional().or(z.literal("")),
  bio: z.string().max(8000).optional().or(z.literal("")),
  genre_tags: z.string().max(400).optional().or(z.literal("")),
  fee_min: z.string().optional().or(z.literal("")),
  fee_max: z.string().optional().or(z.literal("")),
  video_reel_url: z.string().url().optional().or(z.literal("")),
  is_public: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

/** Parse a fee input. Returns `{ error }` on garbage instead of the old
 *  silent null coercion (AUDIT C-24) — "abc" used to save as an empty fee
 *  with no feedback. */
function parseFee(v: string | undefined): { cents: number | null } | { error: string } {
  if (!v || !v.trim()) return { cents: null };
  const n = Number(v.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n)) return { error: "Enter a number, like 2500" };
  if (n <= 0) return { error: "Must be greater than zero" };
  return { cents: Math.round(n * 100) };
}

const toArray = (v: string | undefined): string[] =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function safeFilename(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "photo";
}

/** Escape LIKE wildcards so `.ilike` matches the handle literally
 *  (handles may legitimately contain `_`). */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

export async function upsertMyTalentAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Fee validation with per-field errors instead of silent null coercion.
  const fieldErrors: Record<string, string> = {};
  const feeMin = parseFee(parsed.data.fee_min);
  const feeMax = parseFee(parsed.data.fee_max);
  if ("error" in feeMin) fieldErrors.fee_min = feeMin.error;
  if ("error" in feeMax) fieldErrors.fee_max = feeMax.error;
  if (
    !("error" in feeMin) &&
    !("error" in feeMax) &&
    feeMin.cents != null &&
    feeMax.cents != null &&
    feeMax.cents < feeMin.cents
  ) {
    fieldErrors.fee_max = "Must be at least the minimum fee";
  }
  if (Object.keys(fieldErrors).length > 0) {
    const values = Object.fromEntries(
      [...fd.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
    );
    return { error: "Check the highlighted fields.", fieldErrors, values };
  }

  const existingResp = await supabase
    .from("talent_profiles")
    .select("id, public_handle, photo_url")
    .eq("user_id", session.userId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const existing = existingResp.data as {
    id: string;
    public_handle: string | null;
    photo_url: string | null;
  } | null;

  // Handle resolution: user-provided > existing > generated (AUDIT C-24 —
  // handles were auto-generated once and never editable).
  const requestedHandle = parsed.data.public_handle?.trim().toLowerCase() || null;
  let handle =
    requestedHandle ??
    existing?.public_handle ??
    `${slugify(parsed.data.act_name)}-${Math.random().toString(36).slice(2, 6)}`;

  // Case-insensitive availability check when the handle is (re)claimed.
  if (requestedHandle && requestedHandle.toLowerCase() !== existing?.public_handle?.toLowerCase()) {
    let query = supabase
      .from("talent_profiles")
      .select("id")
      .ilike("public_handle", escapeLike(requestedHandle))
      .is("deleted_at", null);
    if (existing) query = query.neq("id", existing.id);
    const { data: taken } = await query.limit(1);
    if (taken && taken.length > 0) {
      const values = Object.fromEntries(
        [...fd.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
      );
      return {
        error: "That handle is already taken.",
        fieldErrors: { public_handle: "Already taken. Try another." },
        values,
      };
    }
    handle = requestedHandle;
  }

  // Optional EPK photo upload → the public-read `branding` bucket (same
  // store the org logo uploader uses), stored on talent_profiles.photo_url.
  let photoUrl = existing?.photo_url ?? null;
  const photo = fd.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > PHOTO_MAX_BYTES) return { error: "Photo exceeds 5 MB." };
    if (photo.type && !PHOTO_MIME.has(photo.type)) {
      return { error: "Photo must be a JPG, PNG, WebP, or GIF." };
    }
    const path = `${session.orgId}/talent/${crypto.randomUUID()}-${safeFilename(photo.name)}`;
    const buf = await photo.arrayBuffer();
    const { error: upErr } = await supabase.storage
      .from("branding")
      .upload(path, buf, { contentType: photo.type || "application/octet-stream", upsert: false });
    if (upErr) return { error: `Photo upload failed: ${upErr.message}` };
    const { data: pub } = supabase.storage.from("branding").getPublicUrl(path);
    photoUrl = pub.publicUrl;
  }

  const payload = {
    org_id: session.orgId,
    user_id: session.userId,
    act_name: parsed.data.act_name,
    tagline: parsed.data.tagline || null,
    bio: parsed.data.bio || null,
    genre_tags: toArray(parsed.data.genre_tags),
    fee_min_cents: "cents" in feeMin ? feeMin.cents : null,
    fee_max_cents: "cents" in feeMax ? feeMax.cents : null,
    video_reel_url: parsed.data.video_reel_url || null,
    is_public: parsed.data.is_public === "on",
    public_handle: handle,
    photo_url: photoUrl,
  };

  // The partial unique index talent_profiles_public_handle_unique backstops
  // the availability check above (RLS may hide other orgs' unpublished rows
  // from the pre-check) — surface a friendly message on collision.
  const friendly = (msg: string) =>
    msg.includes("talent_profiles_public_handle_unique") ? "That handle is already taken. Try another." : msg;

  if (existing) {
    const { error } = await supabase
      .from("talent_profiles")
      .update(payload)
      .eq("id", existing.id)
      .eq("user_id", session.userId)
      .eq("org_id", session.orgId);
    if (error) return { error: friendly(error.message) };
  } else {
    const { error } = await supabase.from("talent_profiles").insert({ ...payload, created_by: session.userId });
    if (error) return { error: friendly(error.message) };
  }

  revalidatePath("/me/talent");
  return { ok: true };
}
