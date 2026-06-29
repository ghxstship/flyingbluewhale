"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

export type State = { error?: string; ok?: true; fieldErrors?: Record<string, string>; values?: Record<string, string> } | null;

const Schema = z.object({
  name: z.string().min(1).max(120),
  trade: z.string().max(80).optional().or(z.literal("")),
  steps: z.string().max(4000).optional().or(z.literal("")),
});

export async function createJobTemplateAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_templates")
    .insert({ org_id: session.orgId, name: parsed.data.name, trade: parsed.data.trade || null })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  // One step per non-empty line; "* " prefix marks a photo-required step.
  const lines = (parsed.data.steps ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length) {
    const steps = lines.map((line, i) => {
      const requiresPhoto = line.startsWith("* ");
      return {
        job_template_id: data!.id,
        position: i,
        label: requiresPhoto ? line.slice(2).trim() : line,
        requires_photo: requiresPhoto,
      };
    });
    const { error: stepErr } = await supabase.from("job_template_steps").insert(steps);
    if (stepErr) return actionFail(stepErr.message, fd);
  }
  revalidatePath("/studio/settings/job-templates");
  redirect("/studio/settings/job-templates");
}
