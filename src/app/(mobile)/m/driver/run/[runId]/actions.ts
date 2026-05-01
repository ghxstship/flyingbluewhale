"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string } | null;

type Transition = "depart" | "arrive" | "cancel";

export async function transitionRun(
  runId: string,
  transition: Transition,
  _prev: State,
  _form: FormData,
): Promise<State> {
  const session = await requireSession();
  const supabase = await createClient();

  const now = new Date().toISOString();

  const q = supabase
    .from("dispatch_runs")
    .update(
      transition === "depart"
        ? { status: "in_transit", actual_depart: now }
        : transition === "arrive"
          ? { status: "arrived", actual_arrive: now }
          : { status: "cancelled" },
    )
    .eq("id", runId)
    .eq("org_id", session.orgId)
    .eq("driver_id", session.userId);

  const { error } = await q;

  if (error) return { error: error.message };
  revalidatePath("/m/driver");
  revalidatePath(`/m/driver/run/${runId}`);
  return null;
}
