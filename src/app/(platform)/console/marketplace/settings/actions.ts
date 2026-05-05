"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const Schema = z.object({
  marketplace_enabled: z.string().optional(),
  marketplace_take_rate_bps: z.string().default("0"),
});

export type State = { error?: string; ok?: true } | null;

export async function updateMarketplaceSettingsAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const bps = Math.min(5000, Math.max(0, Math.round(Number(parsed.data.marketplace_take_rate_bps))));

  const { error } = await supabase
    .from("orgs")
    .update({
      marketplace_enabled: parsed.data.marketplace_enabled === "on",
      marketplace_take_rate_bps: bps,
    })
    .eq("id", session.orgId);

  if (error) return { error: error.message };
  revalidatePath("/console/marketplace/settings");
  return { ok: true };
}
