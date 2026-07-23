"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const Schema = z.object({
  project_id: z.string().uuid("Pick a project"),
  name: z.string().min(1).max(200),
  warrantor_name: z.string().max(200).optional().or(z.literal("")),
  warrantor_email: z.string().email().max(200).optional().or(z.literal("")),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  duration_months: z.string().optional().or(z.literal("")),
  coverage_summary_md: z.string().max(5000).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function createWarranty(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.create-warranties", "Only manager+ can create warranties") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const durationMonths = parsed.data.duration_months ? Math.round(Number(parsed.data.duration_months)) : null;
  if (durationMonths != null && !Number.isFinite(durationMonths)) return actionFail(actionErrorMessage("bad-duration", "Bad duration"), fd);

  const supabase = await createClient();
  // warranty_state (enum) defaults to 'active' in the DB — omit and let
  // the default apply.
  const { error } = await supabase.from("warranties").insert({
    org_id: session.orgId,
    project_id: parsed.data.project_id,
    name: parsed.data.name,
    warrantor_name: parsed.data.warrantor_name || null,
    warrantor_email: parsed.data.warrantor_email || null,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
    duration_months: durationMonths,
    coverage_summary_md: parsed.data.coverage_summary_md || null,
    notes: parsed.data.notes || null,
  });
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/assets/warranties");
  redirect("/studio/assets/warranties");
}
