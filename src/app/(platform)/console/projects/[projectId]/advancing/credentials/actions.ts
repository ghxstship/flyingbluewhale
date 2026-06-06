"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";
import { DIGITAL_CREDENTIAL_TYPES } from "@/lib/open-shifts";

const IssueSchema = z.object({
  project_id: z.string().uuid(),
  holder_id: z.string().uuid(),
  credential_title: z.string().min(1).max(200),
  credential_type: z.enum(DIGITAL_CREDENTIAL_TYPES),
  description: z.string().max(2000).optional().or(z.literal("")),
  expires_at: z.string().optional().or(z.literal("")),
  deliverable_id: z.string().uuid().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function issueCredentialAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager+ required" };

  const parsed = IssueSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.from("digital_credentials").insert({
    org_id: session.orgId,
    project_id: parsed.data.project_id,
    deliverable_id: parsed.data.deliverable_id || null,
    holder_id: parsed.data.holder_id,
    credential_title: parsed.data.credential_title,
    credential_type: parsed.data.credential_type,
    description: parsed.data.description || null,
    expires_at: parsed.data.expires_at || null,
    created_by: session.userId,
  });

  if (error) return { error: error.message };

  await sendPushTo(parsed.data.holder_id, {
    title: "Credential issued",
    body: `Your ${parsed.data.credential_title} credential is now available`,
    url: "/m/credentials",
    kind: "credential",
    scope: "mobile",
    orgId: session.orgId,
  });

  revalidatePath(`/console/projects/${parsed.data.project_id}/advancing/credentials`);
  return null;
}

const RevokeSchema = z.object({
  credential_id: z.string().uuid(),
  project_id: z.string().uuid(),
  reason: z.string().max(500).optional().or(z.literal("")),
});

export async function revokeCredentialAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager+ required" };

  const parsed = RevokeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("digital_credentials")
    .update({
      is_revoked: true,
      revoked_at: new Date().toISOString(),
      revoked_by: session.userId,
      revocation_reason: parsed.data.reason || null,
    })
    .eq("id", parsed.data.credential_id)
    .eq("org_id", session.orgId)
    .eq("is_revoked", false)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Credential not found or already revoked" };

  revalidatePath(`/console/projects/${parsed.data.project_id}/advancing/credentials`);
  return null;
}
