"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  vendor_id: z.string().uuid(),
  total: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type State = { error?: string } | null;

export async function addResponse(reqId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const totalCents = parsed.data.total ? Math.round(Number(parsed.data.total) * 100) : null;
  const { error } = await supabase.from("rfq_responses").insert({
    org_id: session.orgId,
    requisition_id: reqId,
    vendor_id: parsed.data.vendor_id,
    total_cents: totalCents,
    notes: parsed.data.notes || null,
    status: totalCents != null ? "responded" : "invited",
    submitted_at: totalCents != null ? new Date().toISOString() : null,
  } as never);
  if (error) {
    if (error.code === "23505") return { error: "This vendor already has a response — edit it instead." };
    return { error: error.message };
  }
  revalidatePath(`/console/procurement/requisitions/${reqId}/leveling`);
  redirect(`/console/procurement/requisitions/${reqId}/leveling`);
}
