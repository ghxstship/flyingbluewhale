"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const AddLinkSchema = z.object({
  model_id: z.string().uuid(),
  element_global_id: z.string().min(1).max(80),
  link_type: z.enum(["rfi", "submittal", "issue", "punch_item", "inspection", "transmittal_item"]),
  target_id: z.string().uuid(),
  note: z.string().max(400).optional(),
});

export async function addBimModelLink(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = AddLinkSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  // Cross-tenant guard on the parent model.
  const { data: model } = await supabase
    .from("bim_models")
    .select("id")
    .eq("id", parsed.data.model_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!model) return;

  const { error } = await supabase.from("bim_model_links").insert({
    org_id: session.orgId,
    model_id: parsed.data.model_id,
    element_global_id: parsed.data.element_global_id.trim(),
    link_type: parsed.data.link_type,
    target_id: parsed.data.target_id,
    note: parsed.data.note || null,
    created_by: session.userId,
  });
  if (error) throw new Error(`Could not create bim model link: ${error.message}`);

  revalidatePath(`/console/bim/${parsed.data.model_id}`);
}

const DeleteLinkSchema = z.object({
  link_id: z.string().uuid(),
  model_id: z.string().uuid(),
});

export async function deleteBimModelLink(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = DeleteLinkSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { error } = await supabase
    .from("bim_model_links")
    .delete()
    .eq("id", parsed.data.link_id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete bim model link: ${error.message}`);

  revalidatePath(`/console/bim/${parsed.data.model_id}`);
}

const MarkReadySchema = z.object({ model_id: z.string().uuid() });

export async function markBimModelReady(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = MarkReadySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { error } = await supabase
    .from("bim_models")
    .update({ model_state: "ready", processed_at: new Date().toISOString() })
    .eq("id", parsed.data.model_id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update bim model: ${error.message}`);

  revalidatePath(`/console/bim/${parsed.data.model_id}`);
}
