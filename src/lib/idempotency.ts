import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * IK-011 · Stripe-style idempotency for mutating endpoints.
 *
 * Wrap a route handler with `withIdempotency(handler)`. When the client
 * sends an `Idempotency-Key: <256-char-max>` header:
 *  1. Hash the method+path+body.
 *  2. Look up the key in `idempotency_keys`.
 *  3. If found and request matches: replay the cached response.
 *  4. If found and request differs: return 409 conflict (Stripe behavior).
 *  5. If not found: run the handler, persist the response, return it.
 *
 * TTL: 24h (matching Stripe). Cleanup via pg_cron or a simple
 * `delete where expires_at < now()` we run from the purge worker.
 */

const HEADER = "idempotency-key";
const MAX_KEY_LEN = 256;

type Handler = (req: NextRequest) => Promise<Response>;

export function withIdempotency(handler: Handler): Handler {
  return async (req: NextRequest) => {
    const method = req.method.toUpperCase();
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      return handler(req);
    }

    const key = req.headers.get(HEADER);
    // Header is optional. Stripe enforces it per-endpoint; we advertise it and
    // only dedupe when clients opt in. Future: make it required per-route.
    if (!key) return handler(req);
    if (key.length > MAX_KEY_LEN) {
      return apiError("bad_request", `Idempotency-Key must be ≤${MAX_KEY_LEN} chars`);
    }

    // Clone request to read body without consuming the stream the handler needs.
    const reqForHash = req.clone();
    const bodyText = await reqForHash.text();
    const requestHash = hash(`${method}|${req.nextUrl.pathname}|${bodyText}`);

    const supabase = await createClient();
    // Resolve the caller's user_id BEFORE the lookup. Idempotency keys
    // must be scoped per-user — without this, two users picking the
    // same `Idempotency-Key: foo` value would collide and the second
    // caller would replay the first caller's response (which can carry
    // sensitive data). For anonymous callers we fall back to the
    // raw key (no isolation possible without a session) — anon mutating
    // endpoints are intentionally rare in the surface area.
    const { data: authUser } = await supabase.auth.getUser();
    const callerUserId = authUser.user?.id ?? null;

    // idempotency_keys isn't in generated database.types yet (added by
    // a later migration; gen:types pending). Route through the
    // codebase's typed-loose helper LooseSupabase, then narrow the
    // row shape at the consume site.
    const loose = supabase as unknown as LooseSupabase;
    let lookupQ = loose.from("idempotency_keys").select("*").eq("key", key);
    if (callerUserId) lookupQ = lookupQ.eq("user_id", callerUserId);
    else lookupQ = lookupQ.is("user_id", null);
    const lookup = (await lookupQ.maybeSingle()) as {
      data: {
        key: string;
        method: string;
        path: string;
        request_hash: string;
        status_code: number;
        response: unknown;
        expires_at: string;
      } | null;
      error: { message: string } | null;
    };
    const row = lookup.data;

    if (row && new Date(row.expires_at) > new Date()) {
      if (row.request_hash !== requestHash || row.method !== method || row.path !== req.nextUrl.pathname) {
        return apiError("conflict", "Idempotency-Key reused with a different request body or path");
      }
      // Replay — short-circuit.
      return NextResponse.json(row.response as Record<string, unknown>, {
        status: row.status_code,
        headers: { "idempotency-replay": "true" },
      });
    }

    // Run the handler. We must pass a fresh Request with the original body.
    const freshReq = new NextRequest(req.url, {
      method: req.method,
      headers: req.headers,
      body: bodyText || undefined,
    });

    const resp = await handler(freshReq);
    // Persist only 2xx responses. Errors should be retriable.
    if (resp.status >= 200 && resp.status < 300) {
      try {
        const respClone = resp.clone();
        const body = (await respClone.json()) as unknown;
        // user_id resolved upstream so the insert matches the lookup
        // scope — same row gets replayed on retry.
        await loose.from("idempotency_keys").insert({
          key,
          user_id: callerUserId,
          org_id: null,
          method,
          path: req.nextUrl.pathname,
          request_hash: requestHash,
          status_code: resp.status,
          response: body as Record<string, unknown>,
        });
      } catch {
        // Persist is best-effort. A failure here shouldn't fail the user.
      }
    }
    return resp;
  };
}

function hash(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}
