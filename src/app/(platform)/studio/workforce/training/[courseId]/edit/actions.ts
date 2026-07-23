"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(160),
  body_markdown: z.string().min(1).max(40000),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateTrainingCourse(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("kb_articles", session.orgId, id, expectedUpdatedAt, {
    title: parsed.data.title,
    slug: parsed.data.slug,
    body_markdown: parsed.data.body_markdown,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : actionErrorMessage("not-found.kb-article", "Kb Article not found.") };
  }
  revalidatePath(`/studio/workforce/training/${id}`);
  revalidatePath("/studio/workforce/training");
  redirect(`/studio/workforce/training/${id}`);
}

export async function deleteTrainingCourse(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("kb_articles").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete kb article: ${error.message}`);
  revalidatePath("/studio/workforce/training");
  redirect("/studio/workforce/training");
}
