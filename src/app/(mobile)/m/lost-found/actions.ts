"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { filesFrom, fixesFrom, uploadFieldPhotos } from "@/lib/mobile/photo-upload";
import { transitionIncident } from "@/lib/db/incident-fsm";

export type State = { error?: string; warning?: string; fieldErrors?: Record<string, string> } | null;

const Input = z.object({
  // kit `lostfound` form field ids
  kind: z.string().optional(),
  item: z.string().min(1, "Name the item."),
  where: z.string().min(1, "Where was it lost or found?"),
  what: z.string().min(1, "Describe the item."),
  holding: z.string().optional(),
  projectId: z.string().uuid().optional(),
});

/**
 * File a lost / found property report.
 *
 * Lands in `incidents` with `report_kind = 'lost_property'` — the
 * discriminator the console's Lost & Found lens filters on (ADR-0014: one
 * store, honest filtered aliases, no parallel lost-found table).
 *
 * Deliberately does NOT notify the manager band: lost property is not a
 * safety event, and paging Ops for every dropped lanyard is how people
 * learn to ignore the pager.
 */
export async function fileLostFound(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Files first — Object.fromEntries would stringify them.
  const photoFiles = filesFrom(fd, "photo");
  const scalars = Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string"));
  const parsed = Input.safeParse(scalars);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;
  const lost = (v.kind ?? "Found").toLowerCase() === "lost";

  const description = [v.what, v.holding ? `Now held at: ${v.holding}` : null].filter(Boolean).join("\n\n");

  const supabase = await createClient();

  // A photo of the item is the whole point of a found-property report —
  // it's how the owner identifies it at the gate office. The geotag answers
  // the other half: where it was actually picked up, which the free-text
  // "where" field routinely gets wrong at 2am on a load-out.
  const upload = await uploadFieldPhotos(
    supabase,
    "incident-photos",
    session.orgId,
    session.userId,
    photoFiles,
    fixesFrom(fd, "photo", photoFiles.length),
  );

  const { error } = await supabase.from("incidents").insert({
    org_id: session.orgId,
    project_id: v.projectId ?? null,
    reporter_id: session.userId,
    summary: `${lost ? "Lost" : "Found"}: ${v.item}`.slice(0, 140),
    description,
    // Property reports carry no injury and no safety severity weight.
    severity: "near_miss",
    incident_state: "open",
    location: v.where,
    occurred_at: new Date().toISOString(),
    photos: upload.refs,
    injury_type: null,
    report_kind: "lost_property",
  });
  if (error) return { error: error.message };

  revalidatePath("/m/lost-found");
  if (upload.error) return { warning: `Report filed. ${upload.error}` };
  return null;
}

/**
 * Hand a held item back to its owner.
 *
 * Lost & Found was file-only: an item could be logged as found and then never
 * marked returned, so the desk's list only ever grew and "Claimed" was a state
 * nothing could reach. A claim is not a bespoke write — these rows ARE
 * incidents (`report_kind = 'lost_property'`), and "Claimed" is the shared
 * incident FSM's terminal `closed`. Routing through `transitionIncident` keeps
 * the legal moves, the append-only journal and the authorization policy
 * identical to every other incident, rather than forking a second lifecycle.
 */
export async function claimLostItem(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const result = await transitionIncident(supabase, session, parsed.data.id, "closed");
  if (!result.ok) return { error: result.error };

  revalidatePath("/m/lost-found");
  return null;
}
