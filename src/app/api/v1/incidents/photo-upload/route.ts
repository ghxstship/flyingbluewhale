import { type NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Signed upload URL issuer for incident photos. Mirrors the pattern used
 * by receipts + advancing — the client POSTs a filename, receives a path
 * + signed upload URL it can PUT the binary to, then references the path
 * on the incident record.
 *
 * Path layout: `{orgId}/{incidentDraftId}/{filename}`. The caller mints
 * `incidentDraftId` client-side (a uuid) so the same draft can group
 * multiple photos before the incident row exists.
 */
export async function POST(req: NextRequest) {
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return apiError("bad_request", "Invalid payload");
    const { draftId, filename, contentType } = body as {
      draftId?: string;
      filename?: string;
      contentType?: string;
    };
    if (!draftId || !filename) return apiError("bad_request", "draftId + filename required");
    if (!/^[\w./-]+$/.test(filename)) return apiError("bad_request", "Invalid filename");
    if (!/^[0-9a-f-]{36}$/.test(draftId)) return apiError("bad_request", "Invalid draftId");

    const supabase = await createClient();
    const path = `${session.orgId}/${draftId}/${filename}`;
    const { data, error } = await supabase.storage
      .from("incident-photos")
      .createSignedUploadUrl(path);
    if (error) return apiError("internal", error.message);

    return apiOk({
      path,
      uploadUrl: data.signedUrl,
      token: data.token,
      contentType: contentType ?? "application/octet-stream",
    });
  });
}
