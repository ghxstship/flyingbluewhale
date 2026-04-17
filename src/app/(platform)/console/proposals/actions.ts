"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents } from "@/lib/format";

const Schema = z.object({
  title: z.string().min(1).max(200),
  client_id: z.string().uuid().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
  amount: z.string().optional(),
  expires_at: z.string().date().optional().or(z.literal("")),
  notes: z.string().max(4000).optional(),
});

export type State = { error?: string } | null;

export async function createProposalAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proposals")
    .insert({
      org_id: session.orgId,
      title: parsed.data.title,
      client_id: parsed.data.client_id || null,
      project_id: parsed.data.project_id || null,
      amount_cents: parsed.data.amount ? dollarsToCents(parsed.data.amount) : null,
      expires_at: parsed.data.expires_at || null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select().single();
  if (error) return { error: error.message };
  revalidatePath("/console/proposals");
  redirect(`/console/proposals/${data.id}`);
}

export async function setProposalStatusAction(id: string, status: "draft"|"sent"|"approved"|"rejected"|"expired"|"signed") {
  const session = await requireSession();
  const supabase = await createClient();
  const patch: { status: typeof status; sent_at?: string; signed_at?: string } = { status };
  if (status === "sent") patch.sent_at = new Date().toISOString();
  if (status === "signed") patch.signed_at = new Date().toISOString();
  const { error } = await supabase.from("proposals").update(patch).eq("org_id", session.orgId).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/console/proposals/${id}`);
  revalidatePath("/console/proposals");
  return { ok: true as const };
}
