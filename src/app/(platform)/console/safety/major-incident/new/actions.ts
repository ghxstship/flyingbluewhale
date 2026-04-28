"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  status: z.string().max(40).optional(),
});

export type State = { error?: string } | null;

export async function createMajorIncident(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("major_incidents")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      status: parsed.data.status || "activated",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/safety/major-incident");
  redirect(`/console/safety/major-incident/${data.id}`);
}
