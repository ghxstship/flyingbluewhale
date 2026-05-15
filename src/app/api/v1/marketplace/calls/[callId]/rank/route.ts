import Anthropic from "@anthropic-ai/sdk";
import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

type RankedSubmission = {
  submission_id: string;
  talent_handle: string | null;
  score: number;
  rationale: string;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ callId: string }> },
) {
  const { callId } = await params;

  const rl = await ratelimit({ key: keyFromRequest(req, "ai:rank"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY)
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();

  const { data: call } = await supabase
    .from("open_calls")
    .select("id, title, description, kind, genre_tags, trade_categories, region, fee_min_cents, fee_max_cents, currency")
    .eq("id", callId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  if (!call) return apiError("not_found", "Open call not found");

  const { data: submissions } = await supabase
    .from("open_call_submissions")
    .select("id, talent_profile_id, cover_note, created_at")
    .eq("open_call_id", callId)
    .limit(50);

  if (!submissions || submissions.length === 0) {
    return apiOk({ ranked: [], message: "No submissions to rank" });
  }

  const profileIds = submissions.map((s) => s.talent_profile_id).filter(Boolean) as string[];
  const { data: profiles } = await supabase
    .from("talent_profiles")
    .select("id, handle, bio, genre_tags, skills, location_city")
    .in("id", profileIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const callContext = [
    `Call: ${call.title} (${call.kind})`,
    call.description ? `Description: ${call.description}` : null,
    call.genre_tags?.length ? `Genres: ${call.genre_tags.join(", ")}` : null,
    call.trade_categories?.length ? `Trades: ${call.trade_categories.join(", ")}` : null,
    call.region ? `Region: ${call.region}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const submissionData = submissions.map((s) => {
    const p = profileMap[s.talent_profile_id ?? ""];
    return {
      id: s.id,
      handle: p?.handle ?? null,
      bio: p?.bio ?? null,
      genres: p?.genre_tags ?? [],
      skills: p?.skills ?? [],
      location: p?.location_city ?? null,
      cover_note: s.cover_note ?? null,
    };
  });

  const prompt = `You are a talent booking AI for a live-events production platform.
Score each submission 0–100 for fit against this open call. Return ONLY a JSON array.

Open call:
${callContext}

Submissions:
${JSON.stringify(submissionData, null, 2)}

Return:
[
  {
    "submission_id": "<id from input>",
    "talent_handle": "<handle or null>",
    "score": <0-100>,
    "rationale": "<1-2 sentences explaining the score>"
  }
]

Sort descending by score.`;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content.find((b) => b.type === "text")?.text ?? "";
  let ranked: RankedSubmission[];
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    ranked = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as RankedSubmission[];
  } catch {
    return apiError("internal", "AI returned malformed rankings; please try again");
  }

  return apiOk({ ranked });
}
