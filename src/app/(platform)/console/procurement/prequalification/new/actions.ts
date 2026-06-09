"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  vendor_id: z.string().uuid(),
  questionnaire_id: z.string().uuid(),
  expires_at: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function invitePrequalification(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guards on vendor_id + questionnaire_id.
  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("id", parsed.data.vendor_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!vendor) return { error: "Vendor not found in your organization" };
  const { data: questionnaire } = await supabase
    .from("prequalification_questionnaires")
    .select("id")
    .eq("id", parsed.data.questionnaire_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!questionnaire) return { error: "Questionnaire not found in your organization" };

  const { data, error } = await supabase
    .from("vendor_prequalifications")
    .insert({
      org_id: session.orgId,
      vendor_id: parsed.data.vendor_id,
      questionnaire_id: parsed.data.questionnaire_id,
      expires_at: parsed.data.expires_at || null,
    } as never)
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { error: "Vendor already invited to this questionnaire." };
    return { error: error.message };
  }
  revalidatePath("/console/procurement/prequalification");
  redirect(`/console/procurement/prequalification/${data.id}`);
}
