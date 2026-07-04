"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateRangeRefine } from "@/lib/zod/dateRange";
import { actionFail, formFail } from "@/lib/forms/fail";
import { SCHEDULE_EVENT_KINDS } from "@/lib/schedule/kinds";

const Schema = z
  .object({
    name: z.string().min(1),
    starts_at: z.string().min(1),
    ends_at: z.string().min(1),
    event_kind: z.enum(SCHEDULE_EVENT_KINDS).default("general"),
    location_id: z.string().uuid().optional().or(z.literal("")),
    project_id: z.string().uuid().optional().or(z.literal("")),
    description: z.string().optional(),
  })
  // Sea Trial R2 FINDING-018: ends_at must not precede starts_at.
  .refine(...dateRangeRefine("starts_at", "ends_at"));

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createEventAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guards on location_id + project_id.
  if (parsed.data.location_id) {
    const { data: location } = await supabase
      .from("locations")
      .select("id")
      .eq("id", parsed.data.location_id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!location) return { error: "Location not found in your organization" };
  }
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

  // Sea Trial FINDING-017: stamp `created_by` so the audit panel + ROS
  // can attribute event creation. Column added in migration
  // 20260504000001_events_created_by.sql.
  const { error } = await supabase.from("events").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    event_kind: parsed.data.event_kind,
    starts_at: new Date(parsed.data.starts_at).toISOString(),
    ends_at: new Date(parsed.data.ends_at).toISOString(),
    location_id: parsed.data.location_id || null,
    project_id: parsed.data.project_id || null,
    description: parsed.data.description || null,
    created_by: session.userId,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/events");
  revalidatePath("/studio/schedule");
  redirect("/studio/events");
}

const BulkIds = z.array(z.string().uuid()).min(1).max(200);

export type BulkResult = { message?: string; error?: string };

/**
 * Bulk cancel events — the list-table counterpart to per-event state
 * control. manager+ only; RLS pins every write to the session org. The
 * `events` table has no `deleted_at` column, so cancellation is a state
 * move (`event_state = 'cancelled'`), not a delete — it keeps the row in
 * the schedule history. Already-cancelled / completed / cross-org / missing
 * rows are skipped and reported.
 */
export async function bulkCancelEvents(ids: string[]): Promise<BulkResult> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "You Need Manager Access To Cancel Events" };
  const parsed = BulkIds.safeParse(ids);
  if (!parsed.success) return { error: "Invalid Selection" };
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("events")
    .update({ event_state: "cancelled" })
    .in("id", parsed.data)
    .eq("org_id", session.orgId)
    .not("event_state", "in", "(cancelled,complete)")
    .select("id");
  if (error) return { error: `Could Not Cancel — ${error.message}` };

  const cancelled = updated?.length ?? 0;
  const skipped = parsed.data.length - cancelled;
  revalidatePath("/studio/events");
  revalidatePath("/studio/schedule");
  if (skipped > 0) {
    return { error: `${cancelled} Cancelled · ${skipped} Skipped (already cancelled or completed)` };
  }
  return { message: `${cancelled} ${cancelled === 1 ? "Event" : "Events"} Cancelled` };
}
