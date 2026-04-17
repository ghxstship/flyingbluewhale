"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents } from "@/lib/format";

const Schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  estimated: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createReqAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("requisitions").insert({
    org_id: session.orgId,
    requester_id: session.userId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    estimated_cents: parsed.data.estimated ? dollarsToCents(parsed.data.estimated) : null,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/procurement/requisitions");
  redirect("/console/procurement/requisitions");
}
