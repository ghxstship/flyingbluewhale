"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  project_id: z.string().uuid(),
  week_ending: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pay_period_start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  pay_period_end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  state_code: z.string().max(4).optional(),
  agency_report_type: z.enum(["wh_347", "ca_dir", "ny_pwa", "wa_lni", "state_other", "none"]).default("none"),
  notes: z.string().max(4000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createPayrollRun(_: State, fd: FormData): Promise<State> {
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

  // Derive pay-period if user only entered week_ending.
  const we = parsed.data.week_ending;
  const weDate = new Date(we + "T00:00:00Z");
  const startDate = new Date(weDate);
  startDate.setUTCDate(startDate.getUTCDate() - 6);
  const periodStart = parsed.data.pay_period_start ?? startDate.toISOString().slice(0, 10);
  const periodEnd = parsed.data.pay_period_end ?? we;

  const { data: row, error } = await supabase
    .from("payroll_runs")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id,
      week_ending: we,
      pay_period_start: periodStart,
      pay_period_end: periodEnd,
      state_code: parsed.data.state_code?.toUpperCase() || null,
      agency_report_type: parsed.data.agency_report_type,
      run_state: "draft",
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/finance/payroll");
  redirect(`/studio/finance/payroll/${(row as { id: string }).id}`);
}
