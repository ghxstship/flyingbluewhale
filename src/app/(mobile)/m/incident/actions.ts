"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { managerUserIds } from "@/lib/db/managers";

export type State = { error?: string } | null;

const Input = z.object({
  summary: z.string().min(1, "Describe the incident."),
});

/**
 * Express quick-file — one-field incident capture from the field. Defaults
 * severity to `minor`, state to `open`, occurred_at to now, and pings the
 * manager band. Full detail can be added later from the Ops console.
 */
export async function quickFileIncident(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please describe the incident." };
  }
  const summary = parsed.data.summary.trim();

  const supabase = await createClient();
  const { error } = await supabase.from("incidents").insert({
    org_id: session.orgId,
    reporter_id: session.userId,
    summary: summary.slice(0, 140),
    severity: "minor",
    incident_state: "open",
    occurred_at: new Date().toISOString(),
    // `photos` is intentionally omitted, not set to []: express capture is a
    // single-field surface with no photo picker, and the column already
    // defaults to '[]'. Restating the default here reads as "we considered
    // photos and there are none", which is the exact ambiguity that let the
    // full incident form hard-code an empty array while its UI promised
    // evidence. Full capture lives at /m/incidents/new.
    report_kind: "safety",
  });
  if (error) return { error: error.message };

  const managers = await managerUserIds(session.orgId, session.userId);
  if (managers.length) {
    await sendPushBulk(managers, {
      title: "New Incident Filed",
      body: summary.slice(0, 120),
      url: "/m/incidents",
      kind: "incident",
      scope: "mobile",
      orgId: session.orgId,
    });
  }

  revalidatePath("/m/incident");
  revalidatePath("/m/incidents");
  return null;
}
