import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { scanTicket } from "@/lib/db/tickets";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const ScanInput = z.object({
  code: z.string().min(1),
  location: z.object({ lat: z.number(), lng: z.number(), accuracy: z.number().optional() }).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  // Field scanning runs hot — 120/min per scanner is the documented budget.
  // Per-principal so a single malfunctioning scanner can't drown the system,
  // but stays well clear of legitimate gate-rush throughput.
  const rl = await ratelimit({
    key: keyFromRequest(req, "scan:ticket"),
    ...RATE_BUDGETS.scan,
  });
  if (!rl.ok) return apiError("rate_limited", "Scan budget exceeded; pause and retry");

  await ctx.params; // id route param accepted but scan goes by code
  const input = await parseJson(req, ScanInput);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denial = assertCapability(session, "check-in:write");
    if (denial) return denial;
    const result = await scanTicket({
      orgId: session.orgId,
      scannerUserId: session.userId,
      code: input.code,
      location: input.location,
    });
    return apiOk(result);
  });
}
