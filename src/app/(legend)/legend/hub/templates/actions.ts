"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionErrorMessage } from "@/lib/errors";
import { getDocTemplate } from "@/lib/documents/registry";
import { DOC_BRAND_MODES } from "@/lib/documents/org-settings";
import type { LooseSupabase } from "@/lib/supabase/loose";

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
 *
 * Gate: manager band, or a `templates:write` add-on grant (ADR-0015) — the
 * grant lets an org delegate template curation without a role promotion.
 */
export async function setDocTemplateSettingAction(
  _prev: DocSettingState,
  fd: FormData,
): Promise<DocSettingState> {
  const session = await requireSession();
  if (!isManagerPlus(session) && !can(session, "templates:write")) {
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

const GUIDE_TEMPLATE_STATES = ["draft", "published", "archived"] as const;
const GuideStateSchema = z.object({
  template_id: z.string().uuid(),
  state: z.enum(GUIDE_TEMPLATE_STATES),
});

/**
 * Guide-template lifecycle — draft ⇄ published → archived (archive is
 * reversible back to draft via unpublish; the enum is cyclical, hence
 * *_state per LDP). Only PUBLISHED templates are offered by the
 * start-from-template picker on /studio/projects/[projectId]/guides.
 *
 * `templates:publish` grants publish/unpublish specifically; `templates:write`
 * covers the rest, and the manager band covers everything (base floor).
 */
export async function setGuideTemplateStateAction(
  templateId: string,
  state: (typeof GUIDE_TEMPLATE_STATES)[number],
): Promise<DocSettingState> {
  const session = await requireSession();
  const isPublishMove = state === "published";
  const allowed = isManagerPlus(session)
    ? true
    : isPublishMove
      ? can(session, "templates:publish")
      : can(session, "templates:write") || can(session, "templates:publish");
  if (!allowed) {
    return {
      error: actionErrorMessage("auth.manager-plus.manage-templates", "Only manager+ can manage templates"),
    };
  }
  const parsed = GuideStateSchema.safeParse({ template_id: templateId, state });
  if (!parsed.success) return { error: actionErrorMessage("invalid.input", "Invalid input") };

  const supabase = await createClient();
  // org_guide_templates is not in the generated client types yet (regen
  // deferred while another migration is in flight).
  const loose = supabase as unknown as LooseSupabase;
  const { data, error } = await loose
    .from("org_guide_templates")
    .update({ template_state: parsed.data.state })
    .eq("id", parsed.data.template_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id");
  if (error) return { error: error.message };
  // RLS returns no error on a filtered-out row — read the write back.
  if (!data || (data as unknown[]).length === 0) {
    return { error: actionErrorMessage("not-found.template-in-org", "Template not found in your organization") };
  }

  revalidatePath(LIBRARY_PATH);
  return { ok: true };
}
