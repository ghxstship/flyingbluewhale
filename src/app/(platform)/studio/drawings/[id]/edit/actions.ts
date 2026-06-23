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
  description: z.string().max(4000).optional(),
  project_id: z.string().uuid(),
  discipline: z.string().max(16).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateSheetSet(_: State, fd: FormData): Promise<State> {
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
    .from("sheet_sets")
    .update({
      name: patch.name,
      description: patch.description || null,
      project_id: patch.project_id,
      discipline: patch.discipline || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("updated_at", expectedUpdatedAt)
    .select("id")
    .maybeSingle();

  if (error) return actionFail(error.message, fd);
  if (!updated) {
    const { data: stillThere } = await supabase
      .from("sheet_sets")
      .select("id")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    return { error: stillThere ? STALE_ROW_MESSAGE : "Sheet set not found." };
  }

  revalidatePath(`/studio/drawings/${id}`);
  revalidatePath("/studio/drawings");
  redirect(`/studio/drawings/${id}`);
}
