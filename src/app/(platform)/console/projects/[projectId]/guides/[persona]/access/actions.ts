"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createAccessCode, revokeAccessCode } from "@/lib/db/guide-access";
import type { GuidePersona } from "@/lib/supabase/types";

const PERSONAS: GuidePersona[] = [
  "staff",
  "crew",
  "vendor",
  "brand_ambassador",
  "sponsor",
  "artist",
  "media_press",
  "client",
];

const CreateSchema = z.object({
  persona: z.enum(PERSONAS as unknown as [GuidePersona, ...GuidePersona[]]),
  label: z.string().trim().max(120).optional(),
  expires_in_days: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? Number(v) : null)),
  max_uses: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? Number(v) : null)),
});

export type CreateState = { ok: true; plainCode: string; persona: GuidePersona } | { error: string } | null;

export async function createCodeAction(projectId: string, _: CreateState, fd: FormData): Promise<CreateState> {
  const session = await requireSession();
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const expiresAt =
    typeof parsed.data.expires_in_days === "number" && !Number.isNaN(parsed.data.expires_in_days)
      ? new Date(Date.now() + parsed.data.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;
  const maxUses =
    typeof parsed.data.max_uses === "number" && !Number.isNaN(parsed.data.max_uses) && parsed.data.max_uses > 0
      ? parsed.data.max_uses
      : null;
  try {
    const { plainCode } = await createAccessCode({
      orgId: session.orgId,
      projectId,
      persona: parsed.data.persona,
      label: parsed.data.label ?? null,
      expiresAt,
      maxUses,
      createdBy: session.userId,
    });
    revalidatePath(`/console/projects/${projectId}/guides/${parsed.data.persona}/access`);
    return { ok: true, plainCode, persona: parsed.data.persona };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create code" };
  }
}

export async function revokeCodeAction(projectId: string, persona: GuidePersona, codeId: string) {
  await requireSession();
  try {
    await revokeAccessCode(codeId);
    revalidatePath(`/console/projects/${projectId}/guides/${persona}/access`);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to revoke code" };
  }
}
