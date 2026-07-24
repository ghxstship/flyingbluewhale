"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { assertLegendWrite } from "@/lib/legend_access";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { recordTemplateVersion } from "@/lib/templates/versions";
import { urlFor } from "@/lib/urls";

/**
 * Job-template CRUD (canonical home, decision 6 rider). Moved verbatim from
 * /studio/settings/job-templates/actions.ts — one write path, in the hub.
 * The Create Work Order record action still lands on the console work
 * order it drafts (cross-shell via urlFor).
 */

export type State = { error?: string; ok?: true; fieldErrors?: Record<string, string>; values?: Record<string, string> } | null;

const Schema = z.object({
  name: z.string().min(1).max(120),
  trade: z.string().max(80).optional().or(z.literal("")),
  steps: z.string().max(4000).optional().or(z.literal("")),
});

export async function createJobTemplateAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const denied = assertLegendWrite(session);
  if (denied) return denied;
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

  await recordTemplateVersion(supabase, {
    orgId: session.orgId,
    family: "job",
    templateId: data!.id,
    snapshot: { name: parsed.data.name, trade: parsed.data.trade || null, steps: lines },
    changedBy: session.userId,
  });

  revalidatePath("/legend/hub/templates/job-templates");
  revalidatePath("/legend/hub/templates");
  redirect("/legend/hub/templates/job-templates");
}

/**
 * Create a work order from a job template (kit 21 remediation R2, ADR-0015;
 * clone-to-start). Seeds a `work_orders` row pre-filled from the template
 * (name + trade) and stamps the template's `last_used_at`. Mirrors the kit's
 * requisition→PO / estimate→budget clone chains — a record-action over
 * existing stores, not a new noun.
 */
export async function createWorkOrderFromTemplate(templateId: string): Promise<void> {
  const session = await requireSession();
  const denied = assertLegendWrite(session);
  if (denied) throw new Error(denied.error);
  const supabase = await createClient();

  const { data: tpl } = await supabase
    .from("job_templates")
    .select("id, name, trade")
    .eq("id", templateId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!tpl) return;

  const { data: wo, error } = await supabase
    .from("work_orders")
    .insert({
      org_id: session.orgId,
      title: (tpl as { name: string }).name,
      trade: (tpl as { trade: string | null }).trade || "General",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error || !wo) return;

  await supabase
    .from("job_templates")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", templateId)
    .eq("org_id", session.orgId);

  revalidatePath("/legend/hub/templates/job-templates");
  redirect(urlFor("platform", `/production/work-orders/${(wo as { id: string }).id}`));
}
