"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { managerUserIds } from "@/lib/db/managers";

export type State = { error?: string; fieldErrors?: Record<string, string> } | null;

/** Kit `incident` form severity seg → DB incident_severity enum. */
const SEVERITY_MAP: Record<string, "near_miss" | "minor" | "major" | "critical"> = {
  High: "critical",
  Medium: "minor",
  Low: "near_miss",
};

const Input = z.object({
  // kit incident form field ids
  severity: z.string().optional(),
  injury: z.string().optional(),
  where: z.string().optional(),
  when: z.string().optional(),
  what: z.string().min(1, "Describe what happened."),
  action: z.string().optional(),
  anon: z.string().optional(),
  // optional caller-supplied project scope
  projectId: z.string().uuid().optional(),
});

/**
 * File a field incident report → inserts an `incidents` row (org-scoped,
 * reporter = caller, severity mapped from the kit seg, initial state `open`),
 * then push-notifies the org's manager band so Ops sees it immediately.
 */
export async function fileIncident(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;
  const severity = SEVERITY_MAP[v.severity ?? "Medium"] ?? "minor";
  const description = [v.what, v.action ? `Immediate action: ${v.action}` : null].filter(Boolean).join("\n\n");

  // The injury switch has to reach a column, not just prose. It used to
  // only append "Injuries involved." to the description, which meant
  // injury_type stayed null — and the Lost & Found lens (which keyed off
  // exactly that) swallowed every field-filed injury. `reported` is the
  // honest value the intake can assert; the specific injury type is
  // classified downstream on the console.
  const injuryType = v.injury ? "reported" : null;

  const supabase = await createClient();
  const { error } = await supabase.from("incidents").insert({
    org_id: session.orgId,
    project_id: v.projectId ?? null,
    reporter_id: session.userId,
    summary: v.what.slice(0, 140),
    description,
    severity,
    incident_state: "open",
    location: v.where || null,
    occurred_at: new Date().toISOString(),
    photos: [],
    injury_type: injuryType,
    // This intake is the safety intake. Lost property comes through the
    // lost & found intake, which sets `lost_property`.
    report_kind: "safety",
  });
  if (error) return { error: error.message };

  const managers = await managerUserIds(session.orgId, session.userId);
  if (managers.length) {
    await sendPushBulk(
      managers,
      {
        title: "New Incident Filed",
        body: v.what.slice(0, 120),
        url: "/m/incidents",
        kind: "incident",
        scope: "mobile",
        orgId: session.orgId,
      },
    );
  }

  revalidatePath("/m/incidents");
  return null;
}
