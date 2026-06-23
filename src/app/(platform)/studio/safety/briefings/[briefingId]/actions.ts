"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function markConducted(briefingId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("safety_briefings")
    .update({ briefing_state: "conducted", conducted_at: new Date().toISOString() })
    .eq("id", briefingId)
    .eq("org_id", session.orgId);
  if (error) throw new Error(error.message);
  revalidatePath("/studio/safety/briefings");
  revalidatePath(`/studio/safety/briefings/${briefingId}`);
  redirect(`/studio/safety/briefings/${briefingId}`);
}

const AddAttendeeSchema = z.object({
  briefingId: z.string().uuid(),
  // Either a user (org member) or a crew member — both nullable in the
  // schema, but the CHECK constraint requires at least one to be set.
  user_id: z.string().uuid().optional().or(z.literal("")),
  crew_member_id: z.string().uuid().optional().or(z.literal("")),
  acknowledged: z.coerce.boolean().optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function addAttendee(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = AddAttendeeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const user_id = parsed.data.user_id?.trim() || null;
  const crew_member_id = parsed.data.crew_member_id?.trim() || null;
  if (!user_id && !crew_member_id) return; // CHECK would reject anyway

  const supabase = await createClient();
  // Verify briefing is in caller's org (RLS would catch it too).
  const { data: briefing } = await supabase
    .from("safety_briefings")
    .select("id")
    .eq("id", parsed.data.briefingId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!briefing) return;

  const { error } = await supabase.from("safety_briefing_attendees").insert({
    briefing_id: parsed.data.briefingId,
    org_id: session.orgId,
    user_id,
    crew_member_id,
    acknowledged_at: parsed.data.acknowledged ? new Date().toISOString() : null,
    notes: parsed.data.notes?.trim() || null,
  });
  if (error) throw new Error(`Could not create safety briefing attendee: ${error.message}`);

  revalidatePath(`/studio/safety/briefings/${parsed.data.briefingId}`);
}

const AcknowledgeAttendeeSchema = z.object({
  briefingId: z.string().uuid(),
  attendeeId: z.string().uuid(),
});

export async function acknowledgeAttendee(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = AcknowledgeAttendeeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("safety_briefing_attendees")
    .update({ acknowledged_at: new Date().toISOString() })
    .eq("id", parsed.data.attendeeId)
    .eq("briefing_id", parsed.data.briefingId)
    .eq("org_id", session.orgId)
    .is("acknowledged_at", null);
  if (error) throw new Error(`Could not update safety briefing attendee: ${error.message}`);

  revalidatePath(`/studio/safety/briefings/${parsed.data.briefingId}`);
}

const RemoveAttendeeSchema = z.object({
  briefingId: z.string().uuid(),
  attendeeId: z.string().uuid(),
});

export async function removeAttendee(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = RemoveAttendeeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("safety_briefing_attendees")
    .delete()
    .eq("id", parsed.data.attendeeId)
    .eq("briefing_id", parsed.data.briefingId)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete safety briefing attendee: ${error.message}`);

  revalidatePath(`/studio/safety/briefings/${parsed.data.briefingId}`);
}
