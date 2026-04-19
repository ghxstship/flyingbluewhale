import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createProject, listProjects } from "@/lib/db/projects";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

const CreateProject = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  slug: z.string().min(1).max(48).regex(/^[a-z0-9-]+$/).optional(),
});

export async function GET() {
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const projects = await listProjects(session.orgId);
    return apiOk({ orgId: session.orgId, projects });
  });
}

export async function POST(req: Request) {
  const input = await parseJson(req, CreateProject);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;
    try {
      const project = await createProject({
        orgId: session.orgId,
        slug: input.slug ?? slugify(input.name),
        name: input.name,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
        createdBy: session.userId,
      });
      return apiCreated(project);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not create project";
      if (msg.includes("duplicate")) return apiError("conflict", "Project slug already exists");
      return apiError("internal", msg);
    }
  });
}
