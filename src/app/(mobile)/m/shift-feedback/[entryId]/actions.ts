"use server";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

type FeedbackInput = {
  entryId: string;
  mood: number;
  energy?: number;
  safetyRating?: number;
  comment?: string;
  anonymous: boolean;
};

export async function submitShiftFeedback(input: FeedbackInput) {
  if (!hasSupabase) return { error: "Supabase not configured" };
  const session = await requireSession();
  const supabase = await createClient();

  // Verify the time entry belongs to the current user.
  const { data: entry } = await supabase
    .from("time_entries")
    .select("id, org_id")
    .eq("id", input.entryId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!entry) return { error: "Time entry not found" };

  const { error } = await supabase.from("shift_feedback").upsert(
    {
      org_id: entry.org_id,
      time_entry_id: input.entryId,
      user_id: session.userId,
      mood: input.mood,
      energy: input.energy ?? null,
      safety_rating: input.safetyRating ?? null,
      comment: input.comment ?? null,
      anonymous: input.anonymous,
    },
    { onConflict: "time_entry_id" },
  );

  if (error) return { error: error.message };
  return null;
}
