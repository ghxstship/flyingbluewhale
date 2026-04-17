import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { getProject, updateProject } from "@/lib/db/projects";

const PatchProject = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["draft", "active", "paused", "archived", "complete"]).optional(),
  startDate: z.string().date().nullable().optional(),
  endDate: z.string().date().nullable().optional(),
});

export async function GET(_: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  return withAuth(async (session) => {
    const project = await getProject(session.orgId, projectId);
    if (!project) return apiError("not_found", "Project not found");
    return apiOk(project);
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const input = await parseJson(req, PatchProject);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    const project = await updateProject(session.orgId, projectId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.startDate !== undefined ? { start_date: input.startDate } : {}),
      ...(input.endDate !== undefined ? { end_date: input.endDate } : {}),
    });
    return apiOk(project);
  });
}
