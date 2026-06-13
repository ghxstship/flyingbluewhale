import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * Signed-upload issuer for branding logos. Mirrors the incident-photo
 * pattern: the client POSTs a scope + filename, receives a path + signed
 * upload URL to PUT the binary to, then references the returned public URL.
 *
 * The `branding` bucket is public-read (logos must render for anon proposal
 * viewers), so we also return the public URL the caller stores in the
 * branding jsonb (`logoUrl`). Path: `{orgId}/{scope}/{uuid}-{filename}`.
 */
const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"] as const;
const ALLOWED_EXT = /\.(jpe?g|png|webp|svg|gif)$/i;

const Schema = z.object({
  // Which brand surface this logo is for — keeps paths tidy + auditable.
  scope: z.enum(["org", "client", "project", "proposal"]),
  filename: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[\w.-]+$/, "filename: alphanumerics, dot, dash, underscore only")
    .refine((s) => !s.includes(".."), { message: "filename: parent-dir tokens forbidden" })
    .refine((s) => ALLOWED_EXT.test(s), { message: "filename must be an image (jpg/png/webp/svg/gif)" }),
  contentType: z.enum(ALLOWED_IMAGE_MIME).optional(),
});

export async function POST(req: NextRequest) {
  const rl = await ratelimit({ key: keyFromRequest(req, "branding:upload"), ...RATE_BUDGETS.write });
  if (!rl.ok) return apiError("rate_limited", "Too many upload requests");

  const input = await parseJson(req, Schema);
  if (input instanceof NextResponse) return input;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");

    const supabase = await createClient();
    const path = `${session.orgId}/${input.scope}/${crypto.randomUUID()}-${input.filename}`;
    const { data, error } = await supabase.storage.from("branding").createSignedUploadUrl(path);
    if (error) return apiError("internal", error.message);

    const { data: pub } = supabase.storage.from("branding").getPublicUrl(path);

    return apiOk({
      path,
      uploadUrl: data.signedUrl,
      token: data.token,
      publicUrl: pub.publicUrl,
      contentType: input.contentType ?? "application/octet-stream",
    });
  });
}
