import "server-only";

import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { listMyAssignments } from "@/lib/db/assignments";
import type { GuideConfig, GuideSection } from "@/lib/guides/types";
import type { Session } from "@/lib/auth";

/**
 * Shared context for the COMPVSS emergency surfaces (kit 31, live-test
 * resolution #9 — the hub at /m/emergency plus the dedicated Codes / Fire
 * Safety / Evacuation / Shelter pages).
 *
 * The station card is wired to the viewer's REAL deployment (active
 * `assignments` row → project → crew `event_guides` sections). The code set
 * is the standard universal venue reference (industry canon, like the OSHA
 * list) — correctly static; per-code department/team/individual plans are the
 * same reference material with no fabricated project specifics.
 */

export const NA = "—";

export type EmergencyCode = {
  /** Stable kebab identity (anchor ids, React keys, i18n key segment) — never displayed. */
  key: string;
  code: string;
  trigger: string;
  tint: string;
  ink?: "dark";
  /** Department-level plan (reference). */
  dept: string;
  /** Team-level plan (reference). */
  team: string;
  /** Individual plan (reference). */
  indiv: string;
};

type TFn = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

/**
 * Code → semantic token tint + dark-ink flag, mapped off the kit colorway.
 * Factory (not module-scope) so every user-visible string resolves through the
 * caller's per-request `t` — `key`/`tint`/`ink` are locale-invariant identity.
 */
export function getEmergencyCodes(t: TFn): EmergencyCode[] {
  return [
    {
      key: "red",
      code: t("m.emergency.code.red.code", undefined, "Red"),
      trigger: t("m.emergency.code.red.trigger", undefined, "Fire, Lightning Strike, High Winds or Weather"),
      tint: "danger",
      dept: t("m.emergency.code.red.dept", undefined, "Halt all activity; initiate the evacuation sequence per zone marshals."),
      team: t("m.emergency.code.red.team", undefined, "Open and hold your egress lanes; suppress re-entry."),
      indiv: t("m.emergency.code.red.indiv", undefined, "Direct patrons to the nearest exit, sweep your sector, report headcount to your lead."),
    },
    {
      key: "orange",
      code: t("m.emergency.code.orange.code", undefined, "Orange"),
      trigger: t("m.emergency.code.orange.trigger", undefined, "Crowd Surge"),
      tint: "warning",
      dept: t("m.emergency.code.orange.dept", undefined, "Pause the stage program; activate the crowd-density protocol."),
      team: t("m.emergency.code.orange.team", undefined, "Form a relief lane; ease pressure toward your gate."),
      indiv: t("m.emergency.code.orange.indiv", undefined, "Hold the barricade line, call the surge level on your radio channel, assist anyone down."),
    },
    {
      key: "yellow",
      code: t("m.emergency.code.yellow.code", undefined, "Yellow"),
      trigger: t("m.emergency.code.yellow.trigger", undefined, "Structural Damage or Severe Equipment Failure"),
      tint: "warning",
      ink: "dark",
      dept: t("m.emergency.code.yellow.dept", undefined, "Cordon the affected structure; dispatch rigging and engineering."),
      team: t("m.emergency.code.yellow.team", undefined, "Establish a 15m exclusion zone around the hazard."),
      indiv: t("m.emergency.code.yellow.indiv", undefined, "Block access to the area, keep patrons clear, await the engineering all-clear."),
    },
    {
      key: "green",
      code: t("m.emergency.code.green.code", undefined, "Green"),
      trigger: t("m.emergency.code.green.trigger", undefined, "Burglary or Theft"),
      tint: "success",
      dept: t("m.emergency.code.green.dept", undefined, "Lock down the affected zone; preserve the scene for security."),
      team: t("m.emergency.code.green.team", undefined, "Control your gate exits; log anyone leaving."),
      indiv: t("m.emergency.code.green.indiv", undefined, "Note descriptions, do not pursue, report to security on your radio channel."),
    },
    {
      key: "blue",
      code: t("m.emergency.code.blue.code", undefined, "Blue"),
      trigger: t("m.emergency.code.blue.trigger", undefined, "Medical Emergency"),
      tint: "info",
      dept: t("m.emergency.code.blue.dept", undefined, "Dispatch the medical team; clear an access route."),
      team: t("m.emergency.code.blue.team", undefined, "Open a lane from your gate to the medical post."),
      indiv: t("m.emergency.code.blue.indiv", undefined, "Flag the medic in, hold a clear path, keep bystanders back."),
    },
    {
      key: "purple",
      code: t("m.emergency.code.purple.code", undefined, "Purple"),
      trigger: t("m.emergency.code.purple.trigger", undefined, "Cultural Sensitivity Issue"),
      tint: "accent",
      dept: t("m.emergency.code.purple.dept", undefined, "Notify guest relations and the duty manager; de-escalate."),
      team: t("m.emergency.code.purple.team", undefined, "Provide a calm buffer; route to guest services."),
      indiv: t("m.emergency.code.purple.indiv", undefined, "Stay neutral and respectful, summon a lead, do not engage further."),
    },
    {
      key: "pink",
      code: t("m.emergency.code.pink.code", undefined, "Pink"),
      trigger: t("m.emergency.code.pink.trigger", undefined, "Drug or Illegal Substance Trafficking"),
      tint: "danger",
      ink: "dark",
      dept: t("m.emergency.code.pink.dept", undefined, "Alert security and the law-enforcement liaison discreetly."),
      team: t("m.emergency.code.pink.team", undefined, "Contain the area without alarming the crowd."),
      indiv: t("m.emergency.code.pink.indiv", undefined, "Observe and report only, do not confront, mark the location on your radio channel."),
    },
    {
      key: "indigo",
      code: t("m.emergency.code.indigo.code", undefined, "Indigo"),
      trigger: t("m.emergency.code.indigo.trigger", undefined, "Missing Talent"),
      tint: "info",
      dept: t("m.emergency.code.indigo.dept", undefined, "Activate lockdown of BOH egress; brief all leads."),
      team: t("m.emergency.code.indigo.team", undefined, "Hold your gate; verify credentials on all exits."),
      indiv: t("m.emergency.code.indigo.indiv", undefined, "Watch your exit, check passing credentials, report sightings immediately."),
    },
    {
      key: "white",
      code: t("m.emergency.code.white.code", undefined, "White"),
      trigger: t("m.emergency.code.white.trigger", undefined, "ICE Raid or Government Agency Intervention"),
      tint: "neutral",
      ink: "dark",
      dept: t("m.emergency.code.white.dept", undefined, "Engage legal and compliance; direct all inquiries to command."),
      team: t("m.emergency.code.white.team", undefined, "Maintain calm, do not obstruct, document at your gate."),
      indiv: t("m.emergency.code.white.indiv", undefined, "Refer agents to the duty manager, stay calm, take no independent action."),
    },
    {
      key: "black",
      code: t("m.emergency.code.black.code", undefined, "Black"),
      trigger: t("m.emergency.code.black.trigger", undefined, "Acts of Terror, Active Shooter or Bomb Threat"),
      tint: "text-1",
      dept: t("m.emergency.code.black.dept", undefined, "Initiate Run-Hide-Fight; full evacuation; notify authorities."),
      team: t("m.emergency.code.black.team", undefined, "Drive egress through your gate; do not re-admit."),
      indiv: t("m.emergency.code.black.indiv", undefined, "Run / Hide / Fight. Move patrons out fast, take cover, call your location in."),
    },
  ];
}

export const chipBg = (tint: string) =>
  tint === "text-1" ? "var(--p-text-1)" : tint === "neutral" ? "var(--p-surface)" : `var(--p-${tint})`;
export const chipFg = (tint: string, ink?: "dark") =>
  tint === "neutral" ? "var(--p-text-1)" : ink ? "var(--p-bg)" : "var(--p-accent-contrast, #fff)";

export type EvacSection = Extract<GuideSection, { type: "evacuation" }>;
export type FireSection = Extract<GuideSection, { type: "fire_safety" }>;
export type ResourcesSection = Extract<GuideSection, { type: "resources" }>;

export type EmergencyContext = {
  projectId: string | null;
  projectName: string | null;
  evac: EvacSection | null;
  fire: FireSection | null;
  resources: ResourcesSection | null;
};

/**
 * Resolve the holder's active-assignment project and its event-guide
 * emergency sections (evacuation, fire_safety, resources). Honest nulls when
 * the holder has no assignment or the guide has no section.
 */
export async function getEmergencyContext(session: Session): Promise<EmergencyContext> {
  const ctx: EmergencyContext = { projectId: null, projectName: null, evac: null, fire: null, resources: null };
  if (!hasSupabase) return ctx;

  const supabase = await createClient();
  const assignments = await listMyAssignments(session.orgId, session.userId);
  const dead = new Set(["voided", "expired", "returned", "rejected"]);
  const active = assignments.find((a) => !dead.has(a.fulfillment_state)) ?? assignments[0];
  if (!active) return ctx;

  ctx.projectId = active.project_id;
  const [{ data: proj }, { data: guides }] = await Promise.all([
    supabase.from("projects").select("name").eq("id", active.project_id).is("deleted_at", null).maybeSingle(),
    supabase.from("event_guides").select("config").eq("project_id", active.project_id).is("deleted_at", null).limit(8),
  ]);
  ctx.projectName = (proj as { name: string } | null)?.name ?? null;

  for (const g of (guides ?? []) as Array<{ config: unknown }>) {
    const cfg = g.config as GuideConfig | null;
    for (const s of cfg?.sections ?? []) {
      if (!ctx.evac && s.type === "evacuation") ctx.evac = s;
      if (!ctx.fire && s.type === "fire_safety") ctx.fire = s;
      if (!ctx.resources && s.type === "resources") ctx.resources = s;
    }
    if (ctx.evac && ctx.fire && ctx.resources) break;
  }
  return ctx;
}
