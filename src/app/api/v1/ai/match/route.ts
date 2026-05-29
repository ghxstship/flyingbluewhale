import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  submission_id: z.string().uuid(),
  call_id: z.string().uuid(),
});

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:match"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();

  // Fetch the open call (must belong to caller's org)
  const { data: callData } = await supabase
    .from("open_calls")
    .select("id, title, description, kind, genre_tags, trade_categories, region, fee_min_cents, fee_max_cents, currency")
    .eq("id", input.call_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!callData) return apiError("not_found", "Open call not found");

  // Fetch the submission (must belong to the same call and org)
  const { data: subData } = await supabase
    .from("open_call_submissions")
    .select("id, submitter_user_id, cover_note, fee_proposed_cents, submitted_at")
    .eq("id", input.submission_id)
    .eq("open_call_id", input.call_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!subData) return apiError("not_found", "Submission not found");

  const call = callData as typeof callData & {
    title: string;
    description: string | null;
    kind: string;
    genre_tags: string[];
    trade_categories: string[];
    region: string | null;
    fee_min_cents: number | null;
    fee_max_cents: number | null;
    currency: string;
  };
  const sub = subData as typeof subData & {
    cover_note: string | null;
    fee_proposed_cents: number | null;
  };

  const feeContext =
    call.fee_min_cents || call.fee_max_cents
      ? `Budget: ${call.fee_min_cents ? `$${(call.fee_min_cents / 100).toFixed(0)}` : "open"}–${call.fee_max_cents ? `$${(call.fee_max_cents / 100).toFixed(0)}` : "open"} ${call.currency}`
      : "Budget: not specified";

  const proposedFee = sub.fee_proposed_cents
    ? `Proposed fee: $${(sub.fee_proposed_cents / 100).toFixed(0)} ${call.currency}`
    : "Proposed fee: not specified";

  const prompt = `You are an expert talent booker for a premium live-events company. Score how well this submission matches the open call requirements.

OPEN CALL:
Title: ${call.title}
Type: ${call.kind}
Description: ${call.description ?? "Not provided"}
Genres/Categories: ${[...(call.genre_tags ?? []), ...(call.trade_categories ?? [])].join(", ") || "Any"}
Region: ${call.region ?? "Any"}
${feeContext}

SUBMISSION COVER NOTE:
${sub.cover_note ?? "No cover note provided."}
${proposedFee}

Respond with valid JSON only:
{
  "score": <number 0-100>,
  "notes": "<2-3 sentence rationale: strengths, gaps, fit for this specific call>"
}

Scoring guide: 90–100 = exceptional match, 70–89 = strong fit, 50–69 = partial fit / worth reviewing, 30–49 = weak fit, 0–29 = poor match. Be direct and specific.`;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let scoreJson: string;
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });
    const block = msg.content[0];
    scoreJson = block.type === "text" ? block.text.trim() : "{}";
    scoreJson = scoreJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Anthropic error";
    return apiError("internal", msg);
  }

  let parsed: { score: number; notes: string };
  try {
    parsed = JSON.parse(scoreJson) as { score: number; notes: string };
    if (typeof parsed.score !== "number" || parsed.score < 0 || parsed.score > 100) {
      throw new Error("score out of range");
    }
  } catch {
    return apiError("internal", "AI returned malformed match score");
  }

  const { error } = await supabase
    .from("open_call_submissions")
    .update({
      ai_match_score: Math.round(parsed.score * 10) / 10,
      ai_match_notes: parsed.notes,
    })
    .eq("id", input.submission_id)
    .eq("org_id", session.orgId);

  if (error) return apiError("internal", error.message);

  return apiOk({
    submission_id: input.submission_id,
    ai_match_score: Math.round(parsed.score * 10) / 10,
    ai_match_notes: parsed.notes,
  });
}
