import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** /api/v1/incidents — Opportunity #18. */

const PostSchema = z.object({
  projectId: z.string().uuid().optional(),
  summary: z.string().min(1).max(200),
  description: z.string().max(8000).optional(),
  severity: z.enum(["near_miss", "minor", "major", "critical"]).default("minor"),
  location: z.string().max(200).optional(),
  occurredAt: z.string().optional(),
  photos: z
    .array(z.object({ path: z.string().max(500), caption: z.string().max(200).optional() }))
    .default([]),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  return withAuth(async (session) => {
    const supabase = await createClient();
    let q = supabase
      .from("incidents")
      .select("id, project_id, summary, severity, status, occurred_at, location, reporter_id, created_at")
      .eq("org_id", session.orgId)
      .order("occurred_at", { ascending: false })
      .limit(500);
    if (projectId) q = q.eq("project_id", projectId);
    const { data, error } = await q;
    if (error) return apiError("internal", error.message);
    return apiOk({ incidents: data ?? [] });
  });
}

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("incidents")
      .insert({
        org_id: session.orgId,
        project_id: input.projectId ?? null,
        reporter_id: session.userId,
        summary: input.summary,
        description: input.description ?? null,
        severity: input.severity,
        location: input.location ?? null,
        occurred_at: input.occurredAt ?? new Date().toISOString(),
        photos: input.photos as never,
      })
      .select("id, summary, severity, occurred_at")
      .single();
    if (error) return apiError("internal", error.message);
    // Fan out to org admins — severity major/critical also triggers email.
    const { notifyOrgAdmins } = await import("@/lib/notify");
    await notifyOrgAdmins({
      orgId: session.orgId,
      eventType: "incident.filed",
      title: `Incident: ${input.summary}`,
      body: input.severity === "critical"
        ? "CRITICAL — review immediately"
        : `Severity: ${input.severity}${input.location ? ` · ${input.location}` : ""}`,
      href: `/console/operations/incidents/${data.id}`,
      data: { incidentId: data.id, severity: input.severity, projectId: input.projectId },
    });
    return apiCreated({ incident: data });
  });
}
