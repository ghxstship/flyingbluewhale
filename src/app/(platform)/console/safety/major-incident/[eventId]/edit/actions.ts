"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  name: z.string().min(1).max(200),
  status: z.string(),
  opened_at: z.string().optional().or(z.literal("")),
  closed_at: z.string().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateMajorIncident(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("major_incidents", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    status: parsed.data.status,
    opened_at: parsed.data.opened_at,
    closed_at: parsed.data.closed_at || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Major Incident not found." };
  }
  revalidatePath(`/console/safety/major-incident/${id}`);
  revalidatePath("/console/safety/major-incident");
  redirect(`/console/safety/major-incident/${id}`);
}

export async function deleteMajorIncident(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("major_incidents").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete major incident: ${error.message}`);
  revalidatePath("/console/safety/major-incident");
  redirect("/console/safety/major-incident");
}
