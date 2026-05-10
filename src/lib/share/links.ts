import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { signShareToken, verifyShareToken } from "./tokens";
import { urlFor } from "@/lib/urls";
import type {
  ConsumeShareLinkResult,
  CreateShareLinkInput,
  CreateShareLinkResult,
  ShareLink,
  ShareLinkRole,
} from "./types";

// ───────────────────────────────────────────────────────────────────────────
// Passcode hashing (scrypt)
// ───────────────────────────────────────────────────────────────────────────
//
// We use Node's built-in `scrypt` rather than bcryptjs because the latter is
// not in the dep graph and adding a new transitive runtime dep for one
// optional field is not worth it. Format: `scrypt$<saltB64>$<hashB64>` so the
// algo + salt travel with the hash. N=16384 / r=8 / p=1 follows the original
// scrypt paper baseline; Node's implementation enforces minimums internally.

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 32;
const SCRYPT_SALT_BYTES = 16;

function hashPasscode(passcode: string): string {
  const salt = randomBytes(SCRYPT_SALT_BYTES);
  const hash = scryptSync(passcode, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

function verifyPasscode(passcode: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "base64");
  const expected = Buffer.from(parts[2], "base64");
  const candidate = scryptSync(passcode, salt, expected.length, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

// ───────────────────────────────────────────────────────────────────────────
// DB row → public DTO
// ───────────────────────────────────────────────────────────────────────────

import type { Database } from "@/lib/supabase/database.types";

type DbShareLink = Database["public"]["Tables"]["share_links"]["Row"];

function rowToShareLink(row: DbShareLink): ShareLink {
  // meta is typed as Json (string | number | bool | null | object); narrow to
  // an object for the public DTO and fall back to {} for any non-object value.
  const meta =
    row.meta && typeof row.meta === "object" && !Array.isArray(row.meta) ? (row.meta as Record<string, unknown>) : {};
  return {
    id: row.id,
    org_id: row.org_id,
    resource_table: row.resource_table,
    resource_id: row.resource_id,
    role: row.role as ShareLinkRole,
    has_passcode: !!row.passcode_hash,
    expires_at: row.expires_at,
    max_uses: row.max_uses,
    uses: row.uses,
    label: row.label,
    meta,
    revoked_at: row.revoked_at,
    revoked_by: row.revoked_by,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_used_at: row.last_used_at,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Public helpers
// ───────────────────────────────────────────────────────────────────────────

export async function createShareLink(opts: {
  session: { userId: string; orgId: string };
  input: CreateShareLinkInput;
}): Promise<{ ok: true; result: CreateShareLinkResult } | { ok: false; error: string }> {
  const { session, input } = opts;
  const supabase = await createClient();

  const expiresAt =
    input.expiresInDays && input.expiresInDays > 0
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

  const passcodeHash = input.passcode ? hashPasscode(input.passcode) : null;

  const insertRow = {
    org_id: session.orgId,
    resource_table: input.resourceTable,
    resource_id: input.resourceId,
    role: (input.role ?? "viewer") as ShareLinkRole,
    passcode_hash: passcodeHash,
    expires_at: expiresAt?.toISOString() ?? null,
    max_uses: input.maxUses ?? null,
    label: input.label ?? null,
    created_by: session.userId,
  };

  // share_links is now in the regenerated database.types — use the typed
  // client directly. RLS gates the write per usual.
  const { data, error } = await supabase.from("share_links").insert(insertRow).select().single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create share link" };
  }

  const token = signShareToken({ id: data.id, expiresAt: expiresAt ?? undefined });
  const url = urlFor("marketing", `/share/${token}`);

  return {
    ok: true,
    result: {
      id: data.id,
      url,
      link: rowToShareLink(data),
    },
  };
}

export async function revokeShareLink(opts: {
  session: { userId: string; orgId: string };
  id: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("share_links")
    .update({ revoked_at: new Date().toISOString(), revoked_by: opts.session.userId })
    .eq("id", opts.id)
    .eq("org_id", opts.session.orgId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function listShareLinksForResource(opts: {
  session: { orgId: string };
  resourceTable: string;
  resourceId: string;
}): Promise<ShareLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("share_links")
    .select("*")
    .eq("org_id", opts.session.orgId)
    .eq("resource_table", opts.resourceTable)
    .eq("resource_id", opts.resourceId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(rowToShareLink);
}

/**
 * Resolve a share token to its underlying resource. Used by /share/[token].
 *
 * Steps:
 *   1. HMAC-verify the token (rejects forged or expired tokens).
 *   2. Fetch the row using the service-role client — the unauth public route
 *      has no Supabase session, so RLS would deny otherwise. The HMAC sig
 *      already proves authorization to read this specific row.
 *   3. Re-check revoked / expired / exhausted (defense in depth — the DB
 *      function does the same atomically).
 *   4. If the row carries a passcode_hash, require it; verify in constant
 *      time. Failed passcodes do NOT consume a use.
 *   5. Call `consume_share_link` RPC for an atomic increment-and-claim.
 */
export async function consumeShareLink(opts: { token: string; passcode?: string }): Promise<ConsumeShareLinkResult> {
  const verified = verifyShareToken(opts.token);
  if (!verified) return { ok: false, reason: "invalid" };

  if (!isServiceClientAvailable()) {
    // No service-role key configured — we can't read past RLS for an
    // unauthenticated visitor. Surface as invalid; ops should provision the
    // env var before exposing /share publicly.
    return { ok: false, reason: "invalid" };
  }
  const supabase = createServiceClient();

  // Step 2 — fetch the row (service-role bypasses RLS).
  const { data: row, error } = await supabase.from("share_links").select("*").eq("id", verified.id).maybeSingle();

  if (error || !row) return { ok: false, reason: "invalid" };

  // Step 3 — defense-in-depth checks before passcode prompt so we don't ask
  // a visitor for a passcode on a link that's already dead.
  if (row.revoked_at) return { ok: false, reason: "revoked" };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  if (row.max_uses !== null && row.uses >= row.max_uses) {
    return { ok: false, reason: "exhausted" };
  }

  // Step 4 — passcode gate. A failed passcode does NOT consume a use; we
  // only count successful resource access.
  if (row.passcode_hash) {
    if (!opts.passcode) return { ok: false, reason: "passcode_required" };
    if (!verifyPasscode(opts.passcode, row.passcode_hash)) {
      return { ok: false, reason: "passcode_wrong" };
    }
  }

  // Step 5 — atomic consume. If two requests race, exactly one wins; the
  // loser sees `share_link_invalid` and we report it as exhausted.
  const { data: claimed, error: rpcErr } = await supabase.rpc("consume_share_link", { p_id: row.id });

  if (rpcErr || !claimed) {
    // The atomic claim lost the race or hit a constraint — treat as exhausted
    // so the user sees a clear "link is no longer available" UX rather than
    // a generic 500.
    return { ok: false, reason: "exhausted" };
  }

  return {
    ok: true,
    link: rowToShareLink(claimed),
    resource: { table: claimed.resource_table, id: claimed.resource_id },
  };
}
