"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents } from "@/lib/format";
import { dateRangeRefine } from "@/lib/zod/dateRange";

const Schema = z
  .object({
    equipment_id: z.string().uuid(),
    starts_at: z.string().min(1),
    ends_at: z.string().min(1),
    project_id: z.string().uuid().optional().or(z.literal("")),
    rate: z.string().optional(),
  })
  // Sea Trial R2 FINDING-018: a rental can't end before it starts.
  .refine(...dateRangeRefine("starts_at", "ends_at"));

export type State = { error?: string } | null;

export async function createRentalAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();

  // Cross-tenant FK guards on equipment_id + project_id.
  const { data: equipment } = await supabase
    .from("equipment")
    .select("id")
    .eq("id", parsed.data.equipment_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!equipment) return { error: "Equipment not found in your organization" };
  if (parsed.data.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", parsed.data.project_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization" };
  }

  const { error } = await supabase.from("rentals").insert({
    org_id: session.orgId,
    equipment_id: parsed.data.equipment_id,
    starts_at: new Date(parsed.data.starts_at).toISOString(),
    ends_at: new Date(parsed.data.ends_at).toISOString(),
    project_id: parsed.data.project_id || null,
    rate_cents: parsed.data.rate ? dollarsToCents(parsed.data.rate) : null,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/production/rentals");
  redirect("/console/production/rentals");
}

/**
 * "End rental now" — sets ends_at to now() so an active rental closes
 * out immediately. Useful when gear comes back early.
 */
export async function endRentalNow(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("rentals")
    .update({ ends_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update rental: ${error.message}`);
  revalidatePath("/console/production/rentals");
  revalidatePath(`/console/production/rentals/${id}`);
}

export async function deleteRental(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("rentals").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete rental: ${error.message}`);
  revalidatePath("/console/production/rentals");
  redirect("/console/production/rentals");
}
