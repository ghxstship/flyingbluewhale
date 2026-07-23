"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  started_at: z.string().min(1),
  ended_at: z.string().optional().or(z.literal("")),
  description: z.string().max(500).optional(),
  project_id: z.string().uuid().optional().or(z.literal("")),
  billable: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createTimeEntryAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guard on project_id.
  if (parsed.data.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", parsed.data.project_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: actionErrorMessage("not-found.project-in-org", "Project not found in your organization") };
  }

  const started = new Date(parsed.data.started_at);
  const ended = parsed.data.ended_at ? new Date(parsed.data.ended_at) : null;
  const duration = ended ? Math.max(0, Math.round((ended.getTime() - started.getTime()) / 60000)) : null;
  const { error } = await supabase.from("time_entries").insert({
    org_id: session.orgId,
    user_id: session.userId,
    started_at: started.toISOString(),
    ended_at: ended?.toISOString() ?? null,
    duration_minutes: duration,
    description: parsed.data.description || null,
    project_id: parsed.data.project_id || null,
    billable: parsed.data.billable === "on",
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/finance/time");
  redirect("/studio/finance/time");
}
