"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string } | null;

type Transition = "depart" | "arrive" | "cancel";

// Driver run FSM: scheduled → in_transit → arrived. Cancel allowed from
// any non-terminal state. arrived + cancelled are terminal.
const RUN_TRANSITIONS: Record<string, readonly string[]> = {
  scheduled: ["in_transit", "cancelled"],
  in_transit: ["arrived", "cancelled"],
  arrived: [],
  cancelled: [],
};
const TARGET_FOR: Record<Transition, string> = {
  depart: "in_transit",
  arrive: "arrived",
  cancel: "cancelled",
};

export async function transitionRun(
  runId: string,
  transition: Transition,
  _prev: State,
  _form: FormData,
): Promise<State> {
  const session = await requireSession();
  const supabase = await createClient();

  const target = TARGET_FOR[transition];
  // Read current status so we can validate the transition AND scope the
  // conditional update — the field PWA doubles up clicks all the time.
  const { data: row } = await supabase
    .from("dispatch_runs")
    .select("status")
    .eq("id", runId)
    .eq("org_id", session.orgId)
    .eq("driver_id", session.userId)
    .maybeSingle();
  if (!row) return { error: "Run not found" };
  const current = (row as { status: string }).status;
  const allowed = RUN_TRANSITIONS[current] ?? [];
  if (!allowed.includes(target)) {
    return { error: `Cannot move ${current} → ${target}. Allowed: ${allowed.join(", ") || "(terminal)"}` };
  }

  const now = new Date().toISOString();
  const patch =
    transition === "depart"
      ? { status: "in_transit", actual_depart: now }
      : transition === "arrive"
        ? { status: "arrived", actual_arrive: now }
        : { status: "cancelled" };

  const { data: updated, error } = await supabase
    .from("dispatch_runs")
    .update(patch)
    .eq("id", runId)
    .eq("org_id", session.orgId)
    .eq("driver_id", session.userId)
    .eq("status", current as "scheduled")
    .select("id");

  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Run status changed concurrently — refresh and retry" };
  }
  revalidatePath("/m/driver");
  revalidatePath(`/m/driver/run/${runId}`);
  return null;
}
