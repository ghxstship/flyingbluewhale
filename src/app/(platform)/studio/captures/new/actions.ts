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
  source: z.enum([
    "openspace",
    "dronedeploy",
    "structionsite",
    "matterport",
    "huddle_cam",
    "manual_360",
    "drone_photo",
    "satellite",
  ]),
  capture_date: z.string().optional(),
  panorama_count: z.string().optional(),
  external_url: z.string().max(500).optional(),
  external_id: z.string().max(200).optional(),
  notes: z.string().max(4000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function registerCapture(_: State, fd: FormData): Promise<State> {
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

  const panos = parsed.data.panorama_count ? Number(parsed.data.panorama_count) : null;

  const { data: row, error } = await supabase
    .from("reality_captures")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id,
      source: parsed.data.source,
      name: parsed.data.name,
      capture_date: parsed.data.capture_date || null,
      panorama_count: panos,
      external_url: parsed.data.external_url || null,
      external_id: parsed.data.external_id || null,
      capture_state: parsed.data.external_url ? "ready" : "pending_upload",
      notes: parsed.data.notes || null,
      uploaded_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/studio/captures");
  redirect(`/studio/captures/${(row as { id: string }).id}`);
}
