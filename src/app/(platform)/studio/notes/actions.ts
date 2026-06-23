"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

export type State = { error?: string; ok?: true } | null;

async function db(): Promise<LooseSupabase> {
  return (await createClient()) as unknown as LooseSupabase;
}

export async function createNoteAction(): Promise<void> {
  const session = await requireSession();
  const supabase = await db();
  const { data, error } = await supabase
    .from("notes")
    .insert({ org_id: session.orgId, created_by: session.userId, title: "Untitled note", body_html: "" })
    .select("id")
    .single();
  if (error || !data) redirect("/studio/notes");
  revalidatePath("/studio/notes");
  redirect(`/studio/notes/${(data as { id: string }).id}`);
}

const SaveSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  body_html: z.string().max(200_000),
  note_state: z.enum(["draft", "published", "archived"]),
});

export async function saveNoteAction(_: State, fd: FormData): Promise<State> {
  const parsed = SaveSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid note." };
  const session = await requireSession();
  const supabase = await db();
  const { id, ...patch } = parsed.data;
  const { error } = await supabase.from("notes").update(patch).eq("id", id).eq("org_id", session.orgId);
  if (error) return { error: "Could not save the note." };
  revalidatePath(`/studio/notes/${id}`);
  revalidatePath("/studio/notes");
  return { ok: true };
}

export async function deleteNoteAction(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await db();
  await supabase
    .from("notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId);
  revalidatePath("/studio/notes");
  redirect("/studio/notes");
}
