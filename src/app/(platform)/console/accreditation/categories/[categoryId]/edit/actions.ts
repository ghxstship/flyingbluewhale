"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
});

export type State = { error?: string } | null;

export async function updateCategory(categoryId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("accreditation_categories")
    .update({
      code: parsed.data.code,
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color || null,
    })
    .eq("id", categoryId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/accreditation/categories/${categoryId}`);
  revalidatePath("/console/accreditation/categories");
  redirect(`/console/accreditation/categories/${categoryId}`);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("accreditation_categories").delete().eq("id", categoryId).eq("org_id", session.orgId);
  revalidatePath("/console/accreditation/categories");
  redirect("/console/accreditation/categories");
}
