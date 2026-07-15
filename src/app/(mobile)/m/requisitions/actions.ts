"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { managerUserIds } from "@/lib/db/managers";

export type State = { error?: string; fieldErrors?: Record<string, string> } | null;

const Input = z.object({
  title: z.string().min(1, "What do you need?").max(200),
  description: z.string().max(2000).optional(),
  // Dollars in the form; cents in the column. Crew think in dollars.
  estimated: z.string().optional(),
  projectId: z.string().uuid().optional().or(z.literal("")),
});

function toCents(v: string | undefined): number | null {
  if (!v || !v.trim()) return null;
  const n = Number(v.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/**
 * Raise a purchase requisition from site.
 *
 * The canonical "need it now" intake — the console's own One Front Door
 * lists Purchase Requisition as one of its five Requests — and the field
 * couldn't file one. RLS excluded the crew persona outright until
 * `20260715160000`; this is the surface that block was hiding.
 *
 * `requisition_state` stays at the column default (`draft`). Submitting
 * for approval is a separate act with its own routing, and the field's job
 * here is to get the need recorded before it's forgotten — not to drive an
 * approval chain from a phone.
 */
export async function createFieldRequisition(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;
  const supabase = await createClient();

  // Cross-tenant FK guard, same as the console's create action: a supplied
  // project must belong to the caller's org, or the row carries a dangling
  // cross-org reference under an honest-looking org_id.
  const projectId = v.projectId || null;
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization." };
  }

  const { error } = await supabase.from("requisitions").insert({
    org_id: session.orgId,
    // The RLS grant is `requester_id = auth.uid()` — a member may raise a
    // requisition only in their own name. Setting it from the session
    // rather than the form is what makes that true.
    requester_id: session.userId,
    title: v.title,
    description: v.description || null,
    estimated_cents: toCents(v.estimated),
    project_id: projectId,
  });
  if (error) return { error: error.message };

  // A requisition nobody sees is a note to self.
  const managers = await managerUserIds(session.orgId, session.userId);
  if (managers.length) {
    await sendPushBulk(managers, {
      title: "Purchase Requisition Raised",
      body: v.title.slice(0, 120),
      url: "/m/requisitions",
      kind: "announcement",
      scope: "all",
      orgId: session.orgId,
    });
  }

  revalidatePath("/m/requisitions");
  redirect("/m/requisitions");
}
