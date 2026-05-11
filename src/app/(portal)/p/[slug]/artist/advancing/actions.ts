"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";

const TALENT = ["technical_rider", "hospitality_rider", "input_list", "stage_plot", "crew_list", "guest_list"] as const;
const PRODUCTION = [
  "equipment_pull_list",
  "power_plan",
  "rigging_plan",
  "site_plan",
  "build_schedule",
  "vendor_package",
  "safety_compliance",
  "comms_plan",
  "signage_grid",
] as const;
const ALL = [...TALENT, ...PRODUCTION, "custom"] as const;

const Schema = z.object({
  slug: z.string().min(1),
  type: z.enum(ALL),
  title: z.string().min(1).max(200),
  notes: z.string().max(4000).optional(),
  deadline: z.string().optional(),
});

export type SubmitState = { error?: string; ok?: true } | null;

export async function submitDeliverableAction(_: SubmitState, fd: FormData): Promise<SubmitState> {
  const session = await requireSession();
  const parsed = Schema.safeParse({
    slug: fd.get("slug"),
    type: fd.get("type"),
    title: fd.get("title"),
    notes: fd.get("notes") ?? undefined,
    deadline: fd.get("deadline") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const project = await projectIdFromSlug(parsed.data.slug);
  if (!project) return { error: "Project not found" };

  let filePath: string | undefined;
  const file = fd.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 25 * 1024 * 1024) return { error: "File exceeds 25MB" };
    // Closed allowlist of MIME types we accept on the advancing bucket.
    // Without this, talent could upload `.html` / `.svg` (active content)
    // or `.exe` and have it served back via signed URLs, creating an
    // XSS / drive-by-download surface against producers who click the
    // download link in the console.
    const ALLOWED_MIME = new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/zip",
      "text/plain",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/msword",
      "application/vnd.ms-excel",
    ]);
    const mime = (file.type || "").toLowerCase();
    if (mime && !ALLOWED_MIME.has(mime)) {
      return { error: `Unsupported file type: ${mime}` };
    }
    const supabase = await createClient();
    const ext =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") ?? "bin";
    // Org-folder layout: `{orgId}/{projectId}/{userId}/...`. The leading
    // org_id segment is enforced by storage policy
    // `storage_org_scoped_upload` (migration
    // 20260509100009_storage_org_folder_enforcement.sql) — uploads to a
    // path whose first folder isn't a member-org of auth.uid() are denied.
    const path = `${project.org_id}/${project.id}/${session.userId}/${Date.now()}-${parsed.data.type}.${ext}`;
    const { error } = await supabase.storage.from("advancing").upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) return { error: `Upload failed: ${error.message}` };
    filePath = path;
  }

  const supabase = await createClient();
  const deadline = parsed.data.deadline ? new Date(parsed.data.deadline).toISOString() : null;
  const { error } = await supabase.from("deliverables").insert({
    org_id: project.org_id,
    project_id: project.id,
    type: parsed.data.type,
    title: parsed.data.title,
    status: "submitted",
    data: { notes: parsed.data.notes ?? null },
    file_path: filePath ?? null,
    submitted_by: session.userId,
    submitted_at: new Date().toISOString(),
    deadline,
  });
  if (error) return { error: error.message };

  revalidatePath(`/p/${parsed.data.slug}/artist/advancing`);
  revalidatePath(`/p/${parsed.data.slug}/production/vendor-submissions`);
  return { ok: true };
}

type DeliverableStatus = "draft" | "submitted" | "in_review" | "approved" | "rejected" | "revision_requested";

// Deliverable FSM: draft → submitted → in_review → approved | rejected.
// revision_requested loops back to submitted. Approved + rejected are
// terminal. The conditional update below prevents a stale review
// dashboard from re-firing the deliverable.approved notification on a
// double click.
const DELIVERABLE_TRANSITIONS: Record<DeliverableStatus, readonly DeliverableStatus[]> = {
  draft: ["submitted"],
  submitted: ["in_review", "approved", "rejected", "revision_requested"],
  in_review: ["approved", "rejected", "revision_requested"],
  revision_requested: ["submitted", "draft"],
  approved: [],
  rejected: [],
};

export async function setDeliverableStatusAction(deliverableId: string, status: DeliverableStatus) {
  const session = await requireSession();
  const supabase = await createClient();

  // Capture org/project + current status before write so we can validate
  // the transition AND scope the conditional update. Pin org_id on
  // top of RLS so a foreign-org deliverable id 404s instead of leaking
  // its existence through a "not found" vs "permission denied" timing
  // difference.
  const { data: before } = await supabase
    .from("deliverables")
    .select("org_id, project_id, title, type, submitted_by, status")
    .eq("id", deliverableId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!before) return { error: "Deliverable not found" };
  const current = before.status as DeliverableStatus;
  const allowed = DELIVERABLE_TRANSITIONS[current] ?? [];
  if (!allowed.includes(status)) {
    return { error: `Cannot move ${current} → ${status}. Allowed: ${allowed.join(", ") || "(terminal)"}` };
  }

  const patch: {
    status: DeliverableStatus;
    reviewed_by?: string;
    reviewed_at?: string;
    submitted_by?: string;
    submitted_at?: string;
  } = { status };
  if (["approved", "rejected", "revision_requested", "in_review"].includes(status)) {
    patch.reviewed_by = session.userId;
    patch.reviewed_at = new Date().toISOString();
  }
  if (status === "submitted") {
    patch.submitted_by = session.userId;
  }
  const { data: updated, error } = await supabase
    .from("deliverables")
    .update(patch)
    .eq("id", deliverableId)
    .eq("org_id", session.orgId)
    .eq("status", current)
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Deliverable status changed concurrently — refresh and retry" };
  }
  if (status === "submitted" || status === "approved") {
    const { notify } = await import("@/lib/notify");
    await notify({
      orgId: before.org_id,
      userId: before.submitted_by ?? session.userId,
      eventType: status === "submitted" ? "deliverable.submitted" : "deliverable.approved",
      title:
        status === "submitted" ? `Deliverable submitted: ${before.title}` : `Deliverable approved: ${before.title}`,
      body: `Type: ${before.type}`,
      href: `/console/projects/${before.project_id}/advancing`,
      data: { deliverableId, projectId: before.project_id, type: before.type },
    });
  }
  return { ok: true as const };
}
