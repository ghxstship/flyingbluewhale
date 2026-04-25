"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/i, "Lowercase letters, digits, dashes only"),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export type State = { error?: string } | null;

export async function createFormDefAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("form_defs")
    .insert({
      org_id: session.orgId,
      slug: parsed.data.slug.toLowerCase(),
      title: parsed.data.title,
      description: parsed.data.description || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/forms");
  redirect(`/console/forms/${data.id}`);
}
