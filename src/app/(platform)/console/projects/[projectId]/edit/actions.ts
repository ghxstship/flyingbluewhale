"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateRangeRefine } from "@/lib/zod/dateRange";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z
  .object({
    name: z.string().min(1).max(200),
    status: z.string(),
    start_date: z.string().optional().or(z.literal("")),
    end_date: z.string().optional().or(z.literal("")),
    budget_cents: z.string().optional(),
    description: z.string().max(8000).optional().or(z.literal("")),
  })
  // Sea Trial R2 FINDING-018: end_date must not precede start_date when
  // both are supplied.
  .refine(...dateRangeRefine("start_date", "end_date"));

export type State = { error?: string } | null;

export async function updateProject(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("projects", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    status: parsed.data.status as "draft" | "active" | "paused" | "archived" | "complete",
    start_date: parsed.data.start_date || null,
    end_date: parsed.data.end_date || null,
    budget_cents: parsed.data.budget_cents ? Number(parsed.data.budget_cents) : null,
    description: parsed.data.description || null,
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
  await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  revalidatePath("/console/projects");
  redirect("/console/projects");
}
