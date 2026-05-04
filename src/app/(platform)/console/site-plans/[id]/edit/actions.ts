"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  id: z.string().uuid(),
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

export type State = { error?: string; ok?: true } | null;

export async function updateSitePlan(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { id, ...patch } = parsed.data;
  const { error } = await supabase
    .from("site_plans")
    .update({
      code: patch.code,
      title: patch.title,
      discipline: patch.discipline,
      project_id: patch.project_id || null,
      venue_id: patch.venue_id || null,
      notes: patch.notes || null,
    } as never)
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/site-plans/${id}`);
  revalidatePath("/console/site-plans");
  redirect(`/console/site-plans/${id}`);
}
