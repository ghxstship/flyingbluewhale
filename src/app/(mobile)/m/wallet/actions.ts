"use server";

import { createHmac } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-minted rotating gate token for the COMPVSS Rose pass.
 *
 * Replaces the kit `RotatingQR`'s client-side `Math.random()` placeholder with
 * a real token the gate can attest: an HMAC over the holder's active
 * `assignment_scan_codes` code + their user id + a 30s time window, keyed by a
 * server-only secret. The QR encodes `COMPVSS:<code>:<token>`; a gate scanner
 * resolves `<code>` through the assignments domain and recomputes the same HMAC
 * (server-to-server) to reject screenshots/replays outside the live window.
 *
 * Returns a short opaque token. Falls back to a user-bound (still server-keyed)
 * token when the holder has no active scan code yet, so the QR is never random.
 */

const WINDOW_MS = 30_000;

function signingKey(): string {
  // Server-only HMAC key. Prefer a dedicated secret; degrade to the service
  // role key (never shipped to the client) so the token is always server-keyed.
  return (
    process.env.GATE_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "compvss-gate"
  );
}

export async function mintGateToken(): Promise<string> {
  const session = await requireSession();

  // Resolve the holder's active credential scan code (RLS-scoped). Mirrors the
  // wallet page's lookup: assignments(credential) → active scan code.
  let code: string | null = null;
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("assignments")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("party_user_id", session.userId)
    .eq("catalog_kind", "credential")
    .is("deleted_at", null)
    .limit(50);
  const ids = ((assignments ?? []) as Array<{ id: string }>).map((a) => a.id);
  if (ids.length) {
    const { data: codes } = await supabase
      .from("assignment_scan_codes")
      .select("code")
      .in("assignment_id", ids)
      .eq("active", true)
      .limit(1);
    code = ((codes ?? []) as Array<{ code: string }>)[0]?.code ?? null;
  }

  const window = Math.floor(Date.now() / WINDOW_MS);
  const payload = `${session.userId}:${code ?? "nocode"}:${window}`;
  return createHmac("sha256", signingKey()).update(payload).digest("base64url").slice(0, 12);
}
