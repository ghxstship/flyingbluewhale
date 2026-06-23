"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  project_id: z.string().uuid(),
  discipline: z.string().max(16).optional(),
  source_type: z.enum(["ifc", "ifc_zip", "rvt", "nwd", "nwc", "glb", "gltf", "fbx", "dwg"]),
  version_label: z.string().max(64).optional(),
  storage_path: z.string().min(1).max(400),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateBimModel(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const { id, ...patch } = parsed.data;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", patch.project_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: "Project not found in your organization" };

  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  if (!expectedUpdatedAt) return { error: "Missing concurrency token. Reload the page and try again." };

  // Manual optimistic-concurrency update — gates on `updated_at == expected`.
  const { data: updated, error } = await supabase
    .from("bim_models")
    .update({
      name: patch.name,
      project_id: patch.project_id,
      discipline: patch.discipline || null,
      source_type: patch.source_type,
      version_label: patch.version_label || null,
      storage_path: patch.storage_path,
    })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("updated_at", expectedUpdatedAt)
    .select("id")
    .maybeSingle();

  if (error) return actionFail(error.message, fd);
  if (!updated) {
    const { data: stillThere } = await supabase
      .from("bim_models")
      .select("id")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    return { error: stillThere ? STALE_ROW_MESSAGE : "Model not found." };
  }

  revalidatePath(`/studio/bim/${id}`);
  revalidatePath("/studio/bim");
  redirect(`/studio/bim/${id}`);
}
