"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { Constants } from "@/lib/supabase/database.types";

const CreateSchema = z.object({
  category: z.enum(["AV", "cleaning", "repair", "IT", "hospitality", "security", "other"]),
  severity: z.enum(Constants.public.Enums.sla_severity).default("P3"),
  summary: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  project_id: z.string().uuid().optional().or(z.literal("")),
  venue_id: z.string().uuid().optional().or(z.literal("")),
  // Optional shell hint: "console" (default) or "mobile" — controls the
  // post-create redirect target. Mobile filers stay in the mobile shell.
  shell: z.enum(["console", "mobile"]).optional(),
});

export type CreateState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createServiceRequest(_: CreateState, fd: FormData): Promise<CreateState> {
  const session = await requireSession();
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guards on project_id + venue_id.
  if (parsed.data.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", parsed.data.project_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization" };
  }
  if (parsed.data.venue_id) {
    const { data: venue } = await supabase
      .from("venues")
      .select("id")
      .eq("id", parsed.data.venue_id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!venue) return { error: "Venue not found in your organization" };
  }

  const { data, error } = await supabase
    .from("service_requests")
    .insert({
      org_id: session.orgId,
      category: parsed.data.category,
      severity: parsed.data.severity,
      summary: parsed.data.summary,
      description: parsed.data.description || null,
      project_id: parsed.data.project_id || null,
      venue_id: parsed.data.venue_id || null,
      requester_id: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  const { error: insertError } = await supabase.from("service_request_events").insert({
    request_id: data.id,
    org_id: session.orgId,
    actor_id: session.userId,
    kind: "opened",
    payload: { severity: parsed.data.severity, category: parsed.data.category },
  });
  if (insertError) return actionFail(insertError.message, fd);
  revalidatePath("/studio/services/requests");
  if (parsed.data.shell === "mobile") {
    revalidatePath("/m/requests");
    redirect(`/m/requests/${data.id}`);
  }
  redirect(`/studio/services/requests/${data.id}`);
}

const TransitionSchema = z.object({
  to: z.enum(["acknowledged", "in_progress", "resolved", "cancelled"]),
  note: z.string().max(2000).optional(),
});

// Service request FSM: open → acknowledged → in_progress → resolved
// (with cancel allowed from any non-terminal state).
const REQUEST_TRANSITIONS: Record<string, readonly string[]> = {
  open: ["acknowledged", "cancelled"],
  acknowledged: ["in_progress", "resolved", "cancelled"],
  in_progress: ["resolved", "cancelled"],
  resolved: [],
  cancelled: [],
};

export async function transitionRequest(requestId: string, fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = TransitionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("service_requests")
    .select("request_state, severity")
    .eq("id", requestId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!existing) throw new Error("Service request not found");

  const current = existing.request_state;
  const allowed = REQUEST_TRANSITIONS[current] ?? [];
  if (!allowed.includes(parsed.data.to)) {
    throw new Error(`Cannot move ${current} → ${parsed.data.to}. Allowed: ${allowed.join(", ") || "(terminal)"}`);
  }

  const patch: Record<string, unknown> = { request_state: parsed.data.to, updated_at: new Date().toISOString() };
  const now = new Date().toISOString();
  if (parsed.data.to === "acknowledged" && current === "open") patch.acknowledged_at = now;
  if (parsed.data.to === "resolved") patch.resolved_at = now;
  if (parsed.data.to === "cancelled") patch.cancelled_at = now;
  if (parsed.data.note && parsed.data.to === "resolved") patch.resolution_note = parsed.data.note;

  // Conditional update closes the TOCTOU between the SELECT above and
  // this write. Without it, two operators clicking acknowledge at the
  // same time would both fire the event log + double-stamp acknowledged_at.
  const { data: updated, error } = await supabase
    .from("service_requests")
    .update(patch as never)
    .eq("id", requestId)
    .eq("org_id", session.orgId)
    .eq("request_state", current)
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    throw new Error("Service request status changed concurrently. Refresh and retry");
  }

  const { error: insertError } = await supabase.from("service_request_events").insert({
    request_id: requestId,
    org_id: session.orgId,
    actor_id: session.userId,
    kind: parsed.data.to === "resolved" ? "resolved" : parsed.data.to === "cancelled" ? "cancelled" : "status_changed",
    payload: { from: current, to: parsed.data.to, note: parsed.data.note ?? null },
  });
  if (insertError) throw new Error(`Could not create service request event: ${insertError.message}`);
  revalidatePath(`/studio/services/requests/${requestId}`);
  revalidatePath("/studio/services/requests");
}
