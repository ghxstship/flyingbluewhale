"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  vehicle_ref: z.string().max(80).optional().or(z.literal("")),
  fleet: z.string(),
  scheduled_depart: z.string().optional().or(z.literal("")),
  scheduled_arrive: z.string().optional().or(z.literal("")),
  actual_depart: z.string().optional().or(z.literal("")),
  actual_arrive: z.string().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateDispatchRun(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("dispatch_runs")
    .update({
      vehicle_ref: parsed.data.vehicle_ref || null,
      fleet: parsed.data.fleet as "t1" | "t2" | "t3" | "media" | "workforce" | "spectator",
      scheduled_depart: parsed.data.scheduled_depart,
      scheduled_arrive: parsed.data.scheduled_arrive || null,
      actual_depart: parsed.data.actual_depart || null,
      actual_arrive: parsed.data.actual_arrive || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/transport/dispatch/${id}`);
  revalidatePath("/console/transport/dispatch");
  redirect(`/console/transport/dispatch/${id}`);
}

export async function deleteDispatchRun(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("dispatch_runs").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/transport/dispatch");
  redirect("/console/transport/dispatch");
}
