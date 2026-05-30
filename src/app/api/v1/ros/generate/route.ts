import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { generateRos } from "@/lib/ai/generate-ros";

export const dynamic = "force-dynamic";

const Schema = z.object({
  event_name: z.string().min(2).max(200),
  event_type: z.string().min(2).max(100),
  start_time: z.string(),
  duration_hours: z.number().min(0.5).max(24),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  return withAuth(async () => {
    const body = await parseJson(req, Schema);
    if (body instanceof Response) return body;

    const result = await generateRos({
      event_name: body.event_name,
      event_type: body.event_type,
      start_time: body.start_time,
      duration_hours: body.duration_hours,
      notes: body.notes,
    });

    if ("error" in result) {
      return apiError("internal", result.error);
    }

    return apiOk({ ros: result });
  });
}
