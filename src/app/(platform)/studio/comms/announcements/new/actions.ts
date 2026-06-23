"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { writeInbox, writeInboxBulk } from "@/lib/inbox";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(8000),
  audience: z.enum(["all", "crew", "contractors", "vendors", "admins"]),
  project_id: z.string().uuid().optional().or(z.literal("")),
  team_id: z.string().uuid().optional().or(z.literal("")),
  pinned: z.string().optional(),
  publish_now: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createAnnouncementAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Org-wide announcements broadcast — manager+ only.
  if (!isManagerPlus(session)) return { error: "Only manager+ can publish announcements" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const publish = parsed.data.publish_now === "on";
  const projectId = parsed.data.project_id || null;
  const teamId = parsed.data.team_id || null;

  // Cross-tenant FK guards on the optional scope filters.
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization" };
  }
  if (teamId) {
    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("id", teamId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!team) return { error: "Team not found in your organization" };
  }

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      org_id: session.orgId,
      author_id: session.userId,
      title: parsed.data.title,
      body: parsed.data.body,
      audience: parsed.data.audience,
      project_id: projectId,
      team_id: teamId,
      pinned: parsed.data.pinned === "on",
      publish_state: publish ? "published" : "draft",
      published_at: publish ? new Date().toISOString() : null,
    } as never)
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  // Fan out push notifications when the announcement is published. We
  // target org members whose membership role matches the audience
  // ('all' → everyone in the org). Drafts don't fan out.
  //
  // Push fan-out requires SUPABASE_SERVICE_ROLE_KEY (we need to read
  // memberships across users, bypassing RLS). When the env-var is missing
  // (local dev without the key), the announcement still publishes — push
  // is best-effort, not a write-time hard dependency. Without this guard,
  // dev-mode publish 500s and the user never sees their announcement
  // saved.
  if (publish && isServiceClientAvailable()) {
    const service = createServiceClient();
    const roleFilter: ("owner" | "admin" | "manager" | "member")[] | null =
      parsed.data.audience === "all"
        ? null
        : parsed.data.audience === "admins"
          ? ["owner", "admin"]
          : parsed.data.audience === "crew"
            ? ["member"]
            : null;
    let query = service.from("memberships").select("user_id").eq("org_id", session.orgId).is("deleted_at", null);
    if (roleFilter) query = query.in("role", roleFilter);
    const { data: recipients } = await query;
    let userIds = ((recipients ?? []) as Array<{ user_id: string }>).map((r) => r.user_id);

    // Team filter narrows the role-band cohort to actual team members.
    if (teamId && userIds.length > 0) {
      const { data: teamMembers } = await service
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamId)
        .in("user_id", userIds);
      const teamSet = new Set(((teamMembers ?? []) as Array<{ user_id: string }>).map((r) => r.user_id));
      userIds = userIds.filter((id) => teamSet.has(id));
    }
    // Project filter narrows further to users with a project membership.
    if (projectId && userIds.length > 0) {
      const { data: projectMembers } = await service
        .from("project_members")
        .select("user_id")
        .eq("project_id", projectId)
        .in("user_id", userIds);
      const projectSet = new Set(((projectMembers ?? []) as Array<{ user_id: string }>).map((r) => r.user_id));
      userIds = userIds.filter((id) => projectSet.has(id));
    }
    if (userIds.length > 0) {
      // writeInboxBulk lands the same payload on the in-app inbox AND
      // fires push fan-out — gated by each user's per-kind preference
      // matrix. Replaces the previous push-only call which left the
      // /me/notifications/inbox stream empty.
      void writeInboxBulk(userIds, {
        orgId: session.orgId,
        kind: "announcement",
        sourceType: "announcements",
        sourceId: data.id,
        actorId: session.userId,
        title: parsed.data.title,
        body: parsed.data.body,
        href: "/m/feed",
      });
    }
  }

  // Always write a self-row for the publisher even when service key
  // isn't available — RLS lets them write their own. Without this,
  // dev environments leave the author's inbox empty after publish.
  if (publish) {
    void writeInbox({
      userId: session.userId,
      orgId: session.orgId,
      kind: "announcement",
      sourceType: "announcements",
      sourceId: data.id,
      actorId: session.userId,
      title: parsed.data.title,
      body: parsed.data.body,
      href: "/m/feed",
      push: false, // author doesn't need to push to themselves
    });
  }

  revalidatePath("/studio/comms/announcements");
  redirect(`/studio/comms/announcements/${data.id}`);
}
