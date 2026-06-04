import { type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { record as recordUsage } from "@/lib/usage";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * GET /api/v1/marketplace/calls/[callId]/insights
 *   Returns aggregated submission stats + cached AI market intelligence.
 *
 * POST /api/v1/marketplace/calls/[callId]/insights
 *   (Re-)generates AI commentary on the applicant pool and caches it on
 *   open_calls.ai_market_intelligence.
 *
 * Competitive source: GigSalad Lead Insights (March 2025).
 */

export async function GET(req: NextRequest, { params }: { params: Promise<{ callId: string }> }) {
  const { callId } = await params;
  return withAuth(async (session) => {
    const supabase = await createClient();

    const { data: call } = await supabase
      .from("open_calls")
      .select("id, title, kind, status, deadline_at, ai_market_intelligence, ai_market_intelligence_at")
      .eq("id", callId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!call) return apiError("not_found", "Open call not found");

    const { data: stats, error } = await supabase.rpc("open_call_stats", { p_call_id: callId });
    if (error) return apiError("internal", error.message);

    return apiOk({
      call: {
        id: call.id,
        title: call.title,
        kind: call.kind,
        status: call.status,
        deadline_at: call.deadline_at,
      },
      stats: stats ?? {},
      ai_market_intelligence: call.ai_market_intelligence ?? null,
      ai_market_intelligence_at: call.ai_market_intelligence_at ?? null,
    });
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ callId: string }> }) {
  const { callId } = await params;
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:call-insights"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  return withAuth(async (session) => {
    const supabase = await createClient();

    const { data: call } = await supabase
      .from("open_calls")
      .select("id, title, kind, deadline_at, submission_count, fee_min_cents, fee_max_cents, currency")
      .eq("id", callId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!call) return apiError("not_found", "Open call not found");

    const { data: stats } = await supabase.rpc("open_call_stats", { p_call_id: callId });

    if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

    const prompt = `You are an ATLVS Technologies marketplace analyst. Analyze this open call's applicant pool and provide operator-grade insight.

Call: "${call.title}" (kind: ${call.kind})
Deadline: ${call.deadline_at ?? "none set"}
Submissions: ${JSON.stringify(stats ?? {})}

Return 2–3 sentences (plain text, no JSON) covering:
1. Pool quality signal (volume, score spread, fee alignment)
2. Whether the operator should act now (shortlist, extend deadline, adjust fee band)
3. One specific recommendation

Be direct and production-ops toned.`;

    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const intelligence = msg.content[0]?.type === "text" ? msg.content[0].text : "";
    const inputTokens = msg.usage?.input_tokens ?? 0;
    const outputTokens = msg.usage?.output_tokens ?? 0;

    await supabase
      .from("open_calls")
      .update({ ai_market_intelligence: intelligence, ai_market_intelligence_at: new Date().toISOString() })
      .eq("id", callId)
      .eq("org_id", session.orgId);

    void Promise.all([
      recordUsage({ orgId: session.orgId, actorId: session.userId, metric: "ai.tokens.input", quantity: inputTokens, unit: "tokens", metadata: { feature: "call_insights" } }),
      recordUsage({ orgId: session.orgId, actorId: session.userId, metric: "ai.tokens.output", quantity: outputTokens, unit: "tokens", metadata: { feature: "call_insights" } }),
      recordUsage({ orgId: session.orgId, actorId: session.userId, metric: "ai.request", quantity: 1, unit: "count", metadata: { feature: "call_insights" } }),
    ]);

    return apiOk({ ai_market_intelligence: intelligence, stats: stats ?? {} });
  });
}
