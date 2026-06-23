"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function guardResponse(responseId: string, rfqId: string, orgId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rfq_responses")
    .select("id, response_state")
    .eq("id", responseId)
    .eq("requisition_id", rfqId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!data) return null;
  const state = (data as { response_state: string }).response_state;
  if (state === "awarded" || state === "declined") return null; // locked
  return (data as { id: string }).id;
}

async function refreshHeadlineTotal(responseId: string, orgId: string): Promise<void> {
  const supabase = await createClient();
  const { data: lines } = await supabase
    .from("rfq_response_lines")
    .select("quantity, unit_price_cents")
    .eq("rfq_response_id", responseId)
    .eq("org_id", orgId);
  const total = ((lines ?? []) as Array<{ quantity: number; unit_price_cents: number }>).reduce(
    (acc, l) => acc + Math.round(Number(l.quantity) * l.unit_price_cents),
    0,
  );
  // Keep the rolled-up total_cents on rfq_responses in sync with the
  // line-item ledger. This is the canonical denorm pattern in the
  // codebase — denorm only when a trigger or action keeps it honest.
  const { error } = await supabase
    .from("rfq_responses")
    .update({ total_cents: total })
    .eq("id", responseId)
    .eq("org_id", orgId);
  if (error) throw new Error(`Could not refresh response total: ${error.message}`);
}

const AddLineSchema = z.object({
  rfqId: z.string().uuid(),
  responseId: z.string().uuid(),
  description: z.string().trim().min(1).max(500),
  quantity: z.coerce.number().nonnegative().finite(),
  unit_price_dollars: z.coerce.number().nonnegative().finite(),
});

export async function addResponseLine(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = AddLineSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const responseId = await guardResponse(parsed.data.responseId, parsed.data.rfqId, session.orgId);
  if (!responseId) return;

  const supabase = await createClient();
  const { data: maxPos } = await supabase
    .from("rfq_response_lines")
    .select("position")
    .eq("rfq_response_id", responseId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPos = ((maxPos?.position as number | undefined) ?? 0) + 1;

  const { error: insertErr } = await supabase.from("rfq_response_lines").insert({
    rfq_response_id: responseId,
    org_id: session.orgId,
    position: nextPos,
    description: parsed.data.description,
    quantity: parsed.data.quantity,
    unit_price_cents: Math.round(parsed.data.unit_price_dollars * 100),
  });
  if (insertErr) throw new Error(`Could not add response line: ${insertErr.message}`);

  await refreshHeadlineTotal(responseId, session.orgId);
  revalidatePath(`/studio/procurement/rfqs/${parsed.data.rfqId}/responses/${responseId}`);
  revalidatePath(`/studio/procurement/rfqs/${parsed.data.rfqId}/responses`);
}

const DeleteLineSchema = z.object({
  rfqId: z.string().uuid(),
  responseId: z.string().uuid(),
  lineId: z.string().uuid(),
});

export async function deleteResponseLine(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = DeleteLineSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const responseId = await guardResponse(parsed.data.responseId, parsed.data.rfqId, session.orgId);
  if (!responseId) return;

  const supabase = await createClient();
  const { error: deleteErr } = await supabase
    .from("rfq_response_lines")
    .delete()
    .eq("id", parsed.data.lineId)
    .eq("rfq_response_id", responseId)
    .eq("org_id", session.orgId);
  if (deleteErr) throw new Error(`Could not delete response line: ${deleteErr.message}`);

  await refreshHeadlineTotal(responseId, session.orgId);
  revalidatePath(`/studio/procurement/rfqs/${parsed.data.rfqId}/responses/${responseId}`);
  revalidatePath(`/studio/procurement/rfqs/${parsed.data.rfqId}/responses`);
}
