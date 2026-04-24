import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";


/** /api/v1/crisis/alerts — mass-notify (WF-252). */

const PostSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
  severity: z.enum(["info", "warn", "critical"]).default("info"),
  channels: z.array(z.enum(["push", "sms", "email"])).default(["push"]),
  audience: z
    .object({
      roles: z.array(z.string()).optional(),
      venues: z.array(z.string()).optional(),
      personas: z.array(z.string()).optional(),
    })
    .default({}),
  scheduledAt: z.string().optional(),
});

export async function GET() {
  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("crisis_alerts")
      .select("id, title, severity, channels, sent_at, created_at")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return apiError("internal", error.message);
    return apiOk({ alerts: data ?? [] });
  });
}

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("crisis_alerts")
      .insert({
        org_id: session.orgId,
        title: input.title,
        body: input.body,
        severity: input.severity,
        channels: input.channels,
        audience: input.audience,
        scheduled_at: input.scheduledAt ?? null,
        created_by: session.userId,
      })
      .select("id, title, severity, created_at")
      .single();
    if (error) return apiError("internal", error.message);
    return apiCreated({ alert: data });
  });
}
