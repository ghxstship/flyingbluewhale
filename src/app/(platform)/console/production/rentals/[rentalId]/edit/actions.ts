"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  rate_cents: z.string().optional(),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateRental(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("rentals")
    .update({
      starts_at: new Date(parsed.data.starts_at).toISOString(),
      ends_at: new Date(parsed.data.ends_at).toISOString(),
      rate_cents: parsed.data.rate_cents ? Number(parsed.data.rate_cents) : null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/production/rentals/${id}`);
  revalidatePath("/console/production/rentals");
  redirect(`/console/production/rentals/${id}`);
}
