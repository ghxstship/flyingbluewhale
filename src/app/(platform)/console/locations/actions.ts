"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  postcode: z.string().optional(),
  notes: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createLocationAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("locations").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    address: parsed.data.address || null,
    city: parsed.data.city || null,
    region: parsed.data.region || null,
    country: parsed.data.country || null,
    postcode: parsed.data.postcode || null,
    notes: parsed.data.notes || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/locations");
  redirect("/console/locations");
}
