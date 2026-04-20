"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { safeBranding } from "@/lib/branding";

export type BrandingState = { error?: string; ok?: true } | null;

export async function updateBrandingAction(_prev: BrandingState, fd: FormData): Promise<BrandingState> {
  const session = await requireSession();
  const supabase = await createClient();
  const branding = safeBranding({
    accentColor: (fd.get("accentColor") as string) || undefined,
    accentForeground: (fd.get("accentForeground") as string) || undefined,
    logoUrl: (fd.get("logoUrl") as string) || undefined,
    faviconUrl: (fd.get("faviconUrl") as string) || undefined,
    heroImageUrl: (fd.get("heroImageUrl") as string) || undefined,
    ogImageUrl: (fd.get("ogImageUrl") as string) || undefined,
    productName: (fd.get("productName") as string) || undefined,
  });
  const logoUrl = (fd.get("logoUrl") as string) || null;
  const nameOverride = (fd.get("productName") as string) || null;
  const { error } = await supabase
    .from("orgs")
    .update({ branding: branding as unknown as never, logo_url: logoUrl, name_override: nameOverride })
    .eq("id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath("/console/settings/branding");
  revalidatePath("/console");
  return { ok: true };
}
