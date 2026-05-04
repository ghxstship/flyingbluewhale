"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  kind: z.string().min(1).max(80),
  status: z.string(),
  note: z.string().max(2000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateAccreditationChange(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("accreditation_changes", session.orgId, id, expectedUpdatedAt, {
    kind: parsed.data.kind,
    status: parsed.data.status,
    note: parsed.data.note || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Accreditation Change not found." };
  }
  revalidatePath(`/console/accreditation/changes/${id}`);
  revalidatePath("/console/accreditation/changes");
  redirect(`/console/accreditation/changes/${id}`);
}

export async function deleteAccreditationChange(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("accreditation_changes").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/accreditation/changes");
  redirect("/console/accreditation/changes");
}
