import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { hasSupabase } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

// AI Auto-Scheduler — given a shift requirement (role, date range, headcount),
// returns a ranked list of available crew members with AI reasoning.
// Competes with Deputy AI Labour Optimisation and Connecteam AI auto-scheduler.

const Schema = z.object({
  role: z.string().max(200).optional(),
  from_date: z.string().datetime({ offset: true }),
  to_date: z.string().datetime({ offset: true }),
  headcount: z.number().int().min(1).max(100).default(1),
  project_id: z.string().uuid().optional(),
  required_credential_kinds: z.array(z.string()).max(10).optional(),
});

type CrewRow = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  notes: string | null;
};

export async function POST(req: Request) {
  if (!hasSupabase) return apiError("service_unavailable", "Supabase is not configured");
  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const rl = await ratelimit({ key: keyFromRequest(req, "ai:schedule"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "Rate limit reached; try again shortly");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    const denial = assertCapability(session, "shifts:write");
    if (denial) return denial;

    const supabase = await createClient();

    const from = new Date(input.from_date);
    const to = new Date(input.to_date);

    // Pull all active crew members for the org
    let crewQ = supabase
      .from("crew_members")
      .select("id, name, email, role, notes")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .limit(200);
    if (input.role) crewQ = crewQ.ilike("role", `%${input.role}%`);
    const { data: allCrew, error: crewError } = await crewQ;
    if (crewError) return apiError("internal", crewError.message);

    const crew = (allCrew ?? []) as CrewRow[];
    if (!crew.length) return apiOk({ suggestions: [], reasoning: "No crew members found for this org." });

    // Find crew already scheduled during the requested window
    const { data: conflictingShifts } = await supabase
      .from("shifts")
      .select("workforce_member_id, starts_at, ends_at")
      .eq("org_id", session.orgId)
      .lt("starts_at", to.toISOString())
      .gt("ends_at", from.toISOString());

    const busyCrewIds = new Set(
      (conflictingShifts ?? [])
        .map((s: { workforce_member_id: string }) => s.workforce_member_id)
        .filter(Boolean),
    );

    // Cross-reference crew_members → workforce_members to find conflicts.
    // A crew member may not have a workforce_member row, which means no
    // conflict info — we include them conservatively.
    const { data: wmLinks } = await supabase
      .from("workforce_members")
      .select("id, crew_member_id")
      .eq("org_id", session.orgId)
      .in(
        "crew_member_id",
        crew.map((c) => c.id),
      );

    const crewToWfmMap = new Map(
      (wmLinks ?? []).map((w: { id: string; crew_member_id: string }) => [w.crew_member_id, w.id]),
    );

    const availableCrew = crew.filter((c) => {
      const wfmId = crewToWfmMap.get(c.id);
      return !wfmId || !busyCrewIds.has(wfmId);
    });

    if (!availableCrew.length) {
      return apiOk({
        suggestions: [],
        reasoning: `All ${crew.length} crew members matching the role filter have conflicts in this window.`,
      });
    }

    // Time-off exclusions
    const { data: timeOffRows } = await supabase
      .from("time_off_requests")
      .select("user_id, starts_on, ends_on, state")
      .eq("org_id", session.orgId)
      .eq("state", "approved")
      .lte("starts_on", to.toISOString().slice(0, 10))
      .gte("ends_on", from.toISOString().slice(0, 10));

    const onTimeOff = new Set((timeOffRows ?? []).map((r: { user_id: string }) => r.user_id));

    // Credential filter — only require credential holders if specified
    let credentialedCrewIds: Set<string> | null = null;
    if (input.required_credential_kinds?.length) {
      const { data: credRows } = await supabase
        .from("credentials")
        .select("crew_member_id, kind")
        .eq("org_id", session.orgId)
        .in("kind", input.required_credential_kinds)
        .gt("expires_at", new Date().toISOString());
      const holders = new Set<string>((credRows ?? []).map((c: { crew_member_id: string }) => c.crew_member_id));
      credentialedCrewIds = holders;
    }

    const finalCandidates = availableCrew.filter((c) => {
      if (onTimeOff.has(c.id)) return false;
      if (credentialedCrewIds && !credentialedCrewIds.has(c.id)) return false;
      return true;
    });

    if (!finalCandidates.length) {
      return apiOk({
        suggestions: [],
        reasoning:
          "No crew available after applying time-off and credential filters. Check individual availability or relax credential requirements.",
      });
    }

    // Use AI to rank and explain the top candidates
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const prompt = `You are an expert crew scheduler for a live events production company.

Shift requirement:
- Role needed: ${input.role ?? "any"}
- Window: ${from.toLocaleDateString()} – ${to.toLocaleDateString()}
- Headcount needed: ${input.headcount}
- Project ID: ${input.project_id ?? "unspecified"}

Available crew (${finalCandidates.length} members, already filtered for conflicts and time-off):
${JSON.stringify(finalCandidates.slice(0, 50), null, 2)}

Pick the top ${Math.min(input.headcount + 2, finalCandidates.length)} candidates. Return JSON only:
{
  "ranked": [
    { "crew_member_id": "...", "name": "...", "reason": "one sentence why this person is a strong fit" }
  ],
  "summary": "one sentence overall scheduling assessment"
}`;

    const aiResp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = aiResp.content[0]?.type === "text" ? aiResp.content[0].text : "";
    let ranked: { crew_member_id: string; name: string; reason: string }[] = [];
    let summary = "";
    try {
      const parsed = JSON.parse(raw.replace(/^```json?\s*/i, "").replace(/```$/, "").trim()) as {
        ranked: typeof ranked;
        summary: string;
      };
      ranked = parsed.ranked ?? [];
      summary = parsed.summary ?? "";
    } catch {
      // AI returned non-JSON — fall back to the list order with no reasoning
      ranked = finalCandidates.slice(0, input.headcount + 2).map((c) => ({
        crew_member_id: c.id,
        name: c.name,
        reason: "Available and role-matched.",
      }));
      summary = `${finalCandidates.length} crew members are available for this window.`;
    }

    return apiOk({
      suggestions: ranked,
      available_count: finalCandidates.length,
      total_crew: crew.length,
      reasoning: summary,
    });
  });
}
