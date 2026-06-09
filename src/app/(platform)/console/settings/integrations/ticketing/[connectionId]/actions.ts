"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  connection_id: z.string().uuid(),
  total_sold: z.string().min(1),
  total_capacity: z.string().optional().or(z.literal("")),
  total_gross: z.string().min(1),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default("USD"),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const toCents = (v: string | undefined): number => {
  if (!v) return 0;
  const n = Number(v.replace(/[$,]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
};

export async function recordSalesSnapshotAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Sales snapshots feed revenue dashboards — manager+ can record them.
  // (Lower-priv personas like crew/viewer should never write financial
  // data; RLS likely refuses but app-layer gate is sharper.)
  if (!isManagerPlus(session)) return { error: "Only manager+ can record sales snapshots" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guard on connection_id.
  const { data: connection } = await supabase
    .from("ticketing_connections")
    .select("id")
    .eq("id", parsed.data.connection_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!connection) return { error: "Ticketing connection not found in your organization" };

  const totalSold = Math.max(0, Math.round(Number(parsed.data.total_sold)));
  const totalCapacity = parsed.data.total_capacity ? Math.max(0, Math.round(Number(parsed.data.total_capacity))) : null;

  const { error: insertError } = await supabase.from("ticketing_sales_snapshots").insert({
    ticketing_connection_id: parsed.data.connection_id,
    org_id: session.orgId,
    total_sold: totalSold,
    total_capacity: totalCapacity,
    total_gross_cents: toCents(parsed.data.total_gross),
    currency: parsed.data.currency,
    tier_data: [],
  });
  if (insertError) return { error: insertError.message };

  // Bump connection's last_synced_at
  const { error: updateError } = await supabase
    .from("ticketing_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", parsed.data.connection_id)
    .eq("org_id", session.orgId);
  if (updateError) return { error: updateError.message };

  revalidatePath(`/console/settings/integrations/ticketing/${parsed.data.connection_id}`);
  revalidatePath("/console/settings/integrations/ticketing");
  return { ok: true };
}
