"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  marketplace_enabled: z.string().optional(),
  marketplace_take_rate_bps: z.string().default("0"),
});

export type State = { error?: string; ok?: true } | null;

export async function updateMarketplaceSettingsAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Take rate (basis points) is the org's revenue share — only
  // owner/admin should be able to flip the marketplace on or change
  // the bps. RLS likely enforces this, but a clear error at the
  // app boundary beats a silent 0-row update.
  if (!isAdmin(session)) return { error: "Only owners and admins can change marketplace settings" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const bps = Math.min(5000, Math.max(0, Math.round(Number(parsed.data.marketplace_take_rate_bps))));

  const { data, error } = await supabase
    .from("orgs")
    .update({
      marketplace_enabled: parsed.data.marketplace_enabled === "on",
      marketplace_take_rate_bps: bps,
    })
    .eq("id", session.orgId)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Org not found in your session" };
  revalidatePath("/console/marketplace/settings");
  return { ok: true };
}
