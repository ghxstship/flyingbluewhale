"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { filesFrom, uploadFieldPhotos } from "@/lib/mobile/photo-upload";
import { nextOrgCode } from "@/lib/codes";
import { log } from "@/lib/log";

export type State = { error?: string; fieldErrors?: Record<string, string> } | null;

/**
 * Same bucket the daily-log field photos live in: `procore-parity` is the
 * field-condition-photo bucket, it is caller-client writable under the org
 * prefix via `storage_org_scoped_upload`, and the studio daily-log page (and
 * the /m/snags list) already sign it for display. The `receipts` service-side
 * path exists ONLY because that bucket is service-only; a snag photo is site
 * evidence, exactly like a daily-log photo, so it takes the RLS-gated path
 * and the field form never touches the service key.
 */
const SNAG_PHOTO_BUCKET = "procore-parity";

const Input = z.object({
  projectId: z.string().uuid("Pick a project."),
  area: z.string().trim().min(1, "Say where it is.").max(200),
  title: z.string().trim().min(1, "Say what's wrong.").max(200),
  details: z.string().trim().max(4000).optional(),
  // Mirrors the console form's priority vocabulary (punch_items_priority_check).
  severity: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

/**
 * Raise a snag from the field, photo first.
 *
 * G10 in the parity audit: `/studio/punch` (the construction punch list) had
 * no field intake, so the person standing in front of the defect could not
 * file it. This writes the SAME store the console reads — `punch_items`,
 * whose INSERT policy is already `is_org_member` (baseline), so the member
 * band files without any RLS widening.
 *
 * The photo is REQUIRED, and unlike an expense the submit fails if the upload
 * fails: the photo IS the snag report's evidence, the person is standing in
 * front of the defect, and a retry is cheap. Degrading to a photo-less row
 * here would quietly recreate the record-without-evidence shape the
 * capture-honesty guard exists to prevent.
 *
 * `punch_items` has no location column; "where it is" is preserved as the
 * first line of the description so the console reads it with zero schema
 * change.
 */
export async function raiseSnag(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();

  // Files first — Object.fromEntries would stringify them.
  const photos = filesFrom(fd, "photo");
  const scalars = Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string"));
  const parsed = Input.safeParse(scalars);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;

  if (photos.length === 0) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: { photo: "A photo of the snag is required. Point the camera at it." },
    };
  }

  const supabase = await createClient();

  // Cross-tenant guard: the project must be this org's, and live.
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", v.projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: "Project not found in your workspace" };

  // Upload BEFORE the row. The photo is mandatory evidence, so a failed
  // upload fails the submit — see the docblock.
  const upload = await uploadFieldPhotos(supabase, SNAG_PHOTO_BUCKET, session.orgId, session.userId, [photos[0]!]);
  const photoPath = upload.paths[0];
  if (!photoPath) {
    log.error("m.snags.photo_upload_failed", { err: upload.error ?? "no path returned" });
    return {
      error: "Please fix the errors below.",
      fieldErrors: { photo: "The photo could not be uploaded. Check your signal and try again." },
    };
  }

  const description = [`Where: ${v.area}`, v.details || null].filter(Boolean).join("\n\n");

  // Per-org sequential code, same generator the console form uses. The
  // SELECT-then-format pattern can race, so retry once on the unique
  // (org_id, code) collision as codes.ts instructs.
  for (let attempt = 0; attempt < 2; attempt++) {
    const code = await nextOrgCode("punch_items", session.orgId, "PUNCH");
    const { error } = await supabase.from("punch_items").insert({
      org_id: session.orgId,
      project_id: v.projectId,
      code,
      title: v.title,
      description,
      priority: v.severity,
      photo_path: photoPath,
      created_by: session.userId,
    } as never);
    if (!error) {
      revalidatePath("/m/snags");
      revalidatePath("/studio/punch");
      return null;
    }
    if (error.code === "23505" && attempt === 0) continue; // code race — regenerate and retry
    log.error("m.snags.insert_failed", { err: error.message });
    return { error: error.message };
  }
  return { error: "Could not save the snag. Try again." };
}
