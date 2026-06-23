"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  day_rate_cents: z.string().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateCrewMember(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("crew_members", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    role: parsed.data.role || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    day_rate_cents: parsed.data.day_rate_cents ? Number(parsed.data.day_rate_cents) : null,
    notes: parsed.data.notes || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Crew Member not found." };
  }
  revalidatePath(`/studio/people/crew/${id}`);
  revalidatePath("/studio/people/crew");
  redirect(`/studio/people/crew/${id}`);
}

export async function deleteCrewMember(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("crew_members").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete crew member: ${error.message}`);
  revalidatePath("/studio/people/crew");
  redirect("/studio/people/crew");
}
