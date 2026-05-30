import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { generateCourse } from "@/lib/ai/generate-course";

export const dynamic = "force-dynamic";

const Schema = z.object({
  topic: z.string().min(3).max(300),
  target_role: z.string().max(80).optional(),
  duration_minutes: z.number().min(10).max(480).optional(),
});

export async function POST(req: Request) {
  return withAuth(async () => {
    const body = await parseJson(req, Schema);
    if (body instanceof Response) return body;

    const result = await generateCourse({
      topic: body.topic,
      target_role: body.target_role,
      duration_minutes: body.duration_minutes,
    });

    if ("error" in result) {
      return apiError("internal", result.error);
    }

    return apiOk({ course: result });
  });
}
