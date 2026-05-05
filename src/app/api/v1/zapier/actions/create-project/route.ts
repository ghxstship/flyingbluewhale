import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { toZapierProject } from "@/lib/integrations/zapier/payloads";
import { createClient } from "@/lib/supabase/server";

/**
 * Zapier action — creates a project in the caller's org. Slug is
 * normalised so a Zap can pass `name` alone and still get a sane URL.
 */
export const dynamic = "force-dynamic";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const Schema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(48)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, digits, and dashes only")
    .optional(),
  description: z.string().max(2000).optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
});

export async function POST(req: NextRequest) {
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .insert({
        org_id: session.orgId,
        slug: input.slug ?? slugify(input.name),
        name: input.name,
        description: input.description ?? null,
        start_date: input.start_date ?? null,
        end_date: input.end_date ?? null,
        created_by: session.userId,
      })
      .select("id, name, slug, status, description, start_date, end_date, created_at, updated_at")
      .single();
    if (error) {
      if (error.message.includes("duplicate")) return apiError("conflict", "Project slug already exists");
      return apiError("internal", error.message);
    }
    return apiCreated(toZapierProject(data));
  });
}
