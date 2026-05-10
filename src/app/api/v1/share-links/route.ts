import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createShareLink, listShareLinksForResource } from "@/lib/share/links";
import { emitAudit, type AuditAction } from "@/lib/audit";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * POST /api/v1/share-links — mint a new HMAC-signed public link.
 * GET  /api/v1/share-links?resourceTable=&resourceId= — list active links.
 *
 * Both endpoints require an authenticated session with `projects:write`
 * (manager+). Public consumption of the resulting URL happens at /share/[token]
 * and is intentionally unauthenticated — see src/app/share/[token]/page.tsx.
 */

// Closed enum — only resource types whose public renderer (or
// inline-placeholder) is wired in src/app/share/[token]/resolve.ts.
// Free-form strings would create undeliverable share links and make
// it easier for a misconfigured renderer downstream to dispatch on
// an unexpected table name.
const SHARE_RESOURCE_TABLES = ["proposals", "view_configs", "guides", "event_guides", "dashboards"] as const;

const CreateBody = z.object({
  resourceTable: z.enum(SHARE_RESOURCE_TABLES),
  resourceId: z.string().uuid(),
  expiresInDays: z.number().int().positive().max(365).optional(),
  passcode: z.string().min(4).max(128).optional(),
  maxUses: z.number().int().positive().max(10_000).optional(),
  label: z.string().max(120).optional(),
  role: z.enum(["viewer", "commenter"]).optional(),
});

export async function POST(req: NextRequest) {
  // Mints public access tokens; gate on the write bucket (60/min).
  // Without it a compromised admin token could spew thousands of
  // public links in seconds, blowing through dedup + audit budgets.
  const rl = await ratelimit({
    key: keyFromRequest(req, "share-links:mint"),
    ...RATE_BUDGETS.write,
  });
  if (!rl.ok) return apiError("rate_limited", "Too many share-link requests");

  const input = await parseJson(req, CreateBody);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;

    const created = await createShareLink({ session, input });
    if (!created.ok) return apiError("internal", created.error);

    await emitAudit({
      actorId: session.userId,
      orgId: session.orgId,
      actorEmail: session.email,
      // Cast: the AuditAction union doesn't yet include share_link.* — the
      // audit_log column is plain text, so the row writes correctly. The
      // union is intentionally narrow; broadening it lives with the audit lib.
      action: "share_link.create" as AuditAction,
      targetTable: "share_links",
      targetId: created.result.id,
      metadata: {
        resource_table: input.resourceTable,
        resource_id: input.resourceId,
        role: input.role ?? "viewer",
        has_passcode: !!input.passcode,
        expires_in_days: input.expiresInDays ?? null,
        max_uses: input.maxUses ?? null,
      },
      requestId: req.headers.get("x-request-id"),
    });

    return apiCreated(created.result);
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const resourceTable = url.searchParams.get("resourceTable");
  const resourceId = url.searchParams.get("resourceId");
  if (!resourceTable || !resourceId) {
    return apiError("bad_request", "Both resourceTable and resourceId query params are required");
  }
  return withAuth(async (session) => {
    const links = await listShareLinksForResource({
      session,
      resourceTable,
      resourceId,
    });
    return apiOk({ links });
  });
}
