import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rankCandidates, type CrewCandidate } from "@/lib/crew/scoring";

const Schema = z.object({
  // shift definition for availability + policy checking
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  // optional: only return crew who hold these credential types
  required_credential_types: z.array(z.string()).default([]),
  // optional: limit results
  limit: z.number().int().min(1).max(100).default(20),
});

export async function POST(req: Request) {
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();

  // 1. Fetch all active crew members for this org.
  const { data: crew, error: crewErr } = await supabase
    .from("crew_members")
    .select("id, name, roles")
    .eq("org_id", session.orgId)
    .is("deleted_at", null);

  if (crewErr) return apiError("internal", crewErr.message);

  // 2. Fetch composite performance scores for these crew members.
  const crewIds = (crew ?? []).map((c) => c.id);
  const { data: scores } = await supabase
    .from("crew_performance_scores")
    .select("crew_member_id, score")
    .eq("org_id", session.orgId)
    .eq("score_kind", "composite")
    .is("project_id", null)
    .in("crew_member_id", crewIds);

  const scoreMap = new Map((scores ?? []).map((s) => [s.crew_member_id, s.score as number]));

  // 3. Build candidate list.
  // Availability and credential checks are simplified here — a production
  // implementation would cross-reference shifts and credentials tables.
  const candidates: CrewCandidate[] = (crew ?? []).map((c) => ({
    crew_member_id: c.id,
    composite_score: scoreMap.get(c.id),
    is_available: true, // TODO: cross-ref shifts for actual availability
    holds_required_credentials:
      input.required_credential_types.length === 0 ? true : true, // TODO: credentials check
  }));

  const ranked = rankCandidates(candidates).slice(0, input.limit);

  // 4. Enrich with crew member names.
  const crewById = new Map((crew ?? []).map((c) => [c.id, c]));
  const enriched = ranked.map((r) => ({
    ...r,
    name: crewById.get(r.crew_member_id)?.name ?? "Unknown",
  }));

  return apiOk(enriched);
}
