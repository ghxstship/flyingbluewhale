"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  title: z.string().min(1).max(200),
  quantity: z.string().optional(),
  delivered: z.string().optional(),
  status: z.string(),
  due_by: z.string().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateSponsorEntitlement(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("sponsor_entitlements", session.orgId, id, expectedUpdatedAt, {
    title: parsed.data.title,
    quantity: parsed.data.quantity ? Number(parsed.data.quantity) : 0,
    delivered: parsed.data.delivered ? Number(parsed.data.delivered) : 0,
    status: parsed.data.status,
    due_by: parsed.data.due_by || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Sponsor Entitlement not found." };
  }
  revalidatePath(`/console/commercial/sponsors/${id}`);
  revalidatePath("/console/commercial/sponsors");
  redirect(`/console/commercial/sponsors/${id}`);
}

export async function deleteSponsorEntitlement(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("sponsor_entitlements").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete sponsor entitlement: ${error.message}`);
  revalidatePath("/console/commercial/sponsors");
  redirect("/console/commercial/sponsors");
}
