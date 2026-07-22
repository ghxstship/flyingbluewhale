"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { CATALOG_KINDS } from "@/lib/db/assignments";

/**
 * Master-catalog update (canonical home, decision 6 rider). Moved verbatim
 * from /studio/settings/catalog/[id]/edit/actions.ts.
 */

const Schema = z.object({
  id: z.string().uuid(),
  kind: z.enum(CATALOG_KINDS),
  code: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/i, "Lowercase letters, digits, dashes only"),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  unit_cost_usd: z.string().optional().or(z.literal("")),
  inventory_qty: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateCatalogItem(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit the master catalog" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const cents = parsed.data.unit_cost_usd ? Math.round(Number(parsed.data.unit_cost_usd) * 100) : null;
  const qty = parsed.data.inventory_qty ? Math.round(Number(parsed.data.inventory_qty)) : null;
  if (cents != null && !Number.isFinite(cents)) return { error: "Bad unit cost" };
  if (qty != null && !Number.isFinite(qty)) return { error: "Bad inventory quantity" };

  const { error } = await supabase
    .from("master_catalog_items")
    .update({
      kind: parsed.data.kind,
      code: parsed.data.code.toLowerCase(),
      name: parsed.data.name,
      description: parsed.data.description || null,
      unit_cost_cents: cents,
      inventory_qty: qty,
    })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);
  if (error) return actionFail(error.message, fd);

  revalidatePath(`/legend/hub/catalogs/${parsed.data.id}`);
  revalidatePath("/legend/hub/catalogs");
  redirect(`/legend/hub/catalogs/${parsed.data.id}`);
}
