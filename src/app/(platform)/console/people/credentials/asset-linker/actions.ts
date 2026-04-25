"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  credential_id: z.string().uuid(),
  asset_kind: z.enum(["nfc_tag", "rfid_card", "barcode", "qr_code"]),
  asset_serial: z.string().min(1).max(120),
});

export type State = { error?: string } | null;

export async function linkAssetAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase.from("asset_links").insert({
    org_id: session.orgId,
    credential_id: parsed.data.credential_id,
    asset_kind: parsed.data.asset_kind,
    asset_serial: parsed.data.asset_serial,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/people/credentials/asset-linker");
  return null;
}

export async function revokeLinkAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("asset_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId);
  revalidatePath("/console/people/credentials/asset-linker");
}
