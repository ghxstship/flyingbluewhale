"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { managerUserIds } from "@/lib/db/managers";

export type State = { error?: string; fieldErrors?: Record<string, string> } | null;

/** Map the kit `status` seg labels → the `handovers.post_state` enum. */
const POST_STATE: Record<string, "all_clear" | "watch_items" | "issues"> = {
  "All Clear": "all_clear",
  "Watch Items": "watch_items",
  Issues: "issues",
};

const STATE_LABEL: Record<string, string> = {
  all_clear: "All Clear",
  watch_items: "Watch Items",
  issues: "Issues",
};

const Input = z.object({
  // kit handover form field ids
  relief: z.string().optional(),
  status: z.string().optional(),
  summary: z.string().min(1, "Add a shift summary."),
  open: z.string().optional(),
  assets: z.string().optional(),
  projectId: z.string().uuid().optional(),
});

/**
 * Submit a shift handover into the dedicated 3NF `handovers` table
 * (org_id, project_id, from_user_id, post_state, summary, open_items,
 * assets_passed). RLS enforces `from_user_id = auth.uid()`, so we set it to
 * the session user. The manager band is then push-notified.
 */
export async function submitHandover(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;
  const supabase = await createClient();

  // Resolve the project: caller-supplied (validated) or the org's most recent.
  // Optional on the handovers table, but we attach one when available.
  let projectId = v.projectId ?? null;
  if (projectId) {
    const { data: proj } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!proj) return { error: "That project is not in your organization." };
  } else {
    const { data: proj } = await supabase
      .from("projects")
      .select("id")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    projectId = (proj as { id: string } | null)?.id ?? null;
  }

  const postState = POST_STATE[v.status ?? "All Clear"] ?? "all_clear";

  const { error } = await supabase.from("handovers").insert({
    org_id: session.orgId,
    project_id: projectId,
    from_user_id: session.userId,
    relief_label: v.relief ?? null,
    post_state: postState,
    summary: v.summary,
    open_items: v.open ?? null,
    assets_passed: v.assets ?? null,
  });
  if (error) return { error: error.message };

  const managers = await managerUserIds(session.orgId, session.userId);
  if (managers.length) {
    await sendPushBulk(managers, {
      title: "Shift Handover Submitted",
      body: `${STATE_LABEL[postState]} · ${v.summary.slice(0, 80)}`,
      url: "/m/handover",
      kind: "announcement",
      scope: "mobile",
      orgId: session.orgId,
    });
  }

  revalidatePath("/m/handover");
  return null;
}
