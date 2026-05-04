"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateRangeRefine } from "@/lib/zod/dateRange";

const Schema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    channel: z.enum(["email", "social", "paid", "owned", "earned", "multi"]).default("multi"),
    kind: z.enum(["awareness", "conversion", "loyalty", "recruitment", "launch"]).default("awareness"),
    starts_on: z.string().optional(),
    ends_on: z.string().optional(),
    budget_cents: z.coerce.number().int().min(0).max(1_000_000_000_00).default(0),
  })
  // Sea Trial R2 FINDING-018: when both supplied, end must follow start.
  .refine(...dateRangeRefine("starts_on", "ends_on"));

export type State = { error?: string } | null;

export async function createCampaign(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    channel: parsed.data.channel,
    kind: parsed.data.kind,
    starts_on: parsed.data.starts_on || null,
    ends_on: parsed.data.ends_on || null,
    budget_cents: parsed.data.budget_cents,
    status: "draft",
  });
  if (error) return { error: error.message };
  revalidatePath("/console/campaigns");
  redirect("/console/campaigns");
}
