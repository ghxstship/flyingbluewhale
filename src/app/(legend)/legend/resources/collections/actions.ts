"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";

const CollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createCollectionAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create collections" };
  const parsed = CollectionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("resource_collections")
    .insert({
      org_id: session.orgId,
      name: d.name,
      description: d.description || null,
      sort_order: d.sort_order,
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/legend/resources/collections");
  revalidatePath("/legend/resources");
  redirect(`/legend/resources/collections/${data.id}`);
}

export async function updateCollectionAction(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit collections" };
  const parsed = CollectionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("resource_collections")
    .update({
      name: d.name,
      description: d.description || null,
      sort_order: d.sort_order,
    })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) return actionFail(error.message, fd);
  revalidatePath("/legend/resources/collections");
  revalidatePath(`/legend/resources/collections/${id}`);
  revalidatePath("/legend/resources");
  redirect(`/legend/resources/collections/${id}`);
}

export async function deleteCollectionAction(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can delete collections");
  const db = (await createClient()) as unknown as LooseSupabase;
  // Soft-delete the collection. Resources keep their pointer; the DB's
  // ON DELETE SET NULL only fires on a hard delete, so we proactively
  // unlink so the soft-deleted collection stops grouping live resources.
  const { error: unlinkErr } = await db
    .from("resources")
    .update({ collection_id: null })
    .eq("collection_id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (unlinkErr) throw new Error(`Could not unlink resources: ${unlinkErr.message}`);
  const { error } = await db
    .from("resource_collections")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not delete collection: ${error.message}`);
  revalidatePath("/legend/resources/collections");
  revalidatePath("/legend/resources");
  redirect("/legend/resources/collections");
}
