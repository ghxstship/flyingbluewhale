"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const LINE_KINDS = ["revenue", "expense", "adjustment", "tax", "fee", "split"] as const;

const AddLineSchema = z.object({
  settlementId: z.string().uuid(),
  kind: z.enum(LINE_KINDS),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(240).optional().or(z.literal("")),
  amount_dollars: z.coerce.number().finite(),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export async function addSettlementLine(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = AddLineSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;

  const supabase = await createClient();
  // Settlement must belong to caller's org — the insert RLS check would
  // catch this anyway, but a pre-check produces a cleaner UX on tampered
  // hidden inputs.
  const { data: settlement } = await supabase
    .from("settlements")
    .select("id")
    .eq("id", parsed.data.settlementId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!settlement) return;

  await supabase.from("settlement_lines").insert({
    settlement_id: parsed.data.settlementId,
    org_id: session.orgId,
    kind: parsed.data.kind,
    category: parsed.data.category?.trim() || null,
    description: parsed.data.description?.trim() || null,
    amount_cents: Math.round(parsed.data.amount_dollars * 100),
    sort_order: parsed.data.sort_order,
  });

  revalidatePath(`/console/bookings/settlements/${parsed.data.settlementId}`);
}

const DeleteLineSchema = z.object({
  settlementId: z.string().uuid(),
  lineId: z.string().uuid(),
});

export async function deleteSettlementLine(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = DeleteLineSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("settlement_lines")
    .delete()
    .eq("id", parsed.data.lineId)
    .eq("settlement_id", parsed.data.settlementId)
    .eq("org_id", session.orgId);

  revalidatePath(`/console/bookings/settlements/${parsed.data.settlementId}`);
}
