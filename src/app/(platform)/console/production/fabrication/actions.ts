"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FabricationStatus } from "@/lib/supabase/types";
import { PRODUCTION_PHASES, transitionProductionPhase, type ProductionPhase } from "@/lib/production-phase";

const Schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  due_at: z.string().date().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function createFabAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("fabrication_orders").insert({
    org_id: session.orgId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    due_at: parsed.data.due_at || null,
    project_id: parsed.data.project_id || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/production/fabrication");
  redirect("/console/production/fabrication");
}

const StatusEnum = z.enum(["open", "in_progress", "blocked", "complete"]);

// Workflow status FSM (separate from production_phase, the design→install
// macro arc). The matrix mirrors the comment below: complete is terminal.
const FAB_STATUS_TRANSITIONS: Record<z.infer<typeof StatusEnum>, readonly z.infer<typeof StatusEnum>[]> = {
  open: ["in_progress", "blocked"],
  in_progress: ["complete", "blocked"],
  blocked: ["in_progress"],
  complete: [],
};

/**
 * Drive a fabrication order through its lifecycle:
 * open → in_progress → complete (or blocked, with un-block returning to
 * in_progress).
 *
 * Wired as a `<form action={setFabStatus}>` server action — its
 * signature must stay (FormData) => void | Promise<void> for Next's
 * native form action type. Errors throw so Next's error boundary
 * surfaces them rather than silently no-op'ing as before.
 */
export async function setFabStatus(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  const next = StatusEnum.safeParse(formData.get("status"));
  if (!id) throw new Error("Missing fabrication order id");
  if (!next.success) throw new Error("Invalid target status");

  const supabase = await createClient();
  // Read current status so we can validate the transition AND scope the
  // conditional update.
  const { data: row } = await supabase
    .from("fabrication_orders")
    .select("status")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!row) throw new Error("Fabrication order not found");
  const current = row.status as z.infer<typeof StatusEnum>;
  const allowed = FAB_STATUS_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next.data)) {
    throw new Error(`Cannot move ${current} → ${next.data}. Allowed: ${allowed.join(", ") || "(terminal)"}`);
  }

  // Conditional update closes the TOCTOU between the SELECT above and
  // the write — concurrent operators clicking the same row would
  // otherwise overwrite each other.
  const { data: updated, error } = await supabase
    .from("fabrication_orders")
    .update({ status: next.data as FabricationStatus })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("status", current)
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    throw new Error("Status changed concurrently — refresh and retry");
  }
  revalidatePath("/console/production/fabrication");
  revalidatePath(`/console/production/fabrication/${id}`);
}

/**
 * Drive the LDP §2 Production Lifecycle phase. Distinct from setFabStatus —
 * status is workflow-execution (open/in_progress/blocked/complete) while
 * phase is the design→install macro-arc.
 */
export async function transitionProductionPhaseAction(orderId: string, to: ProductionPhase, reason?: string) {
  const session = await requireSession();
  if (!PRODUCTION_PHASES.includes(to)) return { error: "Invalid target phase" };
  const result = await transitionProductionPhase({
    orgId: session.orgId,
    fabricationOrderId: orderId,
    to,
    reason,
    transitionedBy: session.userId,
  });
  if (!result.ok) return { error: result.error };
  revalidatePath(`/console/production/fabrication/${orderId}`);
  revalidatePath("/console/production/fabrication");
  return { ok: true as const };
}

export async function deleteFab(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("fabrication_orders").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/production/fabrication");
  redirect("/console/production/fabrication");
}
