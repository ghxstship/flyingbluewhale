"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  purchase_order_id: z.string().uuid(),
  period_start: z.string(),
  period_end: z.string(),
  retention_pct: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createPayApp(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Pay applications draw down PO retention — manager+ only at app layer.
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.create-payment-applications", "Only manager+ can create payment applications") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const { data: po } = await supabase
    .from("purchase_orders")
    .select("project_id, vendor_id")
    .eq("org_id", session.orgId)
    .eq("id", parsed.data.purchase_order_id)
    .maybeSingle();
  if (!po || !po.project_id) return { error: actionErrorMessage("po-not-found-or-missing-project", "PO not found or missing project") };

  // Determine the next application number for this PO.
  const { count: priorCount } = await (
    supabase as unknown as {
      from: (t: string) => {
        select: (
          cols: string,
          opts: { count: "exact"; head: true },
        ) => {
          eq: (col: string, val: string) => { eq: (col: string, val: string) => Promise<{ count: number | null }> };
        };
      };
    }
  )
    .from("payment_applications")
    .select("*", { count: "exact", head: true })
    .eq("org_id", session.orgId)
    .eq("purchase_order_id", parsed.data.purchase_order_id);
  const nextNum = (priorCount ?? 0) + 1;

  const retention = parsed.data.retention_pct ? Number(parsed.data.retention_pct) : 10;

  const { data: payApp, error } = await supabase
    .from("payment_applications")
    .insert({
      org_id: session.orgId,
      project_id: po.project_id,
      purchase_order_id: parsed.data.purchase_order_id,
      vendor_id: po.vendor_id,
      application_number: nextNum,
      period_start: parsed.data.period_start,
      period_end: parsed.data.period_end,
      retention_pct: retention,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    } as never)
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  // Seed lines from PO line items so the user fills in % complete instead
  // of re-typing each row.
  const { data: poLines } = await supabase
    .from("po_line_items")
    .select("id, unit_price_cents, quantity")
    .eq("purchase_order_id", parsed.data.purchase_order_id);

  if ((poLines ?? []).length > 0) {
    await supabase.from("payment_application_lines").insert(
      (poLines ?? []).map((ln) => ({
        org_id: session.orgId,
        payment_application_id: payApp.id,
        po_line_item_id: ln.id,
        scheduled_value_cents: Math.round(Number(ln.unit_price_cents) * Number(ln.quantity)),
      })) as never,
    );
  }

  revalidatePath("/studio/finance/pay-apps");
  redirect(`/studio/finance/pay-apps/${payApp.id}`);
}
