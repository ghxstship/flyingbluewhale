"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { RESOURCE_KINDS, RESOURCE_STATES, parseTags } from "@/lib/legend_resources";

const ResourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(160),
  collection_id: z.string().uuid().optional().or(z.literal("")),
  kind: z.enum(RESOURCE_KINDS),
  url: z.string().url().optional().or(z.literal("")),
  file_path: z.string().max(500).optional().or(z.literal("")),
  resource_state: z.enum(RESOURCE_STATES).default("draft"),
  tags: z.string().max(500).optional().or(z.literal("")),
  description: z.string().max(4000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createResourceAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create resources" };
  const parsed = ResourceSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("resources")
    .insert({
      org_id: session.orgId,
      collection_id: d.collection_id || null,
      title: d.title,
      description: d.description || null,
      kind: d.kind,
      url: d.url || null,
      file_path: d.file_path || null,
      resource_state: d.resource_state,
      tags: parseTags(d.tags),
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/legend/resources");
  redirect(`/legend/resources/${data.id}`);
}

export async function updateResourceAction(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit resources" };
  const parsed = ResourceSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("resources")
    .update({
      collection_id: d.collection_id || null,
      title: d.title,
      description: d.description || null,
      kind: d.kind,
      url: d.url || null,
      file_path: d.file_path || null,
      resource_state: d.resource_state,
      tags: parseTags(d.tags),
    })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) return actionFail(error.message, fd);
  revalidatePath("/legend/resources");
  revalidatePath(`/legend/resources/${id}`);
  redirect(`/legend/resources/${id}`);
}

const StateSchema = z.enum(RESOURCE_STATES);

export async function setResourceStateAction(id: string, next: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can change resource state");
  const parsed = StateSchema.safeParse(next);
  if (!parsed.success) throw new Error("Invalid resource state");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("resources")
    .update({ resource_state: parsed.data })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not update resource: ${error.message}`);
  revalidatePath(`/legend/resources/${id}`);
  revalidatePath("/legend/resources");
}

export async function deleteResourceAction(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can delete resources");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("resources")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not delete resource: ${error.message}`);
  revalidatePath("/legend/resources");
  redirect("/legend/resources");
}
