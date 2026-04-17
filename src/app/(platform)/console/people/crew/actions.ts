"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents } from "@/lib/format";

const Schema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  day_rate: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createCrewAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("crew_members").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    role: parsed.data.role || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    day_rate_cents: parsed.data.day_rate ? dollarsToCents(parsed.data.day_rate) : null,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/people/crew");
  redirect("/console/people/crew");
}
