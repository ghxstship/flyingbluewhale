"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { nextOrgCode } from "@/lib/codes";

const Schema = z.object({
  subject: z.string().min(1).max(200),
  project_id: z.string().uuid(),
  due_at: z.string().optional(),
  body_md: z.string().max(50000).optional(),
});

export type State = { error?: string } | null;

export async function createTransmittal(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", parsed.data.project_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: "Project not found in your organization" };

  const code = await nextOrgCode("transmittals", session.orgId, "TXM");

  const { data: row, error } = await supabase
    .from("transmittals")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id,
      code,
      subject: parsed.data.subject,
      body_md: parsed.data.body_md || null,
      due_at: parsed.data.due_at || null,
      transmittal_state: "draft",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/console/transmittals");
  redirect(`/console/transmittals/${(row as { id: string }).id}`);
}
