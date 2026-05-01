"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  code: z.string().min(1).max(40),
  title: z.string().min(1).max(200),
  discipline: z.enum([
    "site",
    "rigging",
    "power",
    "audio",
    "video",
    "lighting",
    "comms",
    "evacuation",
    "hospitality",
    "accessibility",
    "sustainability",
    "other",
  ]),
  project_id: z.string().uuid().optional().or(z.literal("")),
  venue_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});

export type State = { error?: string } | null;

export async function createSitePlan(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_plans")
    .insert({
      org_id: session.orgId,
      code: parsed.data.code,
      title: parsed.data.title,
      discipline: parsed.data.discipline,
      project_id: parsed.data.project_id || null,
      venue_id: parsed.data.venue_id || null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    } as never)
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { error: `Sheet code "${parsed.data.code}" already exists for this project.` };
    return { error: error.message };
  }
  revalidatePath("/console/site-plans");
  redirect(`/console/site-plans/${data.id}`);
}
