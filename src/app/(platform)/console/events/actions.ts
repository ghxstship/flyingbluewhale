"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  location_id: z.string().uuid().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createEventAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    starts_at: new Date(parsed.data.starts_at).toISOString(),
    ends_at: new Date(parsed.data.ends_at).toISOString(),
    location_id: parsed.data.location_id || null,
    project_id: parsed.data.project_id || null,
    description: parsed.data.description || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/events");
  revalidatePath("/console/schedule");
  redirect("/console/events");
}
