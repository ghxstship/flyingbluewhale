"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/** FormState contract shared with FormShell / the editor island. */
export type State = { error?: string; ok?: true } | null;

// The Tiptap document is arbitrary nested JSON; we validate the outer shape
// (a `doc` node) and size-cap it, but don't enumerate every node type.
const SaveSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  doc_state: z.enum(["draft", "published", "archived"]),
  // content arrives JSON-stringified from the client island.
  content: z.string().max(2_000_000),
});

export async function saveDoc(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit documents" };
  const parsed = SaveSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  let content: unknown;
  try {
    content = JSON.parse(parsed.data.content);
  } catch {
    return { error: "Document body was not valid JSON" };
  }
  if (!content || typeof content !== "object" || (content as { type?: unknown }).type !== "doc") {
    return { error: "Document body is not a valid editor document" };
  }

  const supabase = await createClient();
  // `collab_docs` is not yet in the generated Database types (PENDING
  // migration) — use the LooseSupabase cast. RLS enforces org scope.
  const { error } = await (supabase as unknown as LooseSupabase)
    .from("collab_docs")
    .update({
      title: parsed.data.title,
      doc_state: parsed.data.doc_state,
      content,
    })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };

  revalidatePath(`/studio/collaborate/docs/${parsed.data.id}`);
  revalidatePath("/studio/collaborate/docs");
  return { ok: true };
}

export async function deleteDoc(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = await createClient();
  const { error } = await (supabase as unknown as LooseSupabase)
    .from("collab_docs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete document: ${error.message}`);
  revalidatePath("/studio/collaborate/docs");
  // No redirect — DeleteForm's undo flow navigates client-side after
  // showing the "Deleted" toast with its Undo action (REC-14).
}
