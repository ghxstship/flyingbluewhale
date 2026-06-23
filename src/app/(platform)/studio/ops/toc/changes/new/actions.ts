"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  code: z.string().min(1).max(40),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  type: z.enum(["standard", "normal", "emergency", "major"]).default("normal"),
  risk: z.enum(["low", "medium", "high"]).default("medium"),
  impact: z.enum(["low", "medium", "high"]).default("medium"),
  planned_start: z.string().optional(),
  planned_end: z.string().optional(),
  backout_plan: z.string().max(4000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createChange(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase.from("itil_changes").insert({
    org_id: session.orgId,
    code: parsed.data.code,
    title: parsed.data.title,
    description: parsed.data.description || null,
    type: parsed.data.type,
    risk: parsed.data.risk,
    impact: parsed.data.impact,
    change_state: "proposed",
    requested_by: session.userId,
    planned_start: parsed.data.planned_start || null,
    planned_end: parsed.data.planned_end || null,
    backout_plan: parsed.data.backout_plan || null,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/ops/toc/changes");
  redirect("/studio/ops/toc/changes");
}
