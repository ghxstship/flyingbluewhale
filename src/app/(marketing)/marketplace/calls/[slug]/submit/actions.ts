"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

const MediaLinkSchema = z.object({
  url: z.string().url(),
  label: z.string().max(80),
});

const Schema = z.object({
  open_call_id: z.string().uuid(),
  org_id: z.string().uuid(),
  cover_note: z.string().max(4000).optional().or(z.literal("")),
  fee_proposed: z.string().optional().or(z.literal("")),
  // guest-only fields
  guest_name: z.string().max(200).optional().or(z.literal("")),
  guest_email: z.string().email().optional().or(z.literal("")),
  // JSON-encoded array of {url,label}
  media_links_json: z.string().optional().or(z.literal("")),
});

export type State = { error?: string; ok?: boolean } | null;

export async function submitOpenCallAction(_: State, fd: FormData): Promise<State> {
  if (!hasSupabase) return { error: "Service unavailable" };

  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();

  // Resolve auth state — could be anon (guest) or authenticated.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isGuest = !user;

  if (isGuest) {
    if (!parsed.data.guest_name?.trim()) return { error: "Name is required" };
    if (!parsed.data.guest_email?.trim()) return { error: "Email is required" };
  }

  let mediaLinks: { url: string; label: string }[] = [];
  if (parsed.data.media_links_json) {
    try {
      const raw = JSON.parse(parsed.data.media_links_json);
      mediaLinks = z.array(MediaLinkSchema).parse(raw);
    } catch {
      // silently ignore malformed JSON — links are optional
    }
  }

  const feeCents = parsed.data.fee_proposed
    ? Math.round(Number(parsed.data.fee_proposed.replace(/[$,]/g, "")) * 100) || null
    : null;

  const { error } = await supabase.from("open_call_submissions").insert({
    org_id: parsed.data.org_id,
    open_call_id: parsed.data.open_call_id,
    submitter_user_id: isGuest ? null : user!.id,
    guest_name: isGuest ? parsed.data.guest_name!.trim() : null,
    guest_email: isGuest ? parsed.data.guest_email!.trim().toLowerCase() : null,
    cover_note: parsed.data.cover_note || null,
    fee_proposed_cents: feeCents,
    media_links: mediaLinks,
  });

  if (error) {
    if (error.code === "23505") return { error: "You have already submitted to this open call" };
    return { error: error.message };
  }

  return { ok: true };
}
