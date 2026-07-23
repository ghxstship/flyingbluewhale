"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionErrorMessage } from "@/lib/errors";
import { getDocTemplate } from "@/lib/documents/registry";
import { DOC_BRAND_MODES } from "@/lib/documents/org-settings";

const LIBRARY_PATH = "/legend/hub/templates";
const DOCUMENTS_HUB_PATH = "/studio/documents";

const Schema = z.object({
  doc_type: z.string().min(1).max(64),
  enabled: z.enum(["true", "false"]),
  // "" = no org default (viewer default).
  default_brand: z.union([z.literal(""), z.enum(DOC_BRAND_MODES)]),
});

export type DocSettingState = { error?: string; ok?: true } | null;

/**
 * Configurator v1 — upsert one (org, doc_type) settings row. Doc types are
 * registry-fixed: the id must resolve in DOC_TEMPLATES, so orgs configure
 * (enable/disable, default brand) without ever forking the registry.
 * Disabled types disappear from creation pickers but stay renderable for
 * existing records (see src/lib/documents/org-settings.ts).
 */
export async function setDocTemplateSettingAction(
  _prev: DocSettingState,
  fd: FormData,
): Promise<DocSettingState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return {
      error: actionErrorMessage("auth.manager-plus.edit-documents", "Only manager+ can edit documents"),
    };
  }
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: actionErrorMessage("invalid.input", "Invalid input") };
  if (!getDocTemplate(parsed.data.doc_type)) {
    return { error: actionErrorMessage("invalid.input", "Invalid input") };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("org_doc_template_settings").upsert(
    {
      org_id: session.orgId,
      doc_type: parsed.data.doc_type,
      enabled: parsed.data.enabled === "true",
      default_brand: parsed.data.default_brand === "" ? null : parsed.data.default_brand,
    },
    { onConflict: "org_id,doc_type" },
  );
  if (error) return { error: error.message };

  revalidatePath(LIBRARY_PATH);
  revalidatePath(DOCUMENTS_HUB_PATH);
  return { ok: true };
}
