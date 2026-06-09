"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  full_name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  role: z.string().max(120).optional().or(z.literal("")),
  kind: z.string(),
});

export type State = { error?: string } | null;

export async function updateStaffMember(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("workforce_members", session.orgId, id, expectedUpdatedAt, {
    full_name: parsed.data.full_name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    role: parsed.data.role || null,
    kind: parsed.data.kind as "paid_staff" | "volunteer" | "contractor" | "official",
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Workforce Member not found." };
  }
  revalidatePath(`/console/workforce/staff/${id}`);
  revalidatePath("/console/workforce/staff");
  redirect(`/console/workforce/staff/${id}`);
}

export async function deleteStaffMember(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("workforce_members").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete workforce member: ${error.message}`);
  revalidatePath("/console/workforce/staff");
  redirect("/console/workforce/staff");
}
