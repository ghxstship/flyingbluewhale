"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeBranding } from "@/lib/branding";
import type { Json } from "@/lib/supabase/database.types";
import type { FormState } from "@/components/FormShell";

const Schema = z.object({
  projectId: z.string().uuid(),
  accentColor: z.string().optional(),
  accentForeground: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  heroImageUrl: z.string().optional(),
  ogImageUrl: z.string().optional(),
});

export async function saveBrandingAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input" };

  const { projectId, ...rawBranding } = parsed.data;
  const sanitized = safeBranding(rawBranding);

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ branding: sanitized as unknown as Json })
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/console/projects/${projectId}/branding`);
  return { ok: true };
}
