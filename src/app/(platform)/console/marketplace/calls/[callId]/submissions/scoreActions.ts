"use server";

import { revalidatePath } from "next/cache";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export type ScoreState = { error?: string; scored?: number } | null;

export async function scoreSubmissionsAction(_: ScoreState, fd: FormData): Promise<ScoreState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager+ required" };

  const callId = String(fd.get("call_id") ?? "");
  if (!callId) return { error: "Missing call" };

  const supabase = await createClient();

  const [callResp, subsResp] = await Promise.all([
    supabase
      .from("open_calls")
      .select("id, title, description, genre_tags, trade_categories, region, venue_type, fee_min_cents, fee_max_cents, currency")
      .eq("id", callId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("open_call_submissions")
      .select("id, submitter_user_id, cover_note, fee_proposed_cents, score")
      .eq("open_call_id", callId)
      .eq("org_id", session.orgId)
      .is("score", null)
      .limit(20),
  ]);

  if (!callResp.data) return { error: "Call not found" };
  const call = callResp.data as {
    id: string; title: string; description: string | null;
    genre_tags: string[]; trade_categories: string[];
    region: string | null; venue_type: string | null;
    fee_min_cents: number | null; fee_max_cents: number | null; currency: string;
  };

  const unscored = (subsResp.data ?? []) as Array<{
    id: string; submitter_user_id: string; cover_note: string | null; fee_proposed_cents: number | null;
  }>;

  if (unscored.length === 0) return { error: "All submissions already scored" };

  // Fetch talent profiles for submitters
  const submitterIds = unscored.map((s) => s.submitter_user_id);
  const { data: profiles } = await supabase
    .from("talent_profiles")
    .select("user_id, genres, trade_categories, bio, min_fee_cents, max_fee_cents")
    .in("user_id", submitterIds)
    .eq("org_id", session.orgId);

  const profileMap = new Map(
    ((profiles ?? []) as Array<{
      user_id: string; genres: string[]; trade_categories: string[];
      bio: string | null; min_fee_cents: number | null; max_fee_cents: number | null;
    }>).map((p) => [p.user_id, p]),
  );

  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "Anthropic API key not configured" };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const callContext = [
    `Title: ${call.title}`,
    call.description ? `Description: ${call.description}` : null,
    call.genre_tags.length ? `Genres: ${call.genre_tags.join(", ")}` : null,
    call.trade_categories.length ? `Categories: ${call.trade_categories.join(", ")}` : null,
    call.region ? `Region: ${call.region}` : null,
    call.venue_type ? `Venue: ${call.venue_type}` : null,
  ].filter(Boolean).join("\n");

  let scoredCount = 0;

  for (const sub of unscored) {
    const profile = profileMap.get(sub.submitter_user_id);
    const subContext = [
      sub.cover_note ? `Cover note: ${sub.cover_note}` : null,
      sub.fee_proposed_cents ? `Proposed fee: ${sub.fee_proposed_cents / 100} ${call.currency}` : null,
      profile?.genres?.length ? `Talent genres: ${profile.genres.join(", ")}` : null,
      profile?.trade_categories?.length ? `Talent categories: ${profile.trade_categories.join(", ")}` : null,
      profile?.bio ? `Bio: ${profile.bio.slice(0, 500)}` : null,
    ].filter(Boolean).join("\n");

    try {
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `Score this talent submission against the open call requirements.
Return ONLY a JSON object: {"score": <0-100>, "reasoning": "<one sentence>"}

OPEN CALL:
${callContext}

SUBMISSION:
${subContext}

Score 0-100 based on genre/category match, fee alignment, and cover note relevance.`,
          },
        ],
      });

      const raw = (msg.content[0] as { text: string }).text.trim();
      const jsonMatch = raw.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { score: number; reasoning: string };
        const score = Math.max(0, Math.min(100, Math.round(parsed.score)));

        await supabase
          .from("open_call_submissions")
          .update({
            score,
            match_reasoning: parsed.reasoning ?? null,
            scored_at: new Date().toISOString(),
          })
          .eq("id", sub.id)
          .eq("org_id", session.orgId);

        scoredCount++;
      }
    } catch {
      // Skip individual failures — score what we can
    }
  }

  revalidatePath(`/console/marketplace/calls/${callId}/submissions`);
  return { scored: scoredCount };
}
