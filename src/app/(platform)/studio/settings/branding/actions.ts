"use server";

import { revalidatePath } from "next/cache";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { safeBranding } from "@/lib/branding";

export type BrandingState = { error?: string; ok?: true } | null;

export async function updateBrandingAction(_prev: BrandingState, fd: FormData): Promise<BrandingState> {
  const session = await requireSession();
  // Defense-in-depth on top of RLS: gate at the application layer so a
  // non-admin gets a clear `forbidden` instead of a misleading
  // `{ok:true}` after RLS silently dropped the write to 0 rows. Same
  // pattern as console/projects/[id]/branding/actions.ts.
  if (!isAdmin(session)) return { error: "Only owners and admins can edit org branding" };
  const supabase = await createClient();
  const branding = safeBranding({
    accentColor: (fd.get("accentColor") as string) || undefined,
    accentForeground: (fd.get("accentForeground") as string) || undefined,
    secondaryColor: (fd.get("secondaryColor") as string) || undefined,
    logoUrl: (fd.get("logoUrl") as string) || undefined,
    faviconUrl: (fd.get("faviconUrl") as string) || undefined,
    heroImageUrl: (fd.get("heroImageUrl") as string) || undefined,
    ogImageUrl: (fd.get("ogImageUrl") as string) || undefined,
    productName: (fd.get("productName") as string) || undefined,
  });
  const logoUrl = (fd.get("logoUrl") as string) || null;
  const nameOverride = (fd.get("productName") as string) || null;
  const { data, error } = await supabase
    .from("orgs")
    .update({ branding: branding as unknown as never, logo_url: logoUrl, name_override: nameOverride })
    .eq("id", session.orgId)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Org not found in your session" };
  revalidatePath("/studio/settings/branding");
  revalidatePath("/studio");
  return { ok: true };
}
