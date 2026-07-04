"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { dateRangeRefine } from "@/lib/zod/dateRange";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().max(4000).optional().or(z.literal("")),
    starts_at: z.string().optional().or(z.literal("")),
    ends_at: z.string().optional().or(z.literal("")),
    event_state: z.string(),
    location_name: z.string().max(200).optional(),
    meeting_url: z.string().max(500).optional(),
    agenda_md: z.string().max(20000).optional(),
    minutes_md: z.string().max(40000).optional(),
  })
  // Sea Trial R2 FINDING-018: when both supplied, end must follow start.
  .refine(...dateRangeRefine("starts_at", "ends_at"));

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateMeeting(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("events", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    description: parsed.data.description || null,
    starts_at: parsed.data.starts_at,
    ends_at: parsed.data.ends_at,
    event_state: parsed.data.event_state as "draft" | "scheduled" | "live" | "complete" | "cancelled",
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Event not found." };
  }

  // Meeting-shaped fields live on the details sibling; the form only posts
  // them when the sibling exists (event_kind = 'meeting'), flagged here.
  if (fd.get("_has_details") === "1") {
    const supabase = (await createClient()) as unknown as LooseSupabase;
    const { error: detailsError } = await supabase
      .from("meeting_event_details")
      .update({
        location_name: parsed.data.location_name || null,
        meeting_url: parsed.data.meeting_url || null,
        agenda_md: parsed.data.agenda_md || null,
        minutes_md: parsed.data.minutes_md || null,
      })
      .eq("id", id)
      .eq("org_id", session.orgId);
    if (detailsError) return { error: detailsError.message };
  }

  revalidatePath(`/studio/meetings/${id}`);
  revalidatePath("/studio/meetings");
  redirect(`/studio/meetings/${id}`);
}

export async function deleteMeeting(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete event: ${error.message}`);
  revalidatePath("/studio/meetings");
  redirect("/studio/meetings");
}
