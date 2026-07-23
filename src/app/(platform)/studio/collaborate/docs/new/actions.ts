"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  title: z.string().min(1).max(200),
  doc_state: z.enum(["draft", "published", "archived"]).default("draft"),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createDoc(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.create-documents", "Only manager+ can create documents") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // `collab_docs` is not yet in the generated Database types (PENDING
  // migration) — use the LooseSupabase cast. RLS is the real boundary.
  const { data, error } = await (supabase as unknown as LooseSupabase)
    .from("collab_docs")
    .insert({
      org_id: session.orgId,
      title: parsed.data.title,
      doc_state: parsed.data.doc_state,
      created_by: session.userId,
      content: { type: "doc", content: [] },
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/collaborate/docs");
  redirect(`/studio/collaborate/docs/${data.id}`);
}
