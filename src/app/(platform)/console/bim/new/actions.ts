"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
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

export async function registerBimModel(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", parsed.data.project_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: "Project not found in your organization" };

  const { data: row, error } = await supabase
    .from("bim_models")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id,
      name: parsed.data.name,
      discipline: parsed.data.discipline || null,
      source_type: parsed.data.source_type,
      storage_path: parsed.data.storage_path,
      version_label: parsed.data.version_label || null,
      model_state: "uploaded",
      uploaded_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/console/bim");
  redirect(`/console/bim/${(row as { id: string }).id}`);
}
