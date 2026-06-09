"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional().or(z.literal("")),
  kind: z.string(),
  likelihood: z.string(),
  impact: z.string(),
  status: z.string(),
  due_on: z.string().optional().or(z.literal("")),
  treatment: z.string().max(4000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateRisk(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("risks", session.orgId, id, expectedUpdatedAt, {
    title: parsed.data.title,
    description: parsed.data.description || null,
    kind: parsed.data.kind as "risk" | "assumption" | "issue" | "dependency",
    likelihood: parsed.data.likelihood as "rare" | "unlikely" | "possible" | "likely" | "almost_certain",
    impact: parsed.data.impact as "insignificant" | "minor" | "moderate" | "major" | "severe",
    status: parsed.data.status as "open" | "mitigating" | "accepted" | "closed",
    due_on: parsed.data.due_on || null,
    treatment: parsed.data.treatment || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Risk not found." };
  }
  revalidatePath(`/console/programs/risk/${id}`);
  revalidatePath("/console/programs/risk");
  redirect(`/console/programs/risk/${id}`);
}

export async function deleteRisk(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("risks").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete risk: ${error.message}`);
  revalidatePath("/console/programs/risk");
  redirect("/console/programs/risk");
}
