"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PERSONA_TIERS } from "@/lib/db/guides";
import type { GuidePersona } from "@/lib/supabase/types";

const PERSONAS: GuidePersona[] = ["artist","vendor","client","sponsor","guest","crew","staff","custom"];

const Schema = z.object({
  persona: z.enum(PERSONAS as unknown as [GuidePersona, ...GuidePersona[]]),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).optional(),
  classification: z.string().max(200).optional(),
  published: z.string().optional(),
  config: z.string(), // JSON string
});

export type State = { error?: string } | null;

export async function upsertGuideAction(projectId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };

  let config: unknown;
  try { config = JSON.parse(parsed.data.config || "{}"); }
  catch { return { error: "Config is not valid JSON" }; }

  const tierInfo = PERSONA_TIERS[parsed.data.persona];

  const supabase = await createClient();
  const { error } = await supabase
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
        published: parsed.data.published === "on",
        config,
        created_by: session.userId,
      },
      { onConflict: "project_id,persona" },
    );
  if (error) return { error: error.message };
  revalidatePath(`/console/projects/${projectId}/guides`);
  revalidatePath(`/p`);
  return { error: undefined };
}

export async function togglePublishedAction(projectId: string, persona: GuidePersona, published: boolean) {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_guides")
    .update({ published })
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .eq("persona", persona);
  if (error) return { error: error.message };
  revalidatePath(`/console/projects/${projectId}/guides`);
  return { ok: true as const };
}
