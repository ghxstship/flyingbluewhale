"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { DeliverableType } from "@/lib/supabase/types";
import { recordTemplateVersion } from "@/lib/templates/versions";
import { actionErrorMessage } from "@/lib/errors";
import { formFail } from "@/lib/forms/fail";

/**
 * Deliverable-template management (template-management program, 2026-07-24).
 * First org-facing surface for `deliverable_templates` — previously API-only
 * (/api/v1/deliverable-templates). Gate: manager band or a `templates:write`
 * grant (RLS independently enforces the manager band).
 */

const SETTINGS_PATH = "/studio/settings/deliverable-templates";
const LIBRARY_PATH = "/legend/hub/templates";

const DELIVERABLE_TYPES = Constants.public.Enums.deliverable_type;

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(DELIVERABLE_TYPES as unknown as [string, ...string[]]),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createDeliverableTemplateAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session) && !can(session, "templates:write")) {
    return { error: actionErrorMessage("auth.manager-plus.manage-templates", "Only manager+ can manage templates") };
  }
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  // soft-delete-exempt: insert-returning — .select("id") reads back the row just created
  const { data, error } = await supabase
    .from("deliverable_templates")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      type: parsed.data.type as DeliverableType,
      description: parsed.data.description || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await recordTemplateVersion(supabase, {
    orgId: session.orgId,
    family: "deliverable",
    templateId: data.id,
    snapshot: {
      name: parsed.data.name,
      type: parsed.data.type,
      description: parsed.data.description || null,
      data: {},
    },
    changedBy: session.userId,
  });

  revalidatePath(SETTINGS_PATH);
  revalidatePath(LIBRARY_PATH);
  return { ok: true };
}

export async function archiveDeliverableTemplateAction(id: string): Promise<{ error?: string; ok?: true }> {
  const session = await requireSession();
  if (!isManagerPlus(session) && !can(session, "templates:write")) {
    return { error: actionErrorMessage("auth.manager-plus.manage-templates", "Only manager+ can manage templates") };
  }
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: actionErrorMessage("invalid.input", "Invalid input") };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deliverable_templates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id");
  if (error) return { error: error.message };
  // RLS returns no error on a filtered-out row — read the write back.
  if (!data || data.length === 0) {
    return { error: actionErrorMessage("not-found.template-in-org", "Template not found in your organization") };
  }

  revalidatePath(SETTINGS_PATH);
  revalidatePath(LIBRARY_PATH);
  return { ok: true };
}
