"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  title: z.string().min(1).max(120),
  department: z.string().max(80).optional().or(z.literal("")),
  location: z.string().max(120).optional().or(z.literal("")),
  employment_type: z.enum(["full_time", "part_time", "contractor", "freelance", "volunteer"]).optional().or(z.literal("")),
  description: z.string().max(4000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function createPositionAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("job_positions")
    .insert({
      org_id: session.orgId,
      title: parsed.data.title,
      department: parsed.data.department || null,
      location: parsed.data.location || null,
      employment_type: parsed.data.employment_type || null,
      description: parsed.data.description || null,
      phase: "open",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/console/workforce/hiring");
  redirect(`/console/workforce/hiring/${(data as unknown as { id: string }).id}`);
}
