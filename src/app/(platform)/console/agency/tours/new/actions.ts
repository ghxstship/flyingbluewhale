"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const Schema = z.object({
  talent_profile_id: z.string().uuid(),
  agency_id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(1).max(200),
  description: z.string().max(4000).optional().or(z.literal("")),
  starts_on: z.string().optional().or(z.literal("")),
  ends_on: z.string().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function createTourAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await supabase
    .from("tours")
    .insert({
      org_id: session.orgId,
      talent_profile_id: parsed.data.talent_profile_id,
      agency_id: parsed.data.agency_id || null,
      name: parsed.data.name,
      description: parsed.data.description || null,
      starts_on: parsed.data.starts_on || null,
      ends_on: parsed.data.ends_on || null,
      status: "planning",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/agency/tours");
  redirect(`/console/agency/tours/${(data as { id: string }).id}`);
}
