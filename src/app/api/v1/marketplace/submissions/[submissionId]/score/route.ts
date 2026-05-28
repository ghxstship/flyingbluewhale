/**
 * POST /api/v1/marketplace/submissions/{submissionId}/score
 *
 * Competitive feature: AI talent match scoring (vs Bizzabo sponsor ROI engine /
 * Superfiliate Meta API data-driven creator matching).
 *
 * Reads the open call requirements and the submission applicant's profile,
 * asks claude-sonnet-4-6 for a 0–100 match score + rationale, and persists
 * the result to open_call_submissions.{match_score, match_rationale, match_scored_at}.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import type { LooseSupabase } from "@/lib/supabase/loose";

export const dynamic = "force-dynamic";

const Params = z.object({ submissionId: z.string().uuid() });

export async function POST(req: Request, ctx: { params: Promise<{ submissionId: string }> }) {
  const rl = await ratelimit({ key: keyFromRequest(req, "match:score"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const { submissionId } = await ctx.params;
  if (!Params.safeParse({ submissionId }).success) return apiError("bad_request", "Invalid submission id");

  return withAuth(async (session) => {
    const denial = assertCapability(session, "marketplace:write");
    if (denial) return denial;

    const supabase = (await createClient()) as unknown as LooseSupabase;

    // Load submission + open call + talent profile in parallel.
    const { data: submission } = await supabase
      .from("open_call_submissions")
      .select("id, open_call_id, applicant_id, cover_note, submitted_at")
      .eq("id", submissionId)
      .maybeSingle();
    if (!submission) return apiError("not_found", "Submission not found");

    const [{ data: openCall }, { data: talentProfile }] = await Promise.all([
      supabase
        .from("open_calls")
        .select("title, description, requirements, genres, budget_min_cents, budget_max_cents, org_id")
        .eq("id", (submission as { open_call_id?: string }).open_call_id)
        .maybeSingle(),
      supabase
        .from("talent_profiles")
        .select("display_name, bio, genres, skills, location, rate_cents_per_day, rating_avg")
        .eq("user_id", (submission as { applicant_id?: string }).applicant_id)
        .maybeSingle(),
    ]);

    if (!openCall) return apiError("not_found", "Open call not found");
    // Guard: only the call-owning org can score submissions.
    if ((openCall as { org_id?: string }).org_id !== session.orgId) {
      return apiError("forbidden", "You can only score submissions for your own open calls");
    }

    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: `You are a talent booking analyst for a live events company. Score how well a talent submission matches an open call.

Respond with ONLY a JSON object: { "score": <0-100>, "rationale": "<max 200 chars>" }

Score breakdown:
- 90-100: Near-perfect match on genre, skills, rate, and location
- 70-89:  Strong match with minor gaps
- 50-69:  Moderate match; notable gaps
- 30-49:  Weak match; significant misalignment
- 0-29:   Poor fit`,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            open_call: {
              title: (openCall as { title?: string }).title,
              description: (openCall as { description?: string }).description,
              requirements: (openCall as { requirements?: unknown }).requirements,
              genres: (openCall as { genres?: unknown }).genres,
              budget_range_usd: openCall
                ? `$${(((openCall as { budget_min_cents?: number }).budget_min_cents ?? 0) / 100).toFixed(0)}–$${(((openCall as { budget_max_cents?: number }).budget_max_cents ?? 0) / 100).toFixed(0)}`
                : null,
            },
            applicant: talentProfile ?? { note: "No profile found" },
            cover_note: (submission as { cover_note?: string }).cover_note,
          }),
        },
      ],
    });

    const raw = message.content.find((b: { type: string; text?: string }) => b.type === "text")?.text ?? "{}";
    let score = 50;
    let rationale = "";
    try {
      const parsed = JSON.parse(raw.trim());
      score = Math.min(100, Math.max(0, Number(parsed.score) || 50));
      rationale = String(parsed.rationale ?? "").slice(0, 200);
    } catch {
      // fall through with defaults
    }

    const { data: updated, error } = await supabase
      .from("open_call_submissions")
      .update({
        match_score: score,
        match_rationale: rationale,
        match_scored_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select("id, match_score, match_rationale, match_scored_at")
      .single();

    if (error) return apiError("internal", error.message);

    return apiOk(updated);
  });
}
