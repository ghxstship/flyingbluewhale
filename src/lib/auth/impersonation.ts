import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { emitAudit } from "@/lib/audit";
import { env } from "@/lib/env";
import { log } from "@/lib/log";

/**
 * Developer "Act As" user-impersonation.
 *
 * Security model (see the route handlers for the request-level gate):
 *
 *  - START is gated on `session.isDeveloper === true`, read ONLY from the
 *    DB-backed `resolveSession()` (the `is_developer` column on the caller's
 *    own membership). It is never read from a header, body, or any client
 *    value. A non-developer can never start impersonation.
 *  - Impersonation establishes a *real* target Supabase session (via a
 *    service-role-minted magiclink → verifyOtp), so RLS evaluates exactly
 *    as it would for the target. There is no "god mode" — the impersonator
 *    inherits precisely the target's data access.
 *  - The `atlvs_impersonator` cookie records WHO is impersonating. It is
 *    httpOnly + signed with an HMAC-SHA256 over a server secret, so a
 *    non-developer cannot forge it, and JS on the page cannot read it. The
 *    STOP (restore-admin) path trusts ONLY this signed cookie — never a
 *    client value — and verifies the signature with a constant-time compare.
 *  - Every start / stop is written to `audit_log`.
 */

export const IMPERSONATOR_COOKIE = "atlvs_impersonator";

/** Two-hour ceiling — a stale impersonation cookie self-expires. */
const IMPERSONATOR_TTL_SECONDS = 2 * 60 * 60;

export type ImpersonatorPayload = {
  /** The real developer's auth.users id. */
  impersonatorId: string;
  /** The real developer's email — denormalized for the banner + audit. */
  impersonatorEmail: string;
  /** The real developer's org id — audit rows are org-scoped. */
  orgId: string;
  /** Epoch millis the session started. */
  startedAt: number;
};

/**
 * Server secret for signing the impersonator cookie. Prefer a dedicated
 * IMPERSONATION_SECRET; fall back to the service-role key (already a
 * server-only secret of equal sensitivity). Throws if neither is set so we
 * never sign with an empty key (which would make forgery trivial).
 */
function signingSecret(): string {
  const secret = process.env.IMPERSONATION_SECRET || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("Impersonation requires IMPERSONATION_SECRET or SUPABASE_SERVICE_ROLE_KEY.");
  }
  return secret;
}

function hmac(data: string): string {
  return createHmac("sha256", signingSecret()).update(data).digest("base64url");
}

/**
 * Serialize + sign an impersonator payload into the cookie value:
 * `<base64url(json)>.<base64url(hmac)>`.
 */
export function signImpersonator(payload: ImpersonatorPayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${hmac(body)}`;
}

/**
 * Verify + parse a signed impersonator cookie value. Returns null on any
 * tampering, malformed input, missing signature, or expiry. Uses a
 * constant-time signature compare so an attacker can't byte-probe the MAC.
 */
export function verifyImpersonator(cookieValue: string | null | undefined): ImpersonatorPayload | null {
  if (!cookieValue) return null;
  const dot = cookieValue.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);

  let expected: string;
  try {
    expected = hmac(body);
  } catch {
    // No signing secret available — treat as unverifiable (fail closed).
    return null;
  }

  // Constant-time compare. Length-mismatched buffers short-circuit timingSafeEqual
  // (it throws), so guard length first to keep the compare constant-time.
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;

  let parsed: ImpersonatorPayload;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ImpersonatorPayload;
  } catch {
    return null;
  }
  if (
    !parsed ||
    typeof parsed.impersonatorId !== "string" ||
    typeof parsed.startedAt !== "number" ||
    typeof parsed.orgId !== "string"
  ) {
    return null;
  }
  // TTL enforcement — a cookie older than the ceiling is treated as absent.
  if (Date.now() - parsed.startedAt > IMPERSONATOR_TTL_SECONDS * 1000) return null;
  return parsed;
}

/**
 * Compute the cookie `domain` so the impersonator marker (and the target's
 * refreshed auth cookies) follow across atlvs/gvteway/compvss subdomains in
 * prod and `.lvh.me` in dev. Mirrors `cookieDomainForRequest` in
 * src/lib/supabase/server.ts + the guide-unlock route.
 */
async function cookieDomain(): Promise<string | undefined> {
  try {
    const h = await headers();
    const host = (h.get("host") ?? "").split(":")[0]!.toLowerCase();
    if (host.endsWith("atlvs.pro")) return ".atlvs.pro";
    if (host === "lvh.me" || host.endsWith(".lvh.me")) return ".lvh.me";
  } catch {
    // outside a request scope.
  }
  return undefined;
}

export type StartResult =
  | { ok: true; actingAs: { userId: string; email: string } }
  | { ok: false; code: "forbidden" | "service_unavailable" | "not_found" | "bad_request"; message: string };

/**
 * START impersonation. Hard-gates on the DB-backed developer flag, mints a
 * real target session, and drops the signed impersonator marker cookie.
 *
 * The `isDeveloper` gate here is authoritative and duplicated at the route
 * boundary (defence in depth) — this function is server-only and must never
 * be reachable by a non-developer.
 */
export async function startImpersonation(targetUserId: string): Promise<StartResult> {
  // (1) Authoritative gate — the caller's REAL, DB-backed session.
  const caller = await getSession();
  if (!caller || caller.isDeveloper !== true) {
    return { ok: false, code: "forbidden", message: "Developer access required." };
  }
  if (!isServiceClientAvailable()) {
    return { ok: false, code: "service_unavailable", message: "Service role not configured." };
  }
  if (targetUserId === caller.userId) {
    return { ok: false, code: "bad_request", message: "Cannot impersonate yourself." };
  }

  const service = createServiceClient();

  // (2) Resolve the target user's email by id (service-role admin API).
  const { data: targetUser, error: lookupErr } = await service.auth.admin.getUserById(targetUserId);
  const targetEmail = targetUser?.user?.email ?? null;
  if (lookupErr || !targetEmail) {
    return { ok: false, code: "not_found", message: "Target user not found." };
  }

  // (3) Mint a magiclink for the target and extract its hashed_token.
  const { data: link, error: linkErr } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: targetEmail,
  });
  const tokenHash = link?.properties?.hashed_token ?? null;
  if (linkErr || !tokenHash) {
    return { ok: false, code: "service_unavailable", message: "Could not establish target session." };
  }

  // (4) verifyOtp on a response-bound ssr client → writes the TARGET's auth
  // cookies, replacing the developer's own session with the target's.
  const supabase = await createClient();
  const { error: otpErr } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (otpErr) {
    return { ok: false, code: "service_unavailable", message: "Could not establish target session." };
  }

  // (5) Drop the signed, httpOnly impersonator marker cookie.
  const cookieStore = await cookies();
  const domain = await cookieDomain();
  const value = signImpersonator({
    impersonatorId: caller.userId,
    impersonatorEmail: caller.email,
    orgId: caller.orgId,
    startedAt: Date.now(),
  });
  cookieStore.set(IMPERSONATOR_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: IMPERSONATOR_TTL_SECONDS,
    ...(domain ? { domain } : {}),
  });

  // (6) Audit (actor = the developer, target = the impersonated user).
  await emitAudit({
    actorId: caller.userId,
    actorEmail: caller.email,
    orgId: caller.orgId,
    action: "impersonate.start",
    targetTable: "auth.users",
    targetId: targetUserId,
    metadata: { targetEmail },
  });

  log.info("impersonation.start", { actor: caller.userId, target: targetUserId });
  return { ok: true, actingAs: { userId: targetUserId, email: targetEmail } };
}

export type StopResult =
  | { ok: true }
  | { ok: false; code: "bad_request" | "service_unavailable"; message: string };

/**
 * STOP impersonation. Trusts ONLY the HMAC-signed httpOnly cookie to learn
 * who the real developer is, restores their session, clears the marker, and
 * audits. A missing or tampered cookie is a 400.
 */
export async function stopImpersonation(): Promise<StopResult> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATOR_COOKIE)?.value ?? null;
  const payload = verifyImpersonator(raw);
  if (!payload) {
    return { ok: false, code: "bad_request", message: "Not impersonating." };
  }
  if (!isServiceClientAvailable()) {
    return { ok: false, code: "service_unavailable", message: "Service role not configured." };
  }

  const service = createServiceClient();

  // Resolve the developer's own email by id (from the signed cookie), then
  // re-establish their real session via the same magiclink → verifyOtp dance.
  const { data: devUser } = await service.auth.admin.getUserById(payload.impersonatorId);
  const devEmail = devUser?.user?.email ?? payload.impersonatorEmail ?? null;
  if (!devEmail) {
    return { ok: false, code: "service_unavailable", message: "Could not restore developer session." };
  }

  const { data: link, error: linkErr } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: devEmail,
  });
  const tokenHash = link?.properties?.hashed_token ?? null;
  if (linkErr || !tokenHash) {
    return { ok: false, code: "service_unavailable", message: "Could not restore developer session." };
  }

  const supabase = await createClient();
  const { error: otpErr } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (otpErr) {
    return { ok: false, code: "service_unavailable", message: "Could not restore developer session." };
  }

  // Clear the marker cookie.
  const domain = await cookieDomain();
  cookieStore.set(IMPERSONATOR_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    ...(domain ? { domain } : {}),
  });

  await emitAudit({
    actorId: payload.impersonatorId,
    actorEmail: devEmail,
    orgId: payload.orgId,
    action: "impersonate.stop",
    targetTable: "auth.users",
    targetId: payload.impersonatorId,
  });

  log.info("impersonation.stop", { actor: payload.impersonatorId });
  return { ok: true };
}

/**
 * Read-only helper for surfaces (e.g. the banner, resolveSession) that need
 * to know whether the current request is impersonating, and by whom. Returns
 * the verified impersonator payload or null. Never throws.
 */
export async function currentImpersonator(): Promise<ImpersonatorPayload | null> {
  try {
    const cookieStore = await cookies();
    return verifyImpersonator(cookieStore.get(IMPERSONATOR_COOKIE)?.value ?? null);
  } catch {
    return null;
  }
}
