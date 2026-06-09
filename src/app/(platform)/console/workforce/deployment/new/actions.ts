"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  venue_id: z.string().uuid(),
  functional_area: z.string().max(120).optional(),
  planned_fte: z.coerce.number().min(0).max(10000).default(0),
  actual_fte: z.coerce.number().min(0).max(10000).default(0),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createDeployment(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guard on venue_id.
  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("id", parsed.data.venue_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!venue) return { error: "Venue not found in your organization" };

  const { data, error } = await supabase
    .from("workforce_deployments")
    .insert({
      org_id: session.orgId,
      venue_id: parsed.data.venue_id,
      functional_area: parsed.data.functional_area || null,
      planned_fte: parsed.data.planned_fte,
      actual_fte: parsed.data.actual_fte,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/workforce/deployment");
  redirect(`/console/workforce/deployment/${data.id}`);
}
