import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { scanTicket } from "@/lib/db/tickets";

const ScanInput = z.object({
  code: z.string().min(1),
  location: z
    .object({ lat: z.number(), lng: z.number(), accuracy: z.number().optional() })
    .optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ctx.params; // id route param accepted but scan goes by code
  const input = await parseJson(req, ScanInput);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const result = await scanTicket({
      orgId: session.orgId,
      scannerUserId: session.userId,
      code: input.code,
      location: input.location,
    });
    return apiOk(result);
  });
}
