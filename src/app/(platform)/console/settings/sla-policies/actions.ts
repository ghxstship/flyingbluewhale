"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const SEVERITIES = ["P1", "P2", "P3", "P4"] as const;

const UpsertSchema = z.object({
  severity: z.enum(SEVERITIES),
  response_minutes: z.coerce.number().int().min(1).max(100_000),
  resolution_minutes: z.coerce.number().int().min(1).max(1_000_000),
  business_hours_only: z.coerce.boolean().optional(),
});

export async function upsertSlaPolicy(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = UpsertSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  if (parsed.data.resolution_minutes < parsed.data.response_minutes) return; // resolution must be ≥ response

  const supabase = await createClient();
  // No unique (org_id, severity) constraint — but enforce one active
  // policy per severity at the app layer so existing service-request
  // timers don't fork between two parallel policies. New write supersedes
  // the prior policy at the same severity.
  const { data: existing } = await supabase
    .from("service_sla_policies")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("severity", parsed.data.severity)
    .eq("active", true)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from("service_sla_policies")
      .update({
        response_minutes: parsed.data.response_minutes,
        resolution_minutes: parsed.data.resolution_minutes,
        business_hours_only: parsed.data.business_hours_only ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", (existing as { id: string }).id)
      .eq("org_id", session.orgId);
    if (updateError) throw new Error(`Could not update service sla policy: ${updateError.message}`);
  } else {
    const { error } = await supabase.from("service_sla_policies").insert({
      org_id: session.orgId,
      severity: parsed.data.severity,
      response_minutes: parsed.data.response_minutes,
      resolution_minutes: parsed.data.resolution_minutes,
      business_hours_only: parsed.data.business_hours_only ?? false,
      active: true,
    });
    if (error) throw new Error(`Could not create service sla policy: ${error.message}`);
  }

  revalidatePath("/console/settings/sla-policies");
}

const ToggleSchema = z.object({
  id: z.string().uuid(),
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export async function toggleSlaPolicy(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = ToggleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("service_sla_policies")
    .update({ active: parsed.data.active, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update service sla policy: ${error.message}`);

  revalidatePath("/console/settings/sla-policies");
}

export async function deleteSlaPolicy(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  if (!/^[0-9a-f-]{36}$/.test(id)) return;

  const supabase = await createClient();
  const { error } = await supabase.from("service_sla_policies").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete service sla policy: ${error.message}`);

  revalidatePath("/console/settings/sla-policies");
}
