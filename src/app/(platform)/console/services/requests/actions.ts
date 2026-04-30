"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const CreateSchema = z.object({
  category: z.enum(["AV", "cleaning", "repair", "IT", "hospitality", "security", "other"]),
  severity: z.enum(["P1", "P2", "P3", "P4"]).default("P3"),
  summary: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  project_id: z.string().uuid().optional().or(z.literal("")),
  venue_id: z.string().uuid().optional().or(z.literal("")),
  // Optional shell hint: "console" (default) or "mobile" — controls the
  // post-create redirect target. Mobile filers stay in the mobile shell.
  shell: z.enum(["console", "mobile"]).optional(),
});

export type CreateState = { error?: string } | null;

export async function createServiceRequest(_: CreateState, fd: FormData): Promise<CreateState> {
  const session = await requireSession();
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
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
  if (error) return { error: error.message };
  await supabase.from("service_request_events").insert({
    request_id: data.id,
    org_id: session.orgId,
    actor_id: session.userId,
    kind: "opened",
    payload: { severity: parsed.data.severity, category: parsed.data.category },
  });
  revalidatePath("/console/services/requests");
  if (parsed.data.shell === "mobile") {
    revalidatePath("/m/requests");
    redirect(`/m/requests/${data.id}`);
  }
  redirect(`/console/services/requests/${data.id}`);
}

const TransitionSchema = z.object({
  to: z.enum(["acknowledged", "in_progress", "resolved", "cancelled"]),
  note: z.string().max(2000).optional(),
});

export async function transitionRequest(requestId: string, fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = TransitionSchema.parse(Object.fromEntries(fd));
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("service_requests")
    .select("status, severity")
    .eq("id", requestId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!existing) return;

  const patch: Record<string, unknown> = { status: parsed.to, updated_at: new Date().toISOString() };
  const now = new Date().toISOString();
  if (parsed.to === "acknowledged" && existing.status === "open") patch.acknowledged_at = now;
  if (parsed.to === "resolved") patch.resolved_at = now;
  if (parsed.to === "cancelled") patch.cancelled_at = now;
  if (parsed.note && parsed.to === "resolved") patch.resolution_note = parsed.note;

  await supabase
    .from("service_requests")
    .update(patch as never)
    .eq("id", requestId)
    .eq("org_id", session.orgId);
  await supabase.from("service_request_events").insert({
    request_id: requestId,
    org_id: session.orgId,
    actor_id: session.userId,
    kind: parsed.to === "resolved" ? "resolved" : parsed.to === "cancelled" ? "cancelled" : "status_changed",
    payload: { from: existing.status, to: parsed.to, note: parsed.note ?? null },
  });
  revalidatePath(`/console/services/requests/${requestId}`);
  revalidatePath("/console/services/requests");
}
