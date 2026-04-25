"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(120),
  kind: z.enum(["competition", "training", "live_site", "ibc", "mpc", "village", "support"]),
  cluster: z.string().max(80).optional(),
  capacity: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createVenueAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase.from("venues").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    kind: parsed.data.kind,
    cluster: parsed.data.cluster || null,
    capacity: parsed.data.capacity ? Number(parsed.data.capacity) : null,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/venues");
  redirect("/console/venues");
}
