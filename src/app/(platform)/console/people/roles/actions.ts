"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  slug: z.string().min(1).max(60).regex(/^[a-z0-9_-]+$/, "Lowercase letters, digits, dashes only"),
  label: z.string().min(1).max(120),
  description: z.string().max(400).optional(),
  permissions: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createCustomRole(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const permissions = (parsed.data.permissions ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const { error } = await supabase.from("org_roles").insert({
    org_id: session.orgId,
    slug: parsed.data.slug,
    label: parsed.data.label,
    description: parsed.data.description || null,
    permissions,
    is_system: false,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/people/roles");
  return null;
}

export async function deleteCustomRole(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("org_roles")
    .delete()
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("is_system", false);
  revalidatePath("/console/people/roles");
}
