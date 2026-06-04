import { type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { record as recordUsage } from "@/lib/usage";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * POST /api/v1/incidents/[id]/triage
 *
 * AI-powered incident risk categorisation and immediate action suggestions.
 * Writes back to incidents.ai_triage (JSONB) and incidents.ai_summary.
 *
 * Competitive source: Momentus/WeTrack AI-Powered Risk Functionality (Jan 2026).
 */

export type IncidentTriage = {
  severity_rec: "near_miss" | "minor" | "major" | "critical";
  category: string;
  confidence: "high" | "medium" | "low";
  risk_factors: string[];
  immediate_actions: string[];
  osha_likely_recordable: boolean;
  similar_patterns: string[];
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:incident-triage"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  return withAuth(async (session) => {
    const supabase = await createClient();

    const { data: incident } = await supabase
      .from("incidents")
      .select("id, summary, description, severity, location, occurred_at, osha_classification, body_part, injury_type, injury_source")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!incident) return apiError("not_found", "Incident not found");

    if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

    // Pull org's 5 most recent closed incidents for pattern matching context
    const { data: recentClosed } = await supabase
      .from("incidents")
      .select("summary, severity, osha_classification")
      .eq("org_id", session.orgId)
      .eq("status", "closed")
      .order("closed_at", { ascending: false })
      .limit(5);

    type ClosedIncident = { summary: string; severity: string; osha_classification: string | null };
    const prompt = `You are an ATLVS Technologies safety AI. Triage this live-event incident report.

INCIDENT:
Summary: ${incident.summary}
Description: ${incident.description ?? "none"}
Reporter severity: ${incident.severity}
Location: ${incident.location ?? "not specified"}
Occurred at: ${incident.occurred_at}
OSHA classification: ${incident.osha_classification ?? "none"}
Body part: ${incident.body_part ?? "none"}
Injury type: ${incident.injury_type ?? "none"}

RECENT CLOSED INCIDENTS (for pattern context):
${((recentClosed ?? []) as ClosedIncident[]).map((inc, n) => `${n + 1}. ${inc.severity} — ${inc.summary}`).join("\n") || "No history."}

Return JSON only (no markdown):
{
  "severity_rec": "near_miss|minor|major|critical",
  "category": "<short category e.g. 'Slip and fall', 'Equipment failure', 'Chemical exposure'>",
  "confidence": "high|medium|low",
  "risk_factors": ["<factor1>", "<factor2>"],
  "immediate_actions": ["<action1>", "<action2>", "<action3>"],
  "osha_likely_recordable": true|false,
  "similar_patterns": ["<observation about pattern match if any>"]
}`;

    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const inputTokens = msg.usage?.input_tokens ?? 0;
    const outputTokens = msg.usage?.output_tokens ?? 0;
    const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "{}";

    let triage: IncidentTriage;
    try {
      triage = JSON.parse(raw);
    } catch {
      return apiError("internal", "AI returned malformed triage JSON");
    }

    const aiSummary = `${triage.category} — ${triage.severity_rec} severity. ${triage.immediate_actions[0] ?? ""}`;

    await supabase
      .from("incidents")
      .update({
        ai_triage: triage,
        ai_triage_at: new Date().toISOString(),
        ai_triage_model: "claude-sonnet-4-6",
        ai_summary: aiSummary,
      })
      .eq("id", id)
      .eq("org_id", session.orgId);

    void Promise.all([
      recordUsage({ orgId: session.orgId, actorId: session.userId, metric: "ai.tokens.input", quantity: inputTokens, unit: "tokens", metadata: { feature: "incident_triage" } }),
      recordUsage({ orgId: session.orgId, actorId: session.userId, metric: "ai.tokens.output", quantity: outputTokens, unit: "tokens", metadata: { feature: "incident_triage" } }),
      recordUsage({ orgId: session.orgId, actorId: session.userId, metric: "ai.request", quantity: 1, unit: "count", metadata: { feature: "incident_triage" } }),
    ]);

    return apiOk({ triage, ai_summary: aiSummary });
  });
}
