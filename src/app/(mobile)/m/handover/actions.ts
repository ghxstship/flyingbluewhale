"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { managerUserIds } from "@/lib/db/managers";
import { HANDOVER_MARKER } from "./shared";

export type State = { error?: string; fieldErrors?: Record<string, string> } | null;

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
 * Submit a shift handover. There is no dedicated handover table — the handover
 * is persisted as a marked note on today's `daily_logs` row for the chosen
 * project (appended, append-only style), then the manager band is notified.
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
  if (!projectId) return { error: "No project available to log a handover against." };

  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    `${HANDOVER_MARKER} ${v.status ?? "All Clear"} — handed to ${v.relief ?? "next crew"}`,
    `Summary: ${v.summary}`,
    v.open ? `Open items: ${v.open}` : null,
    v.assets ? `Assets/keys passed: ${v.assets}` : null,
    `— ${session.email} @ ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
  ]
    .filter(Boolean)
    .join("\n");

  // Read any existing note for today so we append rather than clobber.
  const { data: existing } = await supabase
    .from("daily_logs")
    .select("id, notes")
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .eq("log_date", today)
    .maybeSingle();
  const prevNotes = (existing as { notes: string | null } | null)?.notes ?? "";
  const notes = prevNotes ? `${prevNotes}\n\n${lines}` : lines;

  const { error } = await supabase.from("daily_logs").upsert(
    {
      org_id: session.orgId,
      project_id: projectId,
      log_date: today,
      notes,
      log_state: "draft",
      created_by: session.userId,
    },
    { onConflict: "org_id,project_id,log_date" },
  );
  if (error) return { error: error.message };

  const managers = await managerUserIds(session.orgId, session.userId);
  if (managers.length) {
    await sendPushBulk(managers, {
      title: "Shift Handover Submitted",
      body: `${v.status ?? "All Clear"} · ${v.summary.slice(0, 80)}`,
      url: "/m/handover",
      kind: "announcement",
      scope: "mobile",
      orgId: session.orgId,
    });
  }

  revalidatePath("/m/handover");
  return null;
}
