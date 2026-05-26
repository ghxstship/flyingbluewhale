"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const Schema = z.object({
  project_id: z.string().uuid(),
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  waiver_type: z.enum(["conditional", "unconditional"]),
  waiver_scope: z.enum(["partial", "final"]),
  amount: z.string().optional(),
  through_date: z.string().optional(),
  state_jurisdiction: z.string().max(4).optional(),
  notes: z.string().max(4000).optional(),
});

export type State = { error?: string } | null;

export async function createLienWaiver(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", parsed.data.project_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: "Project not found in your organization" };

  if (parsed.data.vendor_id) {
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("id", parsed.data.vendor_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!vendor) return { error: "Vendor not found in your organization" };
  }

  const amount = parsed.data.amount ? Number(parsed.data.amount) : 0;
  if (Number.isNaN(amount) || amount < 0) return { error: "Amount must be a positive number" };

  const { data: row, error } = await supabase
    .from("lien_waivers")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id,
      vendor_id: parsed.data.vendor_id || null,
      waiver_type: parsed.data.waiver_type,
      waiver_scope: parsed.data.waiver_scope,
      waiver_state: "drafted",
      amount,
      through_date: parsed.data.through_date || null,
      state_jurisdiction: parsed.data.state_jurisdiction?.toUpperCase() || null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/console/finance/lien-waivers");
  redirect(`/console/finance/lien-waivers/${(row as { id: string }).id}`);
}
