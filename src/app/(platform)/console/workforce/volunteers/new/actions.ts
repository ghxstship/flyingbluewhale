"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  full_name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional(),
  role: z.string().max(120).optional(),
});

export type State = { error?: string } | null;

export async function createVolunteer(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workforce_members")
    .insert({
      org_id: session.orgId,
      kind: "volunteer",
      full_name: parsed.data.full_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      role: parsed.data.role || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/workforce/volunteers");
  redirect(`/console/workforce/volunteers/${data.id}`);
}
