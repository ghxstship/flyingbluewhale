"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { clampRateBps } from "@/lib/rates";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  marketplace_enabled: z.string().optional(),
  marketplace_take_rate_bps: z.string().default("0"),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateMarketplaceSettingsAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Take rate (basis points) is the org's revenue share — only
  // owner/admin should be able to flip the marketplace on or change
  // the bps. RLS likely enforces this, but a clear error at the
  // app boundary beats a silent 0-row update.
  if (!isAdmin(session)) return { error: actionErrorMessage("auth.owner-admin.change-marketplace-settings", "Only owners and admins can change marketplace settings") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const bps = clampRateBps(parsed.data.marketplace_take_rate_bps);

  const { data, error } = await supabase
    .from("orgs")
    .update({
      marketplace_enabled: parsed.data.marketplace_enabled === "on",
      marketplace_take_rate_bps: bps,
    })
    .eq("id", session.orgId)
    .select("id")
    .maybeSingle();

  if (error) return actionFail(error.message, fd);
  if (!data) return { error: actionErrorMessage("not-found.org-in-session", "Org not found in your session") };
  revalidatePath("/studio/marketplace/settings");
  return { ok: true };
}
