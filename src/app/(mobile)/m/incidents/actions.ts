"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { managerUserIds } from "@/lib/db/managers";
import { filesFrom, fixesFrom, uploadFieldPhotos } from "@/lib/mobile/photo-upload";

export type State = { error?: string; warning?: string; fieldErrors?: Record<string, string> } | null;

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
  // Object.fromEntries collapses the repeated `photo` keys and would coerce
  // a File into "[object File]" — pull the files off first, then parse the
  // scalar fields from what's left.
  const photoFiles = filesFrom(fd, "photo");
  const scalars = Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string"));
  const parsed = Input.safeParse(scalars);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;
  const severity = SEVERITY_MAP[v.severity ?? "Medium"] ?? "minor";
  const description = [v.what, v.action ? `Immediate action: ${v.action}` : null].filter(Boolean).join("\n\n");

  // Kit switches serialize as STRINGS ("true"/"false"), so a truthy check on
  // the raw value treats a toggled-then-untoggled switch ("false") as ON.
  const switchOn = (raw: string | undefined) => raw === "true" || raw === "on" || raw === "1";

  // The injury switch has to reach a column, not just prose. It used to
  // only append "Injuries involved." to the description, which meant
  // injury_type stayed null — and the Lost & Found lens (which keyed off
  // exactly that) swallowed every field-filed injury. `reported` is the
  // honest value the intake can assert; the specific injury type is
  // classified downstream on the console.
  const injuryType = switchOn(v.injury) ? "reported" : null;

  // "Submit Anonymously" — the form has always offered it, the action has
  // always dropped it: the switch was parsed and reporter_id stamped anyway,
  // so the UI promised an anonymity the row never had. NULL means the
  // identity is not recorded on the record at all (migration 20260722210000
  // made the column nullable). Known limit, on purpose: photo evidence is
  // uploaded under the caller's own storage prefix (the org-scoped upload
  // policy requires it), so an admin reading raw storage paths could infer
  // the uploader — the report row itself carries no identity.
  const anonymous = switchOn(v.anon);

  // "Time Of Incident" — the form asks when it HAPPENED; the action used to
  // write the filing moment, discarding the answer. On a safety record the
  // gap matters (incident at 14:00, filed at 22:00). The field is time-only,
  // so compose it onto today's date; a result in the future means the
  // incident straddled midnight, so it belongs to yesterday.
  let occurredAt = new Date();
  const hhmm = v.when?.match(/^([01]\d|2[0-3]):([0-5]\d)/);
  if (hhmm) {
    const candidate = new Date();
    candidate.setHours(Number(hhmm[1]), Number(hhmm[2]), 0, 0);
    if (candidate.getTime() > Date.now()) candidate.setDate(candidate.getDate() - 1);
    occurredAt = candidate;
  }

  const supabase = await createClient();

  // Upload evidence BEFORE the insert so the row lands with its photos
  // attached. A failed upload must not lose the report, so a partial
  // failure is carried through as a warning rather than an abort — the
  // incident is the thing that matters; the attachment is corroboration.
  const upload = await uploadFieldPhotos(
    supabase,
    "incident-photos",
    session.orgId,
    session.userId,
    photoFiles,
    fixesFrom(fd, "photo", photoFiles.length),
  );

  // soft-delete-exempt: INSERT returning its own row via .select() — the row
  // was just written, so no archived row can surface.
  const { data: created, error } = await supabase
    .from("incidents")
    .insert({
      org_id: session.orgId,
      project_id: v.projectId ?? null,
      reporter_id: anonymous ? null : session.userId,
      summary: v.what.slice(0, 140),
      description,
      severity,
      incident_state: "open",
      location: v.where || null,
      occurred_at: occurredAt.toISOString(),
      // Store refs, not bare paths: where a photo was taken is often the whole
      // question on a safety claim, and the coordinates are worthless if they
      // aren't attached to the specific image they belong to.
      photos: upload.refs,
      injury_type: injuryType,
      // This intake is the safety intake. Lost property comes through the
      // lost & found intake, which sets `lost_property`.
      report_kind: "safety",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const managers = await managerUserIds(session.orgId, session.userId);
  if (managers.length) {
    await sendPushBulk(
      managers,
      {
        title: "New Incident Filed",
        body: v.what.slice(0, 120),
        // Kit 32 A2: the notification deep-links the REAL report record —
        // the bell row, the notification detail's related link, and the
        // activity timeline all resolve through this href.
        url: `/m/incidents/${(created as { id: string }).id}`,
        kind: "incident",
        scope: "mobile",
        orgId: session.orgId,
      },
    );
  }

  revalidatePath("/m/incidents");
  // The report landed. If some evidence didn't, say so rather than letting
  // the worker believe photos are attached that aren't — that belief is
  // exactly the failure this whole change exists to end.
  if (upload.error) return { warning: `Report filed. ${upload.error}` };
  return null;
}
