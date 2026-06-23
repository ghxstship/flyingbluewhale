"use server";

import { revalidatePath } from "next/cache";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { safeBranding } from "@/lib/branding";

export type ClientBrandingState = { error?: string; ok?: true } | null;

/**
 * Persist a client's brand identity (logo + accent/secondary). This is the
 * "client" layer of the co-brand cascade — e.g. Club Space's circle logo
 * that appears in the proposal hero lockup and the invoice bill-to.
 * Manager+ may edit (same band as proposal authoring); RLS enforces org scope.
 */
export async function updateClientBrandingAction(
  clientId: string,
  _prev: ClientBrandingState,
  fd: FormData,
): Promise<ClientBrandingState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit client branding" };

  const branding = safeBranding({
    accentColor: (fd.get("accentColor") as string) || undefined,
    accentForeground: (fd.get("accentForeground") as string) || undefined,
    secondaryColor: (fd.get("secondaryColor") as string) || undefined,
    logoUrl: (fd.get("logoUrl") as string) || undefined,
  });
  const logoUrl = (fd.get("logoUrl") as string) || null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .update({ branding: branding as unknown as never, logo_url: logoUrl })
    .eq("id", clientId)
    .eq("org_id", session.orgId)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Client not found in your organization" };
  revalidatePath(`/studio/clients/${clientId}/branding`);
  return { ok: true };
}
