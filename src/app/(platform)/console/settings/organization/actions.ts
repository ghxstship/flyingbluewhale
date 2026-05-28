"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin as sessionIsAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({ name: z.string().min(2).max(120) });

export async function updateOrgName(fd: FormData) {
  const session = await requireSession();
  if (!sessionIsAdmin(session)) throw new Error("Only owners + admins can rename the organization");

  const parsed = Schema.safeParse({ name: fd.get("name") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid name");

  const supabase = await createClient();
  const { error } = await supabase
    .from("orgs")
    .update({ name: parsed.data.name, updated_at: new Date().toISOString() })
    .eq("id", session.orgId);
  if (error) throw new Error(error.message);

  revalidatePath("/console/settings/organization");
  revalidatePath("/console/people");
}
