import { type NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { revokeShareLink } from "@/lib/share/links";
import { emitAudit, type AuditAction } from "@/lib/audit";

/**
 * DELETE /api/v1/share-links/[id] — revoke a share link.
 *
 * Revoking sets `revoked_at` and stamps `revoked_by`. The row is preserved
 * for audit + so post-revocation token attempts can be told "revoked" rather
 * than "invalid". RLS scopes the update to the creator or org owners/admins;
 * `assertCapability("projects:write")` matches the create-side gate.
 */

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;

    const result = await revokeShareLink({ session, id });
    if (!result.ok) return apiError("internal", result.error);

    await emitAudit({
      actorId: session.userId,
      orgId: session.orgId,
      actorEmail: session.email,
      action: "share_link.revoke",
      targetTable: "share_links",
      targetId: id,
      metadata: {},
      requestId: req.headers.get("x-request-id"),
    });

    return apiOk({ id, revoked: true });
  });
}
