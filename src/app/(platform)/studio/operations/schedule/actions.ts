"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";
import {
  evaluateGuardrails,
  hasBlockingViolation,
  type CredentialInput,
  type ScheduleActivityInput,
} from "@/lib/schedule/guardrails";
import { actionErrorMessage } from "@/lib/errors";

export type State = { error?: string; warning?: string } | null;

const LOCATION_KINDS = [
  "venue",
  "vessel",
  "hotel_block",
  "warehouse",
  "office",
  "greenroom",
  "vehicle",
] as const;

const ACTIVITY_KINDS = [
  "general",
  "load_in",
  "load_out",
  "delivery",
  "sound_check",
  "inspection",
  "shift",
  "meeting",
  "training",
  "run_of_show",
  "rehearsal",
  "changeover",
  "doors",
  "set",
  "curfew",
] as const;

const CreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  activity_kind: z.enum(ACTIVITY_KINDS),
  starts_at: z.string().min(1, "Start is required"),
  ends_at: z.string().min(1, "End is required"),
  location_kind: z.union([z.enum(LOCATION_KINDS), z.literal("")]).optional(),
  location_id: z.string().uuid().optional().or(z.literal("")),
  resource_ref: z.string().uuid().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
  /** When set, the caller acknowledged the warn-level guardrails. */
  override: z.string().optional(),
});

const RescheduleSchema = z.object({
  id: z.string().uuid(),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  override: z.string().optional(),
});

function iso(local: string): string {
  // datetime-local has no zone; interpret in the server's locale and store UTC.
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
  return d.toISOString();
}

/** Fetch the day-window activity peers + credential expiries a guardrail run needs. */
async function guardrailContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  resourceRef: string | null,
  startsAtIso: string,
  excludeId?: string,
): Promise<{ peers: ScheduleActivityInput[]; credentials: CredentialInput[] }> {
  if (!resourceRef) return { peers: [], credentials: [] };
  // Pull the resource's activities in the surrounding week (covers rest + weekly cap).
  const anchor = new Date(startsAtIso);
  const from = new Date(anchor.getTime() - 8 * 86_400_000).toISOString();
  const to = new Date(anchor.getTime() + 8 * 86_400_000).toISOString();
  const { data: rows } = await supabase
    .from("events")
    .select("id, starts_at, ends_at, resource_ref, location_id")
    .eq("org_id", orgId)
    .eq("resource_ref", resourceRef)
    .gte("starts_at", from)
    .lte("starts_at", to);
  const peers: ScheduleActivityInput[] = ((rows ?? []) as Array<Record<string, unknown>>)
    .filter((r) => r.id !== excludeId)
    .map((r) => ({
      id: String(r.id),
      startsAt: String(r.starts_at),
      endsAt: String(r.ends_at),
      resourceRef: (r.resource_ref as string | null) ?? null,
      locationId: (r.location_id as string | null) ?? null,
    }));

  // Credential expiries for the crew resource, if any (best-effort — the table
  // is the required-accreditation register).
  let credentials: CredentialInput[] = [];
  try {
    const { data: creds } = await supabase
      .from("credentials")
      .select("kind, expires_on, crew_member_id")
      .eq("org_id", orgId)
      .eq("crew_member_id", resourceRef);
    credentials = ((creds ?? []) as Array<Record<string, unknown>>).map((c) => ({
      resourceRef,
      expiresOn: (c.expires_on as string | null) ?? null,
      label: String(c.kind ?? "Credential"),
    }));
  } catch {
    credentials = [];
  }
  return { peers, credentials };
}

export async function createActivity(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;

  let startsAt: string;
  let endsAt: string;
  try {
    startsAt = iso(d.starts_at);
    endsAt = iso(d.ends_at);
  } catch {
    return { error: actionErrorMessage("invalid.start-or-end-time", "Invalid start or end time") };
  }
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    return { error: actionErrorMessage("end-must-be-after-start", "End must be after start") };
  }

  const supabase = await createClient();
  const resourceRef = d.resource_ref || null;
  const { peers, credentials } = await guardrailContext(supabase, session.orgId, resourceRef, startsAt);
  const candidate: ScheduleActivityInput = {
    id: "new",
    startsAt,
    endsAt,
    resourceRef,
    locationId: d.location_id || null,
  };
  const violations = evaluateGuardrails(candidate, peers, credentials);
  if (hasBlockingViolation(violations)) {
    return { error: violations.find((v) => v.level === "error")!.message };
  }
  const warnings = violations.filter((v) => v.level === "warn");
  if (warnings.length > 0 && !d.override) {
    return { warning: warnings.map((w) => w.message).join(" · ") };
  }

  const { error } = await supabase.from("events").insert({
    org_id: session.orgId,
    name: d.name,
    event_kind: d.activity_kind,
    starts_at: startsAt,
    ends_at: endsAt,
    location_kind: d.location_kind ? d.location_kind : null,
    location_id: d.location_id || null,
    resource_ref: resourceRef,
    project_id: d.project_id || null,
    created_by: session.userId,
  });
  if (error) {
    log.warn("schedule.create_failed", { err: error.message });
    return { error: `Could not create activity: ${error.message}` };
  }
  revalidatePath("/studio/operations/schedule");
  return null;
}

export async function rescheduleActivity(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = RescheduleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;

  let startsAt: string;
  let endsAt: string;
  try {
    startsAt = iso(d.starts_at);
    endsAt = iso(d.ends_at);
  } catch {
    return { error: actionErrorMessage("invalid.start-or-end-time", "Invalid start or end time") };
  }
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    return { error: actionErrorMessage("end-must-be-after-start", "End must be after start") };
  }

  const supabase = await createClient();
  // Resolve the row's resource so the guardrails see the right peer window.
  const { data: current } = await supabase
    .from("events")
    .select("resource_ref, location_id")
    .eq("id", d.id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const resourceRef = ((current as { resource_ref?: string | null } | null)?.resource_ref) ?? null;
  const locationId = ((current as { location_id?: string | null } | null)?.location_id) ?? null;

  const { peers, credentials } = await guardrailContext(
    supabase,
    session.orgId,
    resourceRef,
    startsAt,
    d.id,
  );
  const violations = evaluateGuardrails(
    { id: d.id, startsAt, endsAt, resourceRef, locationId },
    peers,
    credentials,
  );
  if (hasBlockingViolation(violations)) {
    return { error: violations.find((v) => v.level === "error")!.message };
  }
  const warnings = violations.filter((v) => v.level === "warn");
  if (warnings.length > 0 && !d.override) {
    return { warning: warnings.map((w) => w.message).join(" · ") };
  }

  const { error } = await supabase
    .from("events")
    .update({ starts_at: startsAt, ends_at: endsAt })
    .eq("id", d.id)
    .eq("org_id", session.orgId);
  if (error) {
    log.warn("schedule.reschedule_failed", { err: error.message });
    return { error: `Could not reschedule: ${error.message}` };
  }
  revalidatePath("/studio/operations/schedule");
  return null;
}
