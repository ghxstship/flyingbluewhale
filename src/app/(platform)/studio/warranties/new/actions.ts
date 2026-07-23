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
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration_months: z.string().optional(),
  warrantor_email: z.string().email().optional().or(z.literal("")),
  warrantor_phone: z.string().max(40).optional(),
  coverage_summary_md: z.string().max(20000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createWarranty(_: State, fd: FormData): Promise<State> {
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

  const duration = parsed.data.duration_months ? Number(parsed.data.duration_months) : null;
  if (duration != null && (Number.isNaN(duration) || duration < 1)) {
    return { error: actionErrorMessage("duration-must-be-gte-1-month", "Duration must be ≥ 1 month") };
  }

  const { data: row, error } = await supabase
    .from("warranties")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id,
      vendor_id: parsed.data.vendor_id || null,
      name: parsed.data.name,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      duration_months: duration,
      warranty_state: "active",
      warrantor_email: parsed.data.warrantor_email || null,
      warrantor_phone: parsed.data.warrantor_phone || null,
      coverage_summary_md: parsed.data.coverage_summary_md || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/warranties");
  redirect(`/studio/warranties/${(row as { id: string }).id}`);
}
