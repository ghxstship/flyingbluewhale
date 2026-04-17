"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";

const TALENT = ["technical_rider","hospitality_rider","input_list","stage_plot","crew_list","guest_list"] as const;
const PRODUCTION = ["equipment_pull_list","power_plan","rigging_plan","site_plan","build_schedule","vendor_package","safety_compliance","comms_plan","signage_grid"] as const;
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
    slug: fd.get("slug"), type: fd.get("type"),
    title: fd.get("title"), notes: fd.get("notes") ?? undefined,
    deadline: fd.get("deadline") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const project = await projectIdFromSlug(parsed.data.slug);
  if (!project) return { error: "Project not found" };

  let filePath: string | undefined;
  const file = fd.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 25 * 1024 * 1024) return { error: "File exceeds 25MB" };
    const supabase = await createClient();
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "bin";
    const path = `advancing/${project.id}/${session.userId}/${Date.now()}-${parsed.data.type}.${ext}`;
    const { error } = await supabase.storage.from("advancing").upload(path, file, {
      contentType: file.type || "application/octet-stream", upsert: false,
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

export async function setDeliverableStatusAction(
  deliverableId: string,
  status: "draft" | "submitted" | "in_review" | "approved" | "rejected" | "revision_requested",
) {
  const session = await requireSession();
  const supabase = await createClient();
  const patch: { status: typeof status; reviewed_by?: string; reviewed_at?: string; submitted_by?: string; submitted_at?: string } = { status };
  if (["approved", "rejected", "revision_requested", "in_review"].includes(status)) {
    patch.reviewed_by = session.userId;
    patch.reviewed_at = new Date().toISOString();
  }
  if (status === "submitted") {
    patch.submitted_by = session.userId;
  }
  const { error } = await supabase.from("deliverables").update(patch).eq("id", deliverableId);
  if (error) return { error: error.message };
  return { ok: true as const };
}
