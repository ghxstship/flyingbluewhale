"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const CommitteeSchema = z.object({
  name: z.string().min(1).max(120),
  cadence: z.enum(["weekly", "biweekly", "monthly", "ad_hoc"]).default("monthly"),
  charter: z.string().max(2000).optional(),
});

const PolicySchema = z.object({
  name: z.string().min(1).max(160),
  category: z.enum(["finance", "safety", "hr", "data", "operations"]).default("operations"),
});

export type CommitteeState = { error?: string } | null;
export type PolicyState = { error?: string } | null;

export async function createCommittee(_: CommitteeState, fd: FormData): Promise<CommitteeState> {
  const session = await requireSession();
  const parsed = CommitteeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase.from("governance_committees").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    cadence: parsed.data.cadence,
    charter: parsed.data.charter || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/settings/governance");
  return null;
}

export async function createPolicy(_: PolicyState, fd: FormData): Promise<PolicyState> {
  const session = await requireSession();
  const parsed = PolicySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase.from("governance_policies").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    category: parsed.data.category,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/settings/governance");
  return null;
}
