import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * Signed upload URL issuer for incident photos and video evidence.
 * Mirrors the pattern used by receipts + advancing — the client POSTs a
 * filename + mediaKind, receives a path + signed upload URL it can PUT
 * the binary to, then references the path on the incident record.
 *
 * Path layout: `{orgId}/{incidentDraftId}/{filename}`. The caller mints
 * `incidentDraftId` client-side (a uuid) so the same draft can group
 * multiple attachments before the incident row exists.
 *
 * mediaKind="video" routes to the `incident-videos` bucket (separate
 * from photos so storage policies, retention rules, and CDN config can
 * differ). Max 120s clips; MIME allowlist is narrow to prevent executable
 * video containers (AVI, WMV, MKV) from landing in reviewer workflows.
 */
const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"] as const;
const ALLOWED_VIDEO_MIME = ["video/mp4", "video/quicktime", "video/webm"] as const;
type AllowedMime = (typeof ALLOWED_IMAGE_MIME)[number] | (typeof ALLOWED_VIDEO_MIME)[number];

const ALLOWED_EXT = /\.(jpe?g|png|webp|heic|heif|gif|mp4|mov|webm)$/i;

const Schema = z.object({
  draftId: z.string().regex(/^[0-9a-f-]{36}$/, "draftId must be a uuid"),
  filename: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[\w.-]+$/, "filename: alphanumerics, dot, dash, underscore only")
    .refine((s) => !s.includes(".."), { message: "filename: parent-dir tokens forbidden" })
    .refine((s) => ALLOWED_EXT.test(s), {
      message: "filename must be an image (jpg/png/webp/heic/heif/gif) or video (mp4/mov/webm)",
    }),
  contentType: z
    .enum([...ALLOWED_IMAGE_MIME, ...ALLOWED_VIDEO_MIME] as [AllowedMime, ...AllowedMime[]])
    .optional(),
  mediaKind: z.enum(["photo", "video"]).default("photo"),
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
    const bucket = input.mediaKind === "video" ? "incident-videos" : "incident-photos";
    const path = `${session.orgId}/${input.draftId}/${input.filename}`;
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
    if (error) return apiError("internal", error.message);

    return apiOk({
      path,
      bucket,
      uploadUrl: data.signedUrl,
      token: data.token,
      contentType: input.contentType ?? "application/octet-stream",
      mediaKind: input.mediaKind,
    });
  });
}
