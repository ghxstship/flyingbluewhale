"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  talent_profile_id: z.string().uuid(),
  agency_id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(1).max(200),
  description: z.string().max(4000).optional().or(z.literal("")),
  starts_on: z.string().optional().or(z.literal("")),
  ends_on: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createTourAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.create-tours", "Only manager+ can create tours") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guards.
  const { data: talent } = await supabase
    .from("talent_profiles")
    .select("id")
    .eq("id", parsed.data.talent_profile_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!talent) return { error: actionErrorMessage("not-found.talent-profile-in-org", "Talent profile not found in your organization") };

  if (parsed.data.agency_id) {
    const { data: agency } = await supabase
      .from("agencies")
      .select("id")
      .eq("id", parsed.data.agency_id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!agency) return { error: actionErrorMessage("not-found.agency-in-org", "Agency not found in your organization") };
  }

  const { data, error } = await supabase
    .from("tours")
    .insert({
      org_id: session.orgId,
      talent_profile_id: parsed.data.talent_profile_id,
      agency_id: parsed.data.agency_id || null,
      name: parsed.data.name,
      description: parsed.data.description || null,
      starts_on: parsed.data.starts_on || null,
      ends_on: parsed.data.ends_on || null,
      tour_state: "planning",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/agency/tours");
  redirect(`/studio/agency/tours/${(data as { id: string }).id}`);
}
