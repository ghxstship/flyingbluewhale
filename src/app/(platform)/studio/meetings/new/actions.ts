"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { nextOrgCode } from "@/lib/codes";
import { actionFail, formFail } from "@/lib/forms/fail";

// Kit 20 Phase A: a meeting is an events row (event_kind = 'meeting') plus a
// meeting_event_details sibling carrying the meeting-shaped fields.

const Schema = z.object({
  title: z.string().min(1).max(200),
  project_id: z.string().uuid().optional().or(z.literal("")),
  kind: z
    .enum([
      "kickoff",
      "owner_architect_contractor",
      "sub_meeting",
      "safety",
      "punch_walk",
      "design_review",
      "progress",
      "other",
    ])
    .default("other"),
  starts_at: z.string().min(1),
  ends_at: z.string().optional(),
  location_name: z.string().max(200).optional(),
  meeting_url: z.string().max(500).optional(),
  agenda_md: z.string().max(20000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createMeeting(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;

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

  const code = await nextOrgCode("meeting_event_details", session.orgId, "MTG");

  // events.ends_at is NOT NULL on the unified store — open-ended meetings
  // default to a one-hour block (same rule the merge migration applied).
  const startsAt = parsed.data.starts_at;
  const startsMs = new Date(startsAt).getTime();
  const endsAt =
    parsed.data.ends_at || (Number.isNaN(startsMs) ? startsAt : new Date(startsMs + 60 * 60 * 1000).toISOString());

  const { data: row, error } = await supabase
    .from("events")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id || null,
      name: parsed.data.title,
      event_kind: "meeting",
      event_state: "scheduled",
      starts_at: startsAt,
      ends_at: endsAt,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  const eventId = (row as { id: string }).id;

  const { error: detailsError } = await supabase.from("meeting_event_details").insert({
    id: eventId,
    org_id: session.orgId,
    code,
    kind: parsed.data.kind,
    location_name: parsed.data.location_name || null,
    meeting_url: parsed.data.meeting_url || null,
    agenda_md: parsed.data.agenda_md || null,
  });
  if (detailsError) {
    // Compensate: never leave a meeting event without its details sibling.
    await supabase.from("events").delete().eq("id", eventId).eq("org_id", session.orgId);
    return actionFail(detailsError.message, fd);
  }

  revalidatePath("/studio/meetings");
  revalidatePath("/studio/schedule");
  revalidatePath("/studio/calendar");
  redirect(`/studio/meetings/${eventId}`);
}
