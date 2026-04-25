"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  retention_audit_days: z.coerce.number().int().min(30).max(3650).default(365),
  retention_logs_days: z.coerce.number().int().min(7).max(3650).default(90),
  encryption_at_rest: z.enum(["on", "off"]).default("on"),
  dpa_signed: z.enum(["on", "off"]).default("off"),
  data_residency: z.enum(["us", "eu", "global"]).default("us"),
});

export type State = { error?: string; saved?: boolean } | null;

export async function saveComplianceSettings(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse({
    retention_audit_days: fd.get("retention_audit_days"),
    retention_logs_days: fd.get("retention_logs_days"),
    encryption_at_rest: fd.get("encryption_at_rest") ? "on" : "off",
    dpa_signed: fd.get("dpa_signed") ? "on" : "off",
    data_residency: fd.get("data_residency"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("orgs")
    .update({ compliance_settings: parsed.data })
    .eq("id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath("/console/settings/compliance");
  return { saved: true };
}
