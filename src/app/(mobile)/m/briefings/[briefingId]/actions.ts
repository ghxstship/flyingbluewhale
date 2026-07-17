"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";

export type State = { error?: string; warning?: string } | null;

/**
 * COMPVSS · briefing sign-in (G11 / briefing.signin).
 *
 * Two writes live here:
 *
 *  - `startTalk` — the deliverer flips the briefing to `conducted` from the
 *    field, mirroring the console's markConducted. Manager band only (the
 *    same band the shell's one role gate can express), and the update is
 *    read back because an RLS-refused UPDATE returns success with zero rows
 *    — the silent no-op class the identity sweeps kept tripping over.
 *
 *  - `signBriefing` — an attendee signs themselves in (user_id = caller,
 *    never a form field), or the deliverer passes the phone and a crew
 *    roster name is picked (crew_member_id row, the same shape the console
 *    writes). The signature arrives as a PNG data URL from SignaturePad /
 *    the typed fallback and is stored in the `incident-photos` bucket —
 *    the COMPVSS field-capture bucket — via the CALLER'S client: the
 *    `storage_org_scoped_upload` policy already admits an org member whose
 *    path starts with their org id, so RLS stays the gate and no service
 *    key is handed to a field form (photo-upload.ts precedent, not the
 *    receipts one — that bucket is service-only for its own reasons).
 *
 * Idempotent by design: the offline queue replays a submit after a signal
 * drop, so an already-signed row returns success instead of erroring, and
 * a pre-added roster row (console operators seed attendees) is UPDATED
 * rather than duplicated.
 */

const MAX_SIGNATURE_CHARS = 2_000_000; // ~1.5MB of PNG — same ceiling as /sign/[token]

const SignInput = z.object({
  briefingId: z.string().uuid(),
  // Drawn or typed-rendered signature from SignaturePad / the sign field.
  signature: z.string().startsWith("data:image/png;base64,").max(MAX_SIGNATURE_CHARS).optional().or(z.literal("")),
  // The keyboard / assistive-tech alternative (a freehand canvas must never
  // be the only way to sign — SignaturePad's own a11y rule).
  typedName: z.string().trim().max(120).optional().or(z.literal("")),
  // "Pass the phone": the deliverer hands the device around and each crew
  // member picks their roster name. Empty = the caller signs as themselves.
  crewMemberId: z.string().uuid().optional().or(z.literal("")),
  // Client capture time, for offline replays — the moment they signed, not
  // the moment the signal came back. Validated server-side, never trusted
  // into the future.
  signedAt: z.string().optional().or(z.literal("")),
});

function resolveSignedAt(raw: string | undefined): string {
  if (!raw) return new Date().toISOString();
  const parsed = new Date(raw);
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  // Future stamps and stale ghosts both collapse to "now" — the queue only
  // holds items for the current outage, not an archive.
  if (parsed.getTime() > now || parsed.getTime() < now - sevenDays) return new Date().toISOString();
  return parsed.toISOString();
}

export async function signBriefing(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = SignInput.safeParse(Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return { error: "Could not read the sign-in. Try again." };
  const v = parsed.data;

  const signature = v.signature || null;
  const typedName = v.typedName?.trim() || null;
  if (!signature && !typedName) {
    return { error: "Add your signature or type your full name first." };
  }

  const supabase = await createClient();

  // The briefing must be the caller's org's. RLS would blank it anyway;
  // checking here turns a cross-tenant probe into a clean error.
  const { data: briefing } = await supabase
    .from("safety_briefings")
    .select("id, briefing_state")
    .eq("id", v.briefingId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!briefing) return { error: "Briefing not found in your workspace." };
  if ((briefing as { briefing_state: string }).briefing_state === "cancelled") {
    return { error: "This briefing was cancelled. Nothing to sign." };
  }

  // Resolve who is signing. Self by default; a crew roster pick only when
  // the phone is being passed around.
  const crewMemberId = v.crewMemberId || null;
  if (crewMemberId) {
    const { data: crew } = await supabase
      .from("crew_members")
      .select("id")
      .eq("id", crewMemberId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!crew) return { error: "That crew member is not on your org's roster." };
  }

  // Existing row? Console operators pre-seed attendee rows; the queue
  // replays submits. Either way: update, don't duplicate.
  let existingQuery = supabase
    .from("safety_briefing_attendees")
    .select("id, acknowledged_at, signature_path")
    .eq("briefing_id", v.briefingId)
    .eq("org_id", session.orgId);
  existingQuery = crewMemberId
    ? existingQuery.eq("crew_member_id", crewMemberId)
    : existingQuery.eq("user_id", session.userId);
  const { data: existingRows } = await existingQuery.limit(1);
  const existing = (existingRows ?? [])[0] as
    | { id: string; acknowledged_at: string | null; signature_path: string | null }
    | undefined;

  // Queue-replay idempotency: already signed with a signature on file is
  // success, not an error — the first delivery simply won.
  if (existing?.acknowledged_at && existing.signature_path) {
    revalidatePath(`/m/briefings/${v.briefingId}`);
    return null;
  }

  // Upload the signature PNG before touching the row. Caller's client, org
  // prefix first — the storage policy checks exactly that.
  let signaturePath: string | null = null;
  let warning: string | undefined;
  if (signature) {
    const base64 = signature.slice("data:image/png;base64,".length);
    const bytes = Buffer.from(base64, "base64");
    if (bytes.byteLength === 0) {
      return { error: "That signature came through empty. Sign again." };
    }
    const who = crewMemberId ?? session.userId;
    const path = `${session.orgId}/briefing-signatures/${v.briefingId}/${Date.now()}-${who}.png`;
    const { error: upErr } = await supabase.storage.from("incident-photos").upload(path, bytes, {
      contentType: "image/png",
      cacheControl: "private, max-age=0",
      upsert: false,
    });
    if (upErr) {
      log.error("m.briefings.signature_upload_failed", { err: upErr.message });
      // The acknowledgment is the perishable part — the talk happened and
      // they were in the room. Record it; say plainly that the ink is
      // missing so the deliverer can re-collect it before the crew scatters.
      warning = "Signed in, but the signature image could not be saved. Have them sign again if the record needs ink.";
    } else {
      signaturePath = path;
    }
  }

  const acknowledgedAt = resolveSignedAt(v.signedAt || undefined);
  const notes = typedName ? `Signed as: ${typedName}` : null;

  if (existing) {
    const { data: updated, error } = await supabase
      .from("safety_briefing_attendees")
      .update({
        acknowledged_at: existing.acknowledged_at ?? acknowledgedAt,
        ...(signaturePath ? { signature_path: signaturePath } : {}),
        ...(notes ? { notes } : {}),
      })
      .eq("id", existing.id)
      .eq("org_id", session.orgId)
      .select("id");
    if (error) return { error: error.message };
    // RLS-refused updates "succeed" with zero rows — read the result back.
    if (!updated || updated.length === 0) return { error: "Could not record the sign-in. Try again." };
  } else {
    const { error } = await supabase.from("safety_briefing_attendees").insert({
      briefing_id: v.briefingId,
      org_id: session.orgId,
      // Self sign-in binds to the SESSION, never a form field — a spoofable
      // user_id is exactly the proxy-signing this surface exists to end.
      user_id: crewMemberId ? null : session.userId,
      crew_member_id: crewMemberId,
      acknowledged_at: acknowledgedAt,
      signature_path: signaturePath,
      notes,
    });
    if (error) {
      log.error("m.briefings.signin_insert_failed", { err: error.message });
      return { error: error.message };
    }
  }

  revalidatePath(`/m/briefings/${v.briefingId}`);
  revalidatePath("/m/briefings");
  return warning ? { warning } : null;
}

const StartInput = z.object({ briefingId: z.string().uuid() });

export async function startTalk(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return { error: "Only managers can mark the talk conducted." };
  }
  const parsed = StartInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Could not read the request." };

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("safety_briefings")
    .update({ briefing_state: "conducted", conducted_at: new Date().toISOString() })
    .eq("id", parsed.data.briefingId)
    .eq("org_id", session.orgId)
    .eq("briefing_state", "scheduled")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    // Zero rows = RLS refusal or a state race (someone else already flipped
    // it). Either way the button's premise is stale.
    return { error: "Could not start the talk. It may already be conducted." };
  }

  revalidatePath(`/m/briefings/${parsed.data.briefingId}`);
  revalidatePath("/m/briefings");
  return null;
}
