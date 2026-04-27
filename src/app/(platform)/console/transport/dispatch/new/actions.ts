"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  fleet: z.enum(["t1", "t2", "t3", "media", "workforce", "spectator"]),
  vehicle_ref: z.string().max(80).optional(),
  scheduled_depart: z.string().min(1),
  scheduled_arrive: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createDispatchRun(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dispatch_runs")
    .insert({
      org_id: session.orgId,
      fleet: parsed.data.fleet,
      vehicle_ref: parsed.data.vehicle_ref || null,
      scheduled_depart: parsed.data.scheduled_depart,
      scheduled_arrive: parsed.data.scheduled_arrive || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/transport/dispatch");
  redirect(`/console/transport/dispatch/${data.id}`);
}
