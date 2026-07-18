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

/** Code → semantic token tint + dark-ink flag, mapped off the kit colorway. */
export const EMERGENCY_CODES: EmergencyCode[] = [
  {
    code: "Red",
    trigger: "Fire, Lightning Strike, High Winds or Weather",
    tint: "danger",
    dept: "Halt all activity; initiate the evacuation sequence per zone marshals.",
    team: "Open and hold your egress lanes; suppress re-entry.",
    indiv: "Direct patrons to the nearest exit, sweep your sector, report headcount to your lead.",
  },
  {
    code: "Orange",
    trigger: "Crowd Surge",
    tint: "warning",
    dept: "Pause the stage program; activate the crowd-density protocol.",
    team: "Form a relief lane; ease pressure toward your gate.",
    indiv: "Hold the barricade line, call the surge level on your radio channel, assist anyone down.",
  },
  {
    code: "Yellow",
    trigger: "Structural Damage or Severe Equipment Failure",
    tint: "warning",
    ink: "dark",
    dept: "Cordon the affected structure; dispatch rigging and engineering.",
    team: "Establish a 15m exclusion zone around the hazard.",
    indiv: "Block access to the area, keep patrons clear, await the engineering all-clear.",
  },
  {
    code: "Green",
    trigger: "Burglary or Theft",
    tint: "success",
    dept: "Lock down the affected zone; preserve the scene for security.",
    team: "Control your gate exits; log anyone leaving.",
    indiv: "Note descriptions, do not pursue, report to security on your radio channel.",
  },
  {
    code: "Blue",
    trigger: "Medical Emergency",
    tint: "info",
    dept: "Dispatch the medical team; clear an access route.",
    team: "Open a lane from your gate to the medical post.",
    indiv: "Flag the medic in, hold a clear path, keep bystanders back.",
  },
  {
    code: "Purple",
    trigger: "Cultural Sensitivity Issue",
    tint: "accent",
    dept: "Notify guest relations and the duty manager; de-escalate.",
    team: "Provide a calm buffer; route to guest services.",
    indiv: "Stay neutral and respectful, summon a lead, do not engage further.",
  },
  {
    code: "Pink",
    trigger: "Drug or Illegal Substance Trafficking",
    tint: "danger",
    ink: "dark",
    dept: "Alert security and the law-enforcement liaison discreetly.",
    team: "Contain the area without alarming the crowd.",
    indiv: "Observe and report only, do not confront, mark the location on your radio channel.",
  },
  {
    code: "Indigo",
    trigger: "Missing Talent",
    tint: "info",
    dept: "Activate lockdown of BOH egress; brief all leads.",
    team: "Hold your gate; verify credentials on all exits.",
    indiv: "Watch your exit, check passing credentials, report sightings immediately.",
  },
  {
    code: "White",
    trigger: "ICE Raid or Government Agency Intervention",
    tint: "neutral",
    ink: "dark",
    dept: "Engage legal and compliance; direct all inquiries to command.",
    team: "Maintain calm, do not obstruct, document at your gate.",
    indiv: "Refer agents to the duty manager, stay calm, take no independent action.",
  },
  {
    code: "Black",
    trigger: "Acts of Terror, Active Shooter or Bomb Threat",
    tint: "text-1",
    dept: "Initiate Run-Hide-Fight; full evacuation; notify authorities.",
    team: "Drive egress through your gate; do not re-admit.",
    indiv: "Run / Hide / Fight. Move patrons out fast, take cover, call your location in.",
  },
];

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
    supabase.from("projects").select("name").eq("id", active.project_id).maybeSingle(),
    supabase.from("event_guides").select("config").eq("project_id", active.project_id).limit(8),
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
