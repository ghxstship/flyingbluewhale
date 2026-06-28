import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { startImpersonation, stopImpersonation } from "@/lib/auth/impersonation";

export const dynamic = "force-dynamic";

const StartBody = z.object({
  userId: z.string().uuid(),
});

/**
 * POST /api/v1/admin/impersonate — START acting as another user.
 *
 * Hard-gates on the DB-backed developer flag. `isDeveloper` is read ONLY from
 * the server-side `getSession()` (the caller's real session) — never from the
 * request body or a header. Both this boundary check and the one inside
 * `startImpersonation` must pass (defence in depth).
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError("unauthorized", "Authentication required");
  if (session.isDeveloper !== true) {
    return apiError("forbidden", "Developer access required");
  }
  // Refuse to start a second hop while already impersonating — the operator
  // must exit first, so the restore cookie always points at a real developer.
  if (session.impersonatedBy) {
    return apiError("forbidden", "Already impersonating; exit first.");
  }

  const parsed = await parseJson(req, StartBody);
  if (parsed instanceof Response) return parsed;

  const result = await startImpersonation(parsed.userId);
  if (!result.ok) return apiError(result.code, result.message);
  return apiOk({ ok: true, actingAs: result.actingAs });
}

/**
 * DELETE /api/v1/admin/impersonate — STOP impersonation, restore the admin.
 *
 * Intentionally NOT gated on `isDeveloper`: during impersonation the live
 * session is the *target's* (who may not be a developer), so gating here
 * would trap the operator. The restore path instead trusts ONLY the
 * HMAC-signed httpOnly impersonator cookie to learn who to restore — a
 * missing/forged cookie yields a 400.
 */
export async function DELETE() {
  const result = await stopImpersonation();
  if (!result.ok) return apiError(result.code, result.message);
  return apiOk({ ok: true });
}
