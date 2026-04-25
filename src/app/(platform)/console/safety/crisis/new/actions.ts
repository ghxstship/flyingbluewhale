"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
  severity: z.enum(["info", "warn", "critical"]),
});

export type State = { error?: string } | null;

export async function createCrisisAlertAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase.from("crisis_alerts").insert({
    org_id: session.orgId,
    title: parsed.data.title,
    body: parsed.data.body,
    severity: parsed.data.severity,
    created_by: session.userId,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/safety/crisis");
  redirect("/console/safety/crisis");
}
