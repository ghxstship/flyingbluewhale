"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const Schema = z.object({
  full_name: z.string().min(1).max(160),
  email: z.string().email().max(254).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function addApplicantAction(positionId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: position } = await supabase
    .from("job_positions")
    .select("id")
    .eq("id", positionId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!position) return { error: "Position not found" };

  const { error } = await supabase.from("job_applicants").insert({
    org_id: session.orgId,
    position_id: positionId,
    full_name: parsed.data.full_name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    notes: parsed.data.notes || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/console/workforce/hiring/${positionId}`);
  redirect(`/console/workforce/hiring/${positionId}`);
}
