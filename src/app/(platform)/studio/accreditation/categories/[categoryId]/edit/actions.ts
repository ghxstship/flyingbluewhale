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
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateCategory(categoryId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck(
    "accreditation_categories",
    session.orgId,
    categoryId,
    expectedUpdatedAt,
    {
      code: parsed.data.code,
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color || null,
    },
  );
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : actionErrorMessage("not-found.accreditation-categorie", "Accreditation Categorie not found.") };
  }
  revalidatePath(`/studio/accreditation/categories/${categoryId}`);
  revalidatePath("/studio/accreditation/categories");
  redirect(`/studio/accreditation/categories/${categoryId}`);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("accreditation_categories")
    .delete()
    .eq("id", categoryId)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete accreditation category: ${error.message}`);
  revalidatePath("/studio/accreditation/categories");
  redirect("/studio/accreditation/categories");
}
