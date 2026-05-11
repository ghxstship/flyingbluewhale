"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({ id: z.string().uuid() });

export async function archiveZone(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const { id } = Schema.parse(Object.fromEntries(fd));
  const supabase = await createClient();
  await supabase
    .from("time_clock_zones")
    .update({ lifecycle_state: "archived" })
    .eq("id", id)
    .eq("org_id", session.orgId);
  revalidatePath(`/console/settings/time-clock-zones/${id}`);
  revalidatePath("/console/settings/time-clock-zones");
}

export async function reactivateZone(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const { id } = Schema.parse(Object.fromEntries(fd));
  const supabase = await createClient();
  await supabase
    .from("time_clock_zones")
    .update({ lifecycle_state: "active" })
    .eq("id", id)
    .eq("org_id", session.orgId);
  revalidatePath(`/console/settings/time-clock-zones/${id}`);
  revalidatePath("/console/settings/time-clock-zones");
}
