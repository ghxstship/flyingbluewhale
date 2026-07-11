import { z } from "zod";
import { registerAction } from "../registry";
import { createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * daysheet.draft_from_advance — the kit 26 Phase E agent verb: "draft
 * tomorrow's day sheet from the advance". Composes a `day_sheets` DRAFT for a
 * project date from the canonical stores it references (the project header +
 * that date's schedule events), never copying more than the sheet's own header
 * fields (SSOT). Idempotent per (project, date): re-running while a live sheet
 * exists returns it instead of stacking duplicates.
 *
 * Gated on the transition it respects: the sheet lands in 'draft' (the arc's
 * authoring state) — publishing to the field stays a human act.
 */

const Schema = z.object({
  projectId: z.string().uuid(),
  /** ISO date (YYYY-MM-DD). Defaults to the project's next event date. */
  sheetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

const hhmm = (iso: string): string | null => /T(\d{2}:\d{2})/.exec(iso)?.[1] ?? null;

registerAction({
  type: "daysheet.draft_from_advance",
  schema: Schema,
  label: "Draft Day Sheet From Advance",
  description: "Composes a draft day sheet for a project date from its schedule (crew call, doors, set, curfew).",
  async run(input, ctx) {
    const svc = createServiceClient() as unknown as LooseSupabase;

    // Org-scoped read: never draft across tenants.
    const { data: project } = (await svc
      .from("projects")
      .select("id, name, primary_venue_id")
      .eq("id", input.projectId)
      .eq("org_id", ctx.orgId)
      .is("deleted_at", null)
      .maybeSingle()) as { data: { id: string; name: string; primary_venue_id: string | null } | null };
    if (!project) {
      throw new Error(`daysheet.draft_from_advance: project ${input.projectId} not found in this organization`);
    }

    // The date's schedule events — the run-of-show source of truth.
    const { data: events } = (await svc
      .from("events")
      .select("name, event_kind, starts_at, ends_at")
      .eq("org_id", ctx.orgId)
      .eq("project_id", project.id)
      .order("starts_at", { ascending: true })
      .limit(200)) as { data: Array<{ name: string; event_kind: string; starts_at: string; ends_at: string }> | null };

    const sheetDate =
      input.sheetDate ??
      (events ?? []).map((e) => e.starts_at.slice(0, 10)).find((d) => d >= new Date().toISOString().slice(0, 10)) ??
      null;
    if (!sheetDate) {
      throw new Error(
        `daysheet.draft_from_advance: no sheetDate given and project ${project.id} has no upcoming schedule events`,
      );
    }
    const dayEvents = (events ?? []).filter((e) => e.starts_at.slice(0, 10) === sheetDate);

    // Idempotency: one live sheet per (project, date).
    const { data: existing } = (await svc
      .from("day_sheets")
      .select("id, sheet_state")
      .eq("org_id", ctx.orgId)
      .eq("project_id", project.id)
      .eq("sheet_date", sheetDate)
      .is("deleted_at", null)
      .maybeSingle()) as { data: { id: string; sheet_state: string } | null };
    if (existing) return { output: { daySheetId: existing.id, sheetState: existing.sheet_state, created: false } };

    // Header times derive from the show-day event kinds (kit 26 run-of-show
    // vocabulary); crew call falls back to the day's earliest activity.
    const byKind = (kind: string) => dayEvents.find((e) => e.event_kind === kind);
    const doorsEv = byKind("doors");
    const curfewEv = byKind("curfew");
    const setEv = byKind("set");
    const crewCallEv = byKind("load_in") ?? byKind("shift") ?? dayEvents[0];

    // Venue label from the canonical space registry, referenced not copied.
    let venue: string | null = null;
    if (project.primary_venue_id) {
      const { data: loc } = (await svc
        .from("locations")
        .select("name")
        .eq("id", project.primary_venue_id)
        .eq("org_id", ctx.orgId)
        .maybeSingle()) as { data: { name: string } | null };
      venue = loc?.name ?? null;
    }

    // Tour scope: a routed date carries the tour through its booking leg.
    const { data: leg } = (await svc
      .from("talent_offers")
      .select("tour_id")
      .eq("org_id", ctx.orgId)
      .eq("project_id", project.id)
      .not("tour_id", "is", null)
      .limit(1)
      .maybeSingle()) as { data: { tour_id: string | null } | null };

    const { data: created, error } = (await svc
      .from("day_sheets")
      .insert({
        org_id: ctx.orgId,
        project_id: project.id,
        tour_id: leg?.tour_id ?? null,
        sheet_date: sheetDate,
        venue,
        crew_call: crewCallEv ? hhmm(crewCallEv.starts_at) : null,
        doors: doorsEv ? hhmm(doorsEv.starts_at) : null,
        headline_set: setEv ? `${hhmm(setEv.starts_at) ?? ""}-${hhmm(setEv.ends_at) ?? ""}` : null,
        curfew: curfewEv ? hhmm(curfewEv.starts_at) : null,
        sheet_state: "draft",
        created_by: ctx.actorId ?? null,
      })
      .select("id")
      .single()) as { data: { id: string } | null; error: { message: string } | null };
    if (error || !created) {
      throw new Error(`daysheet.draft_from_advance: insert failed: ${error?.message ?? "no row returned"}`);
    }

    return { output: { daySheetId: created.id, sheetState: "draft", created: true, composedEvents: dayEvents.length } };
  },
});

export {};
