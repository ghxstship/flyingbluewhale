"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  portal_user_id: z.string().uuid(),
  manager_user_id: z.string().uuid(),
  persona: z.enum([
    "artist",
    "athlete",
    "client",
    "crew",
    "delegation",
    "guest",
    "hospitality",
    "media",
    "producer",
    "promoter",
    "sponsor",
    "stakeholder",
    "vendor",
    "vip",
    "volunteer",
  ]),
  project_id: z.string().uuid().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createAssignment(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.pair-account-managers", "Only manager+ can pair account managers") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  if (parsed.data.portal_user_id === parsed.data.manager_user_id) {
    return { error: actionErrorMessage("portal-user-and-account-manager-must-be-different-people", "Portal user and account manager must be different people") };
  }
  const supabase = await createClient();

  // Both ends must be in the org. RLS gates the insert too but explicit
  // checks surface a clean error message.
  const userIds = [parsed.data.portal_user_id, parsed.data.manager_user_id];
  const { data: members } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .in("user_id", userIds)
    .is("deleted_at", null);
  const memberIds = new Set(((members ?? []) as Array<{ user_id: string }>).map((m) => m.user_id));
  if (!memberIds.has(parsed.data.portal_user_id)) return { error: actionErrorMessage("portal-user-is-not-in-your-organization", "Portal user is not in your organization") };
  if (!memberIds.has(parsed.data.manager_user_id)) return { error: actionErrorMessage("manager-is-not-in-your-organization", "Manager is not in your organization") };

  if (parsed.data.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", parsed.data.project_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: actionErrorMessage("not-found.project-2", "Project not found") };
  }

  const { data, error } = await supabase
    .from("account_manager_assignments")
    .insert({
      org_id: session.orgId,
      portal_user_id: parsed.data.portal_user_id,
      manager_user_id: parsed.data.manager_user_id,
      persona: parsed.data.persona,
      project_id: parsed.data.project_id || null,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/settings/account-managers");
  redirect(`/studio/settings/account-managers/${data.id}`);
}
