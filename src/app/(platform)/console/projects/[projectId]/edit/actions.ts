"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateRangeRefine } from "@/lib/zod/dateRange";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const UUID = z.string().uuid();
const OPT_UUID = z.union([UUID, z.literal("")]).optional();

const Schema = z
  .object({
    name: z.string().min(1).max(200),
    project_state: z.string(),
    start_date: z.string().optional().or(z.literal("")),
    end_date: z.string().optional().or(z.literal("")),
    budget_cents: z.string().optional(),
    description: z.string().max(8000).optional().or(z.literal("")),
    client_id: OPT_UUID,
    primary_venue_id: OPT_UUID,
    geographic_scope: z.string().optional(),
    tour_structure: z.string().optional(),
    production_style: z.string().optional(),
  })
  // Sea Trial R2 FINDING-018: end_date must not precede start_date when
  // both are supplied.
  .refine(...dateRangeRefine("start_date", "end_date"));

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

type GeoScope = "local" | "regional" | "national" | "international";
type TourStructure = "single_stop" | "multi_stop_sequential" | "simultaneous_multi_city";
type ProductionStyle = "editorial" | "documentary" | "narrative" | "spectacle" | "intimate" | "brutalist";

export async function updateProject(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("projects", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    project_state: parsed.data.project_state as "draft" | "active" | "paused" | "archived" | "complete",
    start_date: parsed.data.start_date || null,
    end_date: parsed.data.end_date || null,
    budget_cents: parsed.data.budget_cents ? Number(parsed.data.budget_cents) : null,
    description: parsed.data.description || null,
    client_id: parsed.data.client_id || null,
    primary_venue_id: parsed.data.primary_venue_id || null,
    geographic_scope: (parsed.data.geographic_scope || null) as GeoScope | null,
    tour_structure: (parsed.data.tour_structure || null) as TourStructure | null,
    production_style: (parsed.data.production_style || null) as ProductionStyle | null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Project not found." };
  }
  revalidatePath(`/console/projects/${id}`);
  revalidatePath("/console/projects");
  redirect(`/console/projects/${id}`);
}

export async function deleteProject(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // Soft-delete. .is("deleted_at", null) so a re-click doesn't
  // re-stamp deleted_at on an already-tombstoned project (which
  // would extend the purge clock and confuse the audit trail of
  // when it was first deleted).
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not delete project: ${error.message}`);
  revalidatePath("/console/projects");
  redirect("/console/projects");
}
