"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({ id: z.string().uuid() });

export async function archiveZone(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const { id } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("time_clock_zones")
    .update({ lifecycle_state: "archived" })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update time clock zone: ${error.message}`);
  revalidatePath(`/studio/settings/time-clock-zones/${id}`);
  revalidatePath("/studio/settings/time-clock-zones");
}

export async function reactivateZone(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const { id } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("time_clock_zones")
    .update({ lifecycle_state: "active" })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update time clock zone: ${error.message}`);
  revalidatePath(`/studio/settings/time-clock-zones/${id}`);
  revalidatePath("/studio/settings/time-clock-zones");
}
