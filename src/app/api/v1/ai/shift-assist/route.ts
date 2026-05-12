import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { ratelimit, keyFromRequest, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  projectId: z.string().uuid(),
  shiftDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  role: z.string().min(1).max(100).optional(),
  gapDescription: z.string().min(1).max(2000).optional(),
});

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:shift-assist"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();

  // Load project
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, xpms_phase")
    .eq("id", input.projectId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!project) return apiError("not_found", "Project not found");

  // Load crew members with their availability context
  const { data: crewRows } = await supabase
    .from("crew_members")
    .select("id, full_name, role, email, phone, skills, notes")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .limit(200);

  // Load time entries for the shift date to detect conflicts
  const dayStart = `${input.shiftDate}T00:00:00Z`;
  const dayEnd = `${input.shiftDate}T23:59:59Z`;
  const { data: busyEntries } = await supabase
    .from("time_entries")
    .select("crew_member_id, clock_in, clock_out, project_id")
    .gte("clock_in", dayStart)
    .lte("clock_in", dayEnd)
    .eq("org_id", session.orgId);

  // Load time-off requests for the date
  const { data: timeOffRows } = await supabase
    .from("time_off_requests")
    .select("user_id, start_date, end_date, status")
    .lte("start_date", input.shiftDate)
    .gte("end_date", input.shiftDate)
    .in("status", ["approved", "pending"])
    .eq("org_id", session.orgId);

  const busyCrewIds = new Set((busyEntries ?? []).map((e) => e.crew_member_id).filter(Boolean));
  const offUserIds = new Set((timeOffRows ?? []).map((r) => r.user_id).filter(Boolean));

  const crew = (crewRows ?? []) as Array<{
    id: string;
    full_name: string | null;
    role: string | null;
    email: string | null;
    skills: string[] | null;
  }>;

  const available = crew.filter((c) => !busyCrewIds.has(c.id) && !offUserIds.has(c.id));
  const unavailable = crew.filter((c) => busyCrewIds.has(c.id) || offUserIds.has(c.id));

  const prompt = `You are the LYTEHAUS Technologies AI scheduling assistant for live-event production crews.

PROJECT: "${project.name}" (phase: ${project.xpms_phase ?? "unknown"})
SHIFT DATE: ${input.shiftDate}
${input.role ? `OPEN ROLE: ${input.role}` : ""}
${input.gapDescription ? `GAP DESCRIPTION: ${input.gapDescription}` : ""}

AVAILABLE CREW (${available.length}):
${available.map((c) => `- ${c.full_name ?? c.email ?? c.id} | role: ${c.role ?? "—"} | skills: ${(c.skills ?? []).join(", ") || "—"}`).join("\n")}

UNAVAILABLE CREW (${unavailable.length} — already booked or on time-off):
${unavailable.map((c) => `- ${c.full_name ?? c.email ?? c.id} | role: ${c.role ?? "—"}`).join("\n")}

Tasks:
1. Recommend the TOP 3 crew members from the AVAILABLE list who best fit the open role/gap. Rank by skill match and role alignment.
2. For each recommendation, explain in one sentence WHY they're the best fit.
3. Flag any risks (e.g. skill gap, no one matches, low coverage).
4. If the gap is critical and no one matches, suggest external options (freelancer hire, vendor call-out).
5. Keep the total response under 300 words. Use bullet points. Be direct.`;

  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const s = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const event of s) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }

        controller.enqueue(
          encoder.encode(
            `event: done\ndata: ${JSON.stringify({
              availableCount: available.length,
              unavailableCount: unavailable.length,
            })}\n\n`,
          ),
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Stream failed";
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
    },
  });
}
