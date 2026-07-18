"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { managerUserIds } from "@/lib/db/managers";
import { emitAudit } from "@/lib/audit";

export type State = { error?: string } | null;

const Input = z.object({
  summary: z.string().min(1, "Describe the incident."),
  // Kit 32 A2: optional parent report — this filing is a follow-up on its
  // status chain.
  followUpOf: z.string().uuid().optional(),
});

/**
 * Express quick-file — one-field incident capture from the field. Defaults
 * severity to `minor`, state to `open`, occurred_at to now, and pings the
 * manager band with a deep link to the REAL report record (kit 32 A2 — a
 * notification about a report opens the report, not a list).
 *
 * As a follow-up (`followUpOf`), the parent is verified org-scoped, the new
 * row's description names the chain, and the parent's status chain gains an
 * `incident.follow_up_filed` audit event — the same ledger the record's
 * timeline renders.
 */
export async function quickFileIncident(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please describe the incident." };
  }
  const summary = parsed.data.summary.trim();

  const supabase = await createClient();

  // A follow-up must chain to a real, same-org report — otherwise file it
  // as a plain incident rather than fabricating a parent.
  let parent: { id: string; summary: string } | null = null;
  if (parsed.data.followUpOf) {
    const { data } = await supabase
      .from("incidents")
      .select("id, summary")
      .eq("id", parsed.data.followUpOf)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (data) parent = { id: data.id as string, summary: data.summary as string };
  }

  // soft-delete-exempt: INSERT returning its own row via .select() — the row
  // was just written, so no archived row can surface.
  const { data: created, error } = await supabase
    .from("incidents")
    .insert({
      org_id: session.orgId,
      reporter_id: session.userId,
      summary: summary.slice(0, 140),
      description: parent ? `Follow-up to "${parent.summary}" (${parent.id.slice(0, 5).toUpperCase()}).` : null,
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
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  const newId = (created as { id: string }).id;

  if (parent) {
    // The parent's status chain shows the follow-up — same audit ledger the
    // record detail's timeline reads.
    await emitAudit({
      actorId: session.userId,
      orgId: session.orgId,
      actorEmail: session.email,
      action: "incident.follow_up_filed",
      targetTable: "incidents",
      targetId: parent.id,
      metadata: { followUpId: newId, summary: summary.slice(0, 140) },
    });
  }

  const managers = await managerUserIds(session.orgId, session.userId);
  if (managers.length) {
    await sendPushBulk(managers, {
      title: parent ? "Incident Follow-Up Filed" : "New Incident Filed",
      body: summary.slice(0, 120),
      url: `/m/incidents/${newId}`,
      kind: "incident",
      scope: "mobile",
      orgId: session.orgId,
    });
  }

  revalidatePath("/m/incident");
  revalidatePath("/m/incidents");
  if (parent) revalidatePath(`/m/incidents/${parent.id}`);
  return null;
}
