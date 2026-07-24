"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { audiencesForViewer } from "@/lib/db/announcements";

/**
 * Poll vote action — the ONLY writer of `poll_votes` in the app. One vote
 * per user per poll (poll_votes has no update path here; changing a vote is
 * not offered). RLS backs this up: the insert WITH CHECK pins voter_id to
 * auth.uid().
 */

export type State = { error?: string } | null;

const Schema = z.object({
  poll_id: z.string().uuid(),
  option_id: z.string().uuid(),
});

type PollRow = {
  id: string;
  publish_state: string;
  closes_at: string | null;
  audience: string;
};

export async function votePoll(pollId: string, optionId: string): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse({ poll_id: pollId, option_id: optionId });
  if (!parsed.success) return { error: "Invalid vote." };
  const supabase = await createClient();

  const { data: pollData } = await supabase
    .from("polls")
    .select("id, publish_state, closes_at, audience")
    .eq("id", parsed.data.poll_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const poll = pollData as PollRow | null;
  if (!poll) return { error: "Poll not found." };
  if (poll.publish_state !== "live") return { error: "This poll is closed." };
  // A past deadline closes voting even while publish_state is still "live"
  // — flipping the state at the deadline is a separate close automation.
  if (poll.closes_at && Date.parse(poll.closes_at) <= Date.now()) {
    return { error: "This poll is closed." };
  }
  const audiences = audiencesForViewer(session.role ?? null, session.persona ?? null);
  if (!(audiences as string[]).includes(poll.audience)) {
    return { error: "This poll is not addressed to you." };
  }

  // The option must belong to this poll — a forged option id must not let a
  // vote land on another poll's tally.
  const { data: option } = await supabase
    .from("poll_options")
    .select("id")
    .eq("id", parsed.data.option_id)
    .eq("poll_id", poll.id)
    .maybeSingle();
  if (!option) return { error: "That option does not exist." };

  const { data: existing } = await supabase
    .from("poll_votes")
    .select("option_id")
    .eq("poll_id", poll.id)
    .eq("voter_id", session.userId)
    .limit(1);
  if ((existing ?? []).length > 0) return { error: "You already voted." };

  const { error } = await supabase.from("poll_votes").insert({
    poll_id: poll.id,
    option_id: parsed.data.option_id,
    voter_id: session.userId,
  });
  if (error) return { error: error.message };

  revalidatePath("/m/polls");
  return null;
}
