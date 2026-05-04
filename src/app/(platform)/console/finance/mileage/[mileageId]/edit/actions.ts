"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  origin: z.string().min(1).max(200),
  destination: z.string().min(1).max(200),
  miles: z.string().optional(),
  rate_cents: z.string().optional(),
  logged_on: z.string().min(1),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateMileage(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("mileage_logs", session.orgId, id, expectedUpdatedAt, {
    origin: parsed.data.origin,
    destination: parsed.data.destination,
    miles: parsed.data.miles ? Number(parsed.data.miles) : 0,
    rate_cents: parsed.data.rate_cents ? Number(parsed.data.rate_cents) : 0,
    logged_on: parsed.data.logged_on,
    notes: parsed.data.notes || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Mileage Log not found." };
  }
  revalidatePath(`/console/finance/mileage/${id}`);
  revalidatePath("/console/finance/mileage");
  redirect(`/console/finance/mileage/${id}`);
}

export async function deleteMileage(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("mileage_logs").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/finance/mileage");
  redirect("/console/finance/mileage");
}
