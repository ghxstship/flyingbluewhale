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
    description: z.string().max(4000).optional().or(z.literal("")),
    starts_at: z.string().optional().or(z.literal("")),
    ends_at: z.string().optional().or(z.literal("")),
    status: z.string(),
  })
  // Sea Trial R2 FINDING-018: when both supplied, end must follow start.
  .refine(...dateRangeRefine("starts_at", "ends_at"));

export type State = { error?: string } | null;

export async function updateCeremony(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("events", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    description: parsed.data.description || null,
    starts_at: parsed.data.starts_at,
    ends_at: parsed.data.ends_at,
    status: parsed.data.status as "draft" | "scheduled" | "live" | "complete" | "cancelled",
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Event not found." };
  }
  revalidatePath(`/console/programs/ceremonies/${id}`);
  revalidatePath("/console/programs/ceremonies");
  redirect(`/console/programs/ceremonies/${id}`);
}

export async function deleteCeremony(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete event: ${error.message}`);
  revalidatePath("/console/programs/ceremonies");
  redirect("/console/programs/ceremonies");
}
