"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function markConducted(briefingId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("safety_briefings")
    .update({ status: "conducted", conducted_at: new Date().toISOString() })
    .eq("id", briefingId)
    .eq("org_id", session.orgId);
  if (error) throw new Error(error.message);
  revalidatePath("/console/safety/briefings");
  revalidatePath(`/console/safety/briefings/${briefingId}`);
  redirect(`/console/safety/briefings/${briefingId}`);
}
