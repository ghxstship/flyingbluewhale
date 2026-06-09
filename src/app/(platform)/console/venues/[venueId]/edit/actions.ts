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
  kind: z.string(),
  cluster: z.string().max(120).optional().or(z.literal("")),
  capacity: z.string().optional(),
  handover_state: z.string(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateVenue(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("venues", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    kind: parsed.data.kind as "competition" | "training" | "live_site" | "ibc" | "mpc" | "village" | "support",
    cluster: parsed.data.cluster || null,
    capacity: parsed.data.capacity ? Number(parsed.data.capacity) : null,
    handover_state: parsed.data.handover_state as
      | "not_started"
      | "inspection"
      | "snag"
      | "sign_off"
      | "accepted"
      | "closeout",
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Venue not found." };
  }
  revalidatePath(`/console/venues/${id}`);
  revalidatePath("/console/venues");
  redirect(`/console/venues/${id}`);
}

export async function deleteVenue(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("venues").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete venue: ${error.message}`);
  revalidatePath("/console/venues");
  redirect("/console/venues");
}
