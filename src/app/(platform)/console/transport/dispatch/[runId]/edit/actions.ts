"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  vehicle_ref: z.string().max(80).optional().or(z.literal("")),
  fleet: z.string(),
  scheduled_depart: z.string().optional().or(z.literal("")),
  scheduled_arrive: z.string().optional().or(z.literal("")),
  actual_depart: z.string().optional().or(z.literal("")),
  actual_arrive: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateDispatchRun(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("dispatch_runs", session.orgId, id, expectedUpdatedAt, {
    vehicle_ref: parsed.data.vehicle_ref || null,
    fleet: parsed.data.fleet as "t1" | "t2" | "t3" | "media" | "workforce" | "spectator",
    scheduled_depart: parsed.data.scheduled_depart,
    scheduled_arrive: parsed.data.scheduled_arrive || null,
    actual_depart: parsed.data.actual_depart || null,
    actual_arrive: parsed.data.actual_arrive || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Dispatch Run not found." };
  }
  revalidatePath(`/console/transport/dispatch/${id}`);
  revalidatePath("/console/transport/dispatch");
  redirect(`/console/transport/dispatch/${id}`);
}

export async function deleteDispatchRun(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("dispatch_runs").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete dispatch run: ${error.message}`);
  revalidatePath("/console/transport/dispatch");
  redirect("/console/transport/dispatch");
}
