"use server";

import { emitAudit } from "@/lib/audit";
import { requireSession } from "@/lib/auth";
import { hashPin, pinLookupDigest, validatePin } from "@/lib/kiosk/pins";
import { kioskPinSecret } from "@/lib/kiosk/server";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string; ok?: boolean } | null;

/**
 * Self-serve punch-PIN set / replace — a worker sets their OWN PIN from
 * their own session (RLS: own-row policy). The PIN itself never persists:
 * only the scrypt hash + the org-scoped HMAC lookup digest do.
 *
 * The digest's partial unique index doubles as the org-scoped uniqueness
 * gate — a collision surfaces as "unavailable", which leaks only that SOME
 * worker uses that PIN, an accepted trade for unambiguous kiosk resolution
 * (the standard trade in shared-device time clocks).
 */
export async function setKioskPin(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const pin = String(fd.get("pin") ?? "").trim();
  const confirm = String(fd.get("confirm") ?? "").trim();

  const verdict = validatePin(pin);
  if (!verdict.ok) {
    return verdict.reason === "format"
      ? { error: "PIN must be 4 to 6 digits." }
      : { error: "That PIN is too guessable (repeats or a run). Pick something less obvious." };
  }
  if (pin !== confirm) return { error: "PINs don't match." };

  const secret = kioskPinSecret();
  if (!secret) return { error: "PIN sign-in is not configured on this deployment." };

  const supabase = await createClient();
  const { error } = await supabase.from("kiosk_worker_pins").upsert(
    {
      org_id: session.orgId,
      user_id: session.userId,
      pin_hash: hashPin(pin),
      pin_lookup_digest: pinLookupDigest(session.orgId, pin, secret),
      active: true,
      set_by: session.userId,
    },
    { onConflict: "org_id,user_id" },
  );
  if (error) {
    // 23505 on the digest index = another worker already holds this PIN.
    if (error.code === "23505") {
      return { error: "That PIN is unavailable. Choose a different one." };
    }
    log.error("kiosk.pin.set_failed", { err: error.message });
    return { error: error.message };
  }

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "kiosk.pin.set",
    targetTable: "kiosk_worker_pins",
    // Composite-PK table; the actor + org already identify the row.
    targetId: null,
  });

  return { ok: true };
}
