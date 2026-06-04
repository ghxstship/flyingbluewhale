"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { XPMS_DEFAULT_DRAW_SCHEDULE, XPMS_PHASES } from "@/lib/finance/xpms-budget";

const DrawSchema = z.object({
  draw_name: z.string().min(1).max(120),
  trigger_label: z.string().max(200).optional().or(z.literal("")),
  trigger_phase: z.enum(XPMS_PHASES).optional().or(z.literal("")),
  percentage: z.string().min(1), // pct expressed as "0.5" or "50"
  sort_order: z.string().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

function normalizePct(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  // Accept either decimal (0.5) or whole-percent (50) forms.
  return n > 1 ? n / 100 : n;
}

async function assertProjectInOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  orgId: string,
) {
  const { data } = await supabase
    .from("projects")
    .select("id, org_id")
    .eq("id", projectId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  return !!data;
}

export async function seedDefaultDraws(projectId: string): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can seed draw schedules" };
  const supabase = await createClient();
  if (!(await assertProjectInOrg(supabase, projectId, session.orgId))) return { error: "Project not found" };

  const rows = XPMS_DEFAULT_DRAW_SCHEDULE.map((d) => ({
    org_id: session.orgId,
    project_id: projectId,
    draw_name: d.draw_name,
    trigger_label: d.trigger_label,
    trigger_phase: d.trigger_phase,
    percentage: d.percentage,
    sort_order: d.sort_order,
  }));

  const { error } = await (supabase as unknown as LooseSupabase).from("project_billing_draws").insert(rows);
  if (error) return { error: error.message };
  revalidatePath(`/console/projects/${projectId}/finance/draws`);
  return null;
}

export async function createDraw(projectId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create draws" };
  const parsed = DrawSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const pct = normalizePct(parsed.data.percentage);
  if (pct === null || pct < 0 || pct > 1) return { error: "Percentage must be between 0% and 100%" };

  const supabase = await createClient();
  if (!(await assertProjectInOrg(supabase, projectId, session.orgId))) return { error: "Project not found" };

  const { error } = await (supabase as unknown as LooseSupabase).from("project_billing_draws").insert({
    org_id: session.orgId,
    project_id: projectId,
    draw_name: parsed.data.draw_name,
    trigger_label: parsed.data.trigger_label || null,
    trigger_phase: parsed.data.trigger_phase || null,
    percentage: pct,
    sort_order: parsed.data.sort_order ? Number(parsed.data.sort_order) : 0,
  });
  if (error) return { error: error.message };
  revalidatePath(`/console/projects/${projectId}/finance/draws`);
  return null;
}

export async function toggleDrawn(projectId: string, drawId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = await createClient();
  const loose = supabase as unknown as LooseSupabase;
  // Read current state then flip — small race window is acceptable here
  // because the UI optimistically reflects the result on next render.
  const { data: row } = await loose
    .from("project_billing_draws")
    .select("drawn")
    .eq("id", drawId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const nextDrawn = !(row?.drawn ?? false);
  await loose
    .from("project_billing_draws")
    .update({ drawn: nextDrawn, drawn_at: nextDrawn ? new Date().toISOString() : null })
    .eq("id", drawId)
    .eq("org_id", session.orgId);
  revalidatePath(`/console/projects/${projectId}/finance/draws`);
}

export async function deleteDraw(projectId: string, drawId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = await createClient();
  await (supabase as unknown as LooseSupabase)
    .from("project_billing_draws")
    .delete()
    .eq("id", drawId)
    .eq("org_id", session.orgId);
  revalidatePath(`/console/projects/${projectId}/finance/draws`);
}
