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
  section_number: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  project_id: z.string().uuid(),
  format: z.enum(["masterformat_2026", "masterformat_1995", "uniformat_2_2", "nrm2", "custom"]),
  division: z.string().max(120).optional(),
  body_md: z.string().max(200000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateSpecSection(_: State, fd: FormData): Promise<State> {
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
    .from("spec_sections")
    .update({
      section_number: patch.section_number.trim(),
      title: patch.title,
      project_id: patch.project_id,
      format: patch.format,
      division: patch.division || null,
      body_md: patch.body_md || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("updated_at", expectedUpdatedAt)
    .select("id")
    .maybeSingle();

  if (error) return actionFail(error.message, fd);
  if (!updated) {
    const { data: stillThere } = await supabase
      .from("spec_sections")
      .select("id")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    return { error: stillThere ? STALE_ROW_MESSAGE : "Spec section not found." };
  }

  revalidatePath(`/console/specs/${id}`);
  revalidatePath("/console/specs");
  redirect(`/console/specs/${id}`);
}
