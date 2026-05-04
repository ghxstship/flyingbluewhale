"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional().or(z.literal("")),
  estimated_cents: z.string().optional(),
  status: z.string(),
});

export type State = { error?: string } | null;

export async function updateRequisition(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("requisitions", session.orgId, id, expectedUpdatedAt, {
    title: parsed.data.title,
    description: parsed.data.description || null,
    estimated_cents: parsed.data.estimated_cents ? Number(parsed.data.estimated_cents) : null,
    status: parsed.data.status as "draft" | "submitted" | "approved" | "rejected" | "converted",
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Requisition not found." };
  }
  revalidatePath(`/console/procurement/requisitions/${id}`);
  revalidatePath("/console/procurement/requisitions");
  redirect(`/console/procurement/requisitions/${id}`);
}

export async function deleteRequisition(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("requisitions").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/procurement/requisitions");
  redirect("/console/procurement/requisitions");
}
