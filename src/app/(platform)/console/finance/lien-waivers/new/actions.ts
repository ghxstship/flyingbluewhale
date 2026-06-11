"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { moneyCentsString } from "@/app/(platform)/console/finance/money";

const Schema = z.object({
  project_id: z.string().uuid(),
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  waiver_type: z.enum(["conditional", "unconditional"]),
  waiver_scope: z.enum(["partial", "final"]),
  // Integer cents from MoneyInput's hidden field.
  amount_cents: moneyCentsString({ allowEmpty: true }),
  through_date: z.string().optional(),
  state_jurisdiction: z.string().max(4).optional(),
  notes: z.string().max(4000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createLienWaiver(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
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

  // lien_waivers.amount is a dollars-denominated numeric column (the
  // list + detail pages multiply by 100 for display) — convert the
  // validated cents back to dollars at the boundary.
  const amount = parsed.data.amount_cents ? Number(parsed.data.amount_cents) / 100 : 0;

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
  if (error) return actionFail(error.message, fd);

  revalidatePath("/console/finance/lien-waivers");
  redirect(`/console/finance/lien-waivers/${(row as { id: string }).id}`);
}
