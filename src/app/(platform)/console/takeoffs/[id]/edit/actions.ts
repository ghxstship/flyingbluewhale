"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  unit: z.string().min(1).max(16),
  site_plan_id: z.string().uuid().optional().or(z.literal("")),
  cost_code_id: z.string().uuid().optional().or(z.literal("")),
  calibration_in_per_ft: z.string().optional(),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateTakeoff(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const calibration = parsed.data.calibration_in_per_ft ? Number(parsed.data.calibration_in_per_ft) : null;
  if (calibration != null && (Number.isNaN(calibration) || calibration <= 0)) {
    return { error: "Calibration must be a positive number" };
  }

  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("takeoffs", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    unit: parsed.data.unit,
    site_plan_id: parsed.data.site_plan_id || null,
    cost_code_id: parsed.data.cost_code_id || null,
    calibration_in_per_ft: calibration,
    notes: parsed.data.notes || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Takeoff not found." };
  }
  revalidatePath(`/console/takeoffs/${id}`);
  revalidatePath("/console/takeoffs");
  redirect(`/console/takeoffs/${id}`);
}

export async function deleteTakeoff(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // Soft delete to match the takeoffs list filter (.is("deleted_at", null))
  // and the clients/projects pattern. The .is("deleted_at", null) guard
  // below keeps the action idempotent.
  const { error } = await supabase
    .from("takeoffs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not update takeoff: ${error.message}`);
  revalidatePath("/console/takeoffs");
  // No redirect — DeleteForm's undo flow navigates client-side after
  // showing the "Deleted" toast with its Undo action (REC-14).
}
