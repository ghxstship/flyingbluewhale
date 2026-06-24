"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  po_id: z.string().uuid(),
  receipt_number: z.string().min(1).max(64),
  received_at: z.string().min(1),
  partial: z.string().optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createGoodsReceipt(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can record goods receipts" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // received_at arrives as a date string (YYYY-MM-DD); store it directly —
  // the timestamptz column coerces midnight UTC.
  const { data, error } = await supabase
    .from("goods_receipts")
    .insert({
      org_id: session.orgId,
      po_id: parsed.data.po_id,
      receipt_number: parsed.data.receipt_number,
      received_at: parsed.data.received_at,
      received_by: session.userId || null,
      partial: parsed.data.partial === "on",
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/procurement/receiving");
  redirect(`/studio/procurement/receiving/${data.id}`);
}
