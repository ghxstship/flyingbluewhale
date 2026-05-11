import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * Signed upload URL issuer for incident photos. Mirrors the pattern used
 * by receipts + advancing — the client POSTs a filename, receives a path
 * + signed upload URL it can PUT the binary to, then references the path
 * on the incident record.
 *
 * Path layout: `{orgId}/{incidentDraftId}/{filename}`. The caller mints
 * `incidentDraftId` client-side (a uuid) so the same draft can group
 * multiple photos before the incident row exists.
 *
 * Filename hardening — block path separators, parent-dir tokens, and
 * anything that isn't a simple `name.ext` string. Storage writes the
 * file under `{orgId}/{draftId}/{filename}` so traversal is strictly
 * forbidden.
 */
// Closed allowlist of image MIME types. Incident *photos* — anything
// non-image (HTML, SVG with active content, executables) would be a
// served-back drive-by surface for the operator who reviews the incident.
const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"] as const;

const ALLOWED_EXT = /\.(jpe?g|png|webp|heic|heif|gif)$/i;

const Schema = z.object({
  draftId: z.string().regex(/^[0-9a-f-]{36}$/, "draftId must be a uuid"),
  filename: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[\w.-]+$/, "filename: alphanumerics, dot, dash, underscore only")
    .refine((s) => !s.includes(".."), { message: "filename: parent-dir tokens forbidden" })
    .refine((s) => ALLOWED_EXT.test(s), { message: "filename must be an image (jpg/png/webp/heic/heif/gif)" }),
  contentType: z.enum(ALLOWED_IMAGE_MIME).optional(),
});

export async function POST(req: NextRequest) {
  // Signed-URL minting bucket — write (60/min). Each call generates
  // a token and uses storage-API quota; the gate prevents spam.
  const rl = await ratelimit({
    key: keyFromRequest(req, "incidents:photo-upload"),
    ...RATE_BUDGETS.write,
  });
  if (!rl.ok) return apiError("rate_limited", "Too many upload requests");

  const input = await parseJson(req, Schema);
  if (input instanceof NextResponse) return input;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");

    const supabase = await createClient();
    const path = `${session.orgId}/${input.draftId}/${input.filename}`;
    const { data, error } = await supabase.storage.from("incident-photos").createSignedUploadUrl(path);
    if (error) return apiError("internal", error.message);

    return apiOk({
      path,
      uploadUrl: data.signedUrl,
      token: data.token,
      contentType: input.contentType ?? "application/octet-stream",
    });
  });
}
