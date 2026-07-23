"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { safeBranding } from "@/lib/branding";
import type { Json } from "@/lib/supabase/database.types";
import type { FormState } from "@/components/FormShell";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  projectId: z.string().uuid(),
  accentColor: z.string().optional(),
  accentForeground: z.string().optional(),
  secondaryColor: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  heroImageUrl: z.string().optional(),
  ogImageUrl: z.string().optional(),
});

export async function saveBrandingAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: actionErrorMessage("invalid.input", "Invalid input") };

  // Defense-in-depth on top of RLS: gate at the application layer so an
  // unauthenticated or under-privileged user gets a clear `forbidden`
  // response instead of a misleading `{ok:true}` after RLS silently
  // dropped the write to 0 rows.
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return { error: actionErrorMessage("only-owner-admin-manager-can-edit-project-branding", "Only owner / admin / manager can edit project branding") };
  }

  const { projectId, ...rawBranding } = parsed.data;
  const sanitized = safeBranding(rawBranding);

  const supabase = await createClient();
  // .is("deleted_at", null) — refuse to mutate branding on a soft-
  // deleted project. The detail page hides them, so a stale tab is
  // the only way to land here, and silently writing would just
  // orphan a brand on a tombstoned record.
  const { error, count } = await supabase
    .from("projects")
    .update({ branding: sanitized as unknown as Json }, { count: "exact" })
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);

  if (error) return { error: error.message };
  if (!count || count === 0) {
    // RLS or org_id filter rejected the write — the project doesn't exist
    // in this org, or the caller's role doesn't permit branding edits.
    return { error: actionErrorMessage("not-found.project-in-org", "Project not found in your organization") };
  }

  revalidatePath(`/studio/projects/${projectId}/branding`);
  return { ok: true };
}
