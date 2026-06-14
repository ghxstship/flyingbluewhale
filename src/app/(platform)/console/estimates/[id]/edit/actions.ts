"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";
import { ESTIMATE_STATES } from "@/lib/estimates";

const Schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  estimate_state: z.enum(ESTIMATE_STATES),
  default_markup_pct: z.string().optional().or(z.literal("")),
  default_waste_factor: z.string().optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateEstimate(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const markup = parsed.data.default_markup_pct ? Number(parsed.data.default_markup_pct) : 0;
  const waste = parsed.data.default_waste_factor ? Number(parsed.data.default_waste_factor) : 0;
  if (Number.isNaN(markup) || markup < 0) return { error: "Markup must be ≥ 0" };
  if (Number.isNaN(waste) || waste < 0) return { error: "Waste factor must be ≥ 0" };

  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("estimates", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    estimate_state: parsed.data.estimate_state,
    default_markup_pct: markup,
    default_waste_factor: waste,
    notes: parsed.data.notes || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Estimate not found." };
  }
  revalidatePath(`/console/estimates/${id}`);
  revalidatePath("/console/estimates");
  redirect(`/console/estimates/${id}`);
}

export async function deleteEstimate(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // SOFT delete to match the clients/projects pattern — preserves
  // historical pipeline reporting and the .is("deleted_at", null) guard
  // keeps the action idempotent. DeleteForm's undo flow restores it.
  const { error } = await supabase
    .from("estimates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not delete estimate: ${error.message}`);
  revalidatePath("/console/estimates");
  // No redirect — DeleteForm's undo flow navigates client-side.
}
