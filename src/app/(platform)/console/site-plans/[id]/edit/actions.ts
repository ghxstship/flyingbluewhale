"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(40),
  title: z.string().min(1).max(200),
  discipline: z.enum([
    "site",
    "rigging",
    "power",
    "audio",
    "video",
    "lighting",
    "comms",
    "evacuation",
    "hospitality",
    "accessibility",
    "sustainability",
    "other",
  ]),
  project_id: z.string().uuid().optional().or(z.literal("")),
  venue_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});

export type State = { error?: string; ok?: true } | null;

export async function updateSitePlan(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { id, ...patch } = parsed.data;

  // Cross-tenant FK guards on project_id + venue_id when reassigning.
  if (patch.project_id || patch.venue_id) {
    const supabase = await createClient();
    if (patch.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("id", patch.project_id)
        .eq("org_id", session.orgId)
        .is("deleted_at", null)
        .maybeSingle();
      if (!project) return { error: "Project not found in your organization" };
    }
    if (patch.venue_id) {
      const { data: venue } = await supabase
        .from("venues")
        .select("id")
        .eq("id", patch.venue_id)
        .eq("org_id", session.orgId)
        .maybeSingle();
      if (!venue) return { error: "Venue not found in your organization" };
    }
  }

  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("site_plans", session.orgId, id, expectedUpdatedAt, {
    code: patch.code,
    title: patch.title,
    discipline: patch.discipline,
    project_id: patch.project_id || null,
    venue_id: patch.venue_id || null,
    notes: patch.notes || null,
  } as never);
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Site Plan not found." };
  }
  revalidatePath(`/console/site-plans/${id}`);
  revalidatePath("/console/site-plans");
  redirect(`/console/site-plans/${id}`);
}
