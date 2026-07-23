"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  name: z.string().min(1).max(200),
  project_id: z.string().uuid(),
  unit: z.string().min(1).max(16),
  site_plan_id: z.string().uuid().optional().or(z.literal("")),
  cost_code_id: z.string().uuid().optional().or(z.literal("")),
  calibration_in_per_ft: z.string().optional(),
  notes: z.string().max(4000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createTakeoff(_: State, fd: FormData): Promise<State> {
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
  if (!project) return { error: actionErrorMessage("not-found.project-in-org", "Project not found in your organization") };

  const calibration = parsed.data.calibration_in_per_ft ? Number(parsed.data.calibration_in_per_ft) : null;
  if (calibration != null && (Number.isNaN(calibration) || calibration <= 0)) {
    return { error: actionErrorMessage("calibration-must-be-a-positive-number", "Calibration must be a positive number") };
  }

  const { data: row, error } = await supabase
    .from("takeoffs")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id,
      name: parsed.data.name,
      unit: parsed.data.unit,
      site_plan_id: parsed.data.site_plan_id || null,
      cost_code_id: parsed.data.cost_code_id || null,
      calibration_in_per_ft: calibration,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/takeoffs");
  redirect(`/studio/takeoffs/${(row as { id: string }).id}`);
}
