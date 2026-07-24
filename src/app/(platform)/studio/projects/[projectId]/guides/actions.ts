"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, isManagerPlus, requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { writeInboxBulk } from "@/lib/inbox";
import { toTitle } from "@/lib/format";
import { PERSONA_TIERS } from "@/lib/db/guides";
import type { GuidePersona } from "@/lib/supabase/types";
import { recordTemplateVersion } from "@/lib/templates/versions";
import { formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const PERSONAS: GuidePersona[] = ["artist", "vendor", "client", "sponsor", "guest", "crew", "staff", "custom"];

const Schema = z.object({
  persona: z.enum(PERSONAS as unknown as [GuidePersona, ...GuidePersona[]]),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).optional(),
  classification: z.string().max(200).optional(),
  published: z.string().optional(),
  config: z.string(), // JSON string
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

/**
 * Fan out one inbox row (+ push) per project member when a guide goes live
 * or a live guide's content changes. Guides are project comms, so the
 * "announcement" kind applies (there is no dedicated guide kind). sourceId
 * is the guide id — idempotent per user, so a re-publish collapses onto the
 * existing row instead of duplicating (an update re-notify therefore reuses
 * the same source id; acceptable). Requires the service client to read
 * project_members across users (RLS bypass); without the key (local dev)
 * the publish still succeeds and fan-out is skipped.
 */
async function notifyGuidePublished(opts: {
  orgId: string;
  projectId: string;
  guideId: string;
  persona: GuidePersona;
  actorId: string;
  updated: boolean;
}): Promise<void> {
  if (!isServiceClientAvailable()) return;
  const service = createServiceClient();
  const { data: members } = await service
    .from("project_members")
    .select("user_id")
    .eq("project_id", opts.projectId);
  const userIds = Array.from(
    new Set(((members ?? []) as Array<{ user_id: string }>).map((m) => m.user_id).filter(Boolean)),
  );
  if (userIds.length === 0) return;
  const label = toTitle(opts.persona);
  await writeInboxBulk(userIds, {
    orgId: opts.orgId,
    kind: "announcement",
    sourceType: "event_guides",
    sourceId: opts.guideId,
    actorId: opts.actorId,
    title: opts.updated ? `Guide Updated: ${label}` : `Guide Published: ${label}`,
    href: "/m/guide",
    // A republish collapses onto the same row (stable sourceId). Without
    // reNotify a prior reader's row stays read and a genuine content update
    // never re-surfaces — the whole point of the update notice.
    reNotify: true,
  });
}

export async function upsertGuideAction(projectId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  let config: import("@/lib/supabase/database.types").Json;
  try {
    config = JSON.parse(parsed.data.config || "{}");
  } catch {
    return { error: actionErrorMessage("config-is-not-valid-json", "Config is not valid JSON") };
  }

  const tierInfo = PERSONA_TIERS[parsed.data.persona];

  const supabase = await createClient();
  // Prior row snapshot so we can tell "newly published" from "published
  // content changed" after the blind upsert below.
  const { data: prior } = await supabase
    .from("event_guides")
    .select("id, published, title, subtitle, config")
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .eq("persona", parsed.data.persona)
    .is("deleted_at", null)
    .maybeSingle();

  const nowPublished = parsed.data.published === "on";
  // soft-delete-exempt: upsert-returning — .select("id") reads back the row
  // just written, never an archived one.
  const { data: saved, error } = await supabase
    .from("event_guides")
    .upsert(
      {
        org_id: session.orgId,
        project_id: projectId,
        persona: parsed.data.persona,
        title: parsed.data.title,
        subtitle: parsed.data.subtitle ?? null,
        classification: parsed.data.classification ?? tierInfo.classification,
        tier: tierInfo.tier,
        published: nowPublished,
        config,
        created_by: session.userId,
      },
      { onConflict: "project_id,persona" },
    )
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };

  // Notify project members when the guide ends up published AND something
  // actually changed for them: it just went live, or a live guide's content
  // was edited. A no-op save of an already-published guide stays silent.
  if (nowPublished && saved?.id) {
    const newlyPublished = !prior?.published;
    const contentChanged =
      !prior ||
      prior.title !== parsed.data.title ||
      (prior.subtitle ?? null) !== (parsed.data.subtitle ?? null) ||
      JSON.stringify(prior.config ?? {}) !== JSON.stringify(config);
    if (newlyPublished || contentChanged) {
      await notifyGuidePublished({
        orgId: session.orgId,
        projectId,
        guideId: saved.id,
        persona: parsed.data.persona,
        actorId: session.userId,
        updated: !newlyPublished,
      });
    }
  }

  revalidatePath(`/studio/projects/${projectId}/guides`);
  revalidatePath(`/p`);
  return { error: undefined };
}

/**
 * Capture a project guide as an org-level guide template (template-management
 * program, 2026-07-24). The template lands in `org_guide_templates` as a
 * DRAFT — publishing it (LEG3ND library, /legend/hub/templates) is what makes
 * it seedable on other projects. Records version 1 in the template_versions
 * journal.
 */
export async function saveGuideAsTemplateAction(
  projectId: string,
  persona: GuidePersona,
): Promise<{ error?: string; ok?: true }> {
  const session = await requireSession();
  if (!isManagerPlus(session) && !can(session, "templates:write")) {
    return { error: actionErrorMessage("auth.manager-plus.manage-templates", "Only manager+ can manage templates") };
  }
  const supabase = await createClient();
  const { data: guide } = await supabase
    .from("event_guides")
    .select("title, subtitle, config, persona")
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .eq("persona", persona)
    .is("deleted_at", null)
    .maybeSingle();
  if (!guide) return { error: actionErrorMessage("not-found.guide", "Guide not found") };

  const { data: tpl, error } = await supabase
    .from("org_guide_templates")
    .insert({
      org_id: session.orgId,
      persona,
      name: guide.title,
      description: guide.subtitle ?? null,
      config: guide.config ?? {},
      template_state: "draft",
      source_project_id: projectId,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await recordTemplateVersion(supabase, {
    orgId: session.orgId,
    family: "guide",
    templateId: tpl.id,
    snapshot: {
      name: guide.title,
      description: guide.subtitle ?? null,
      persona,
      config: guide.config ?? {},
    },
    changedBy: session.userId,
  });

  revalidatePath(`/studio/projects/${projectId}/guides`);
  revalidatePath("/legend/hub/templates");
  return { ok: true };
}

/**
 * Seed a project guide from a PUBLISHED org guide template. Upserts the
 * (project, persona) row unpublished so the editor reviews before it goes
 * live, and records provenance via event_guides.template_id.
 */
export async function createGuideFromTemplateAction(
  projectId: string,
  templateId: string,
): Promise<{ error?: string; ok?: true; persona?: GuidePersona }> {
  const session = await requireSession();
  if (!isManagerPlus(session) && !can(session, "templates:write")) {
    return { error: actionErrorMessage("auth.manager-plus.manage-templates", "Only manager+ can manage templates") };
  }
  const parsedId = z.string().uuid().safeParse(templateId);
  if (!parsedId.success) return { error: actionErrorMessage("invalid.input", "Invalid input") };

  const supabase = await createClient();
  const { data: tpl } = await supabase
    .from("org_guide_templates")
    .select("id, persona, name, description, config")
    .eq("id", parsedId.data)
    .eq("org_id", session.orgId)
    .eq("template_state", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (!tpl) return { error: actionErrorMessage("not-found.template-in-org", "Template not found in your organization") };

  const persona = tpl.persona as GuidePersona;
  const tierInfo = PERSONA_TIERS[persona];
  const { error } = await supabase.from("event_guides").upsert(
    {
      org_id: session.orgId,
      project_id: projectId,
      persona,
      title: tpl.name,
      subtitle: tpl.description,
      classification: tierInfo.classification,
      tier: tierInfo.tier,
      published: false,
      config: tpl.config ?? {},
      template_id: tpl.id,
      created_by: session.userId,
    },
    { onConflict: "project_id,persona" },
  );
  if (error) return { error: error.message };

  revalidatePath(`/studio/projects/${projectId}/guides`);
  return { ok: true, persona };
}

export async function togglePublishedAction(projectId: string, persona: GuidePersona, published: boolean) {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("event_guides")
    .update({ published })
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .eq("persona", persona)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  // Going live is the moment the audience cares about; unpublishing stays
  // silent. Idempotent per user via sourceId, so a re-toggle collapses.
  if (published && updated?.id) {
    await notifyGuidePublished({
      orgId: session.orgId,
      projectId,
      guideId: updated.id,
      persona,
      actorId: session.userId,
      updated: false,
    });
  }
  revalidatePath(`/studio/projects/${projectId}/guides`);
  return { ok: true as const };
}
