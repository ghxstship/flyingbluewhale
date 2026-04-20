import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { scanTicket } from "@/lib/db/tickets";

const ScanInput = z.object({
  code: z.string().min(1),
  location: z
    .object({ lat: z.number(), lng: z.number(), accuracy: z.number().optional() })
    .optional(),
});

export async function POST(req: Request) {
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
    if ((result as { result?: string } | null)?.result === "accepted") {
      const r = result as { ticketId?: string; holderName?: string | null };
      const { notify } = await import("@/lib/notify");
      await notify({
        orgId: session.orgId,
        userId: null, // broadcast — webhook-only
        eventType: "ticket.scanned",
        title: `Ticket scanned: ${r.holderName ?? r.ticketId?.slice(0, 8) ?? "unknown"}`,
        data: { ticketId: r.ticketId, scannerUserId: session.userId },
      });
    }
    return apiOk(result);
  });
}
