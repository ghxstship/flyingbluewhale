"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const Schema = z.object({
  tour_id: z.string().uuid().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
  city: z.string().max(200).optional().or(z.literal("")),
  venue: z.string().max(200).optional().or(z.literal("")),
  sheet_date: z.string().optional().or(z.literal("")),
  crew_call: z.string().regex(TIME).optional().or(z.literal("")),
  doors: z.string().regex(TIME).optional().or(z.literal("")),
  headline_set: z.string().max(120).optional().or(z.literal("")),
  curfew: z.string().regex(TIME).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createDaySheetAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create day sheets" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guards — the tour and project must belong to this org.
  if (parsed.data.tour_id) {
    const { data: tour } = await supabase
      .from("tours")
      .select("id")
      .eq("id", parsed.data.tour_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!tour) return { error: "Tour not found in your organization" };
  }
  if (parsed.data.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", parsed.data.project_id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization" };
  }

  const { data, error } = await supabase
    .from("day_sheets")
    .insert({
      org_id: session.orgId,
      tour_id: parsed.data.tour_id || null,
      project_id: parsed.data.project_id || null,
      city: parsed.data.city || null,
      venue: parsed.data.venue || null,
      sheet_date: parsed.data.sheet_date || null,
      crew_call: parsed.data.crew_call || null,
      doors: parsed.data.doors || null,
      headline_set: parsed.data.headline_set || null,
      curfew: parsed.data.curfew || null,
      sheet_state: "not_started",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/operations/day-sheets");
  redirect(`/studio/operations/day-sheets/${(data as { id: string }).id}`);
}
