"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { wouldCreatePositionCycle } from "./org-chart";

/**
 * Position library CRUD (Organization pillar, hub-native — not a mirror).
 *
 * RLS on `positions`: org members read; owner/admin/manager insert/update;
 * owner/admin delete. Archive is the `active` facet flip, not a delete
 * (the table carries no `deleted_at`). Every write reads the row back:
 * an RLS-refused UPDATE returns no error and zero rows, so the read-back
 * is what makes the failure honest.
 */

const PositionSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  department_code: z
    .string()
    .regex(/^\d000$/, "Department code must be one of the XPMS classes (0000-9000)")
    .optional()
    .or(z.literal("")),
  summary: z.string().max(2000).optional().or(z.literal("")),
  reports_to_position_id: z.string().uuid("Pick a valid position").optional().or(z.literal("")),
  seat_count: z.coerce.number().int("Seats must be a whole number").min(1, "At least one seat").max(500, "At most 500 seats"),
});

/**
 * App-side half of the no-cycle guard (the DB trigger
 * `private.positions_no_reporting_cycle` is the backstop). Returns an error
 * string when the proposed reports-to edge is illegal, else null.
 */
async function reportsToProblem(
  db: LooseSupabase,
  orgId: string,
  positionId: string | null,
  parentId: string,
): Promise<string | null> {
  const { data } = await db
    .from("positions")
    .select("id, reports_to_position_id")
    .eq("org_id", orgId)
    .limit(2000);
  const rows = (data ?? []) as { id: string; reports_to_position_id: string | null }[];
  if (!rows.some((r) => r.id === parentId)) {
    return "The reports-to position was not found in this organization";
  }
  if (positionId) {
    const edges = new Map(rows.map((r) => [r.id, r.reports_to_position_id]));
    if (wouldCreatePositionCycle(edges, positionId, parentId)) {
      return "That reports-to would create a reporting cycle";
    }
  }
  return null;
}

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createPositionAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create positions" };
  const parsed = PositionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  if (d.reports_to_position_id) {
    const problem = await reportsToProblem(db, session.orgId, null, d.reports_to_position_id);
    if (problem) return actionFail(problem, fd);
  }
  const { data, error } = await db
    .from("positions")
    .insert({
      org_id: session.orgId,
      title: d.title,
      department_code: d.department_code || null,
      summary: d.summary || null,
      reports_to_position_id: d.reports_to_position_id || null,
      seat_count: d.seat_count,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      return actionFail("A position with this title already exists", fd);
    }
    return actionFail(error.message, fd);
  }
  if (!data?.id) return actionFail("The position was not created. Your role may not allow this.", fd);
  revalidatePath("/legend/hub/organization");
  revalidatePath("/legend/hub");
  redirect(`/legend/hub/organization/${data.id}`);
}

export async function updatePositionAction(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit positions" };
  const parsed = PositionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  if (d.reports_to_position_id) {
    if (d.reports_to_position_id === id) {
      return actionFail("A position cannot report to itself", fd);
    }
    const problem = await reportsToProblem(db, session.orgId, id, d.reports_to_position_id);
    if (problem) return actionFail(problem, fd);
  }
  const { data, error } = await db
    .from("positions")
    .update({
      title: d.title,
      department_code: d.department_code || null,
      summary: d.summary || null,
      reports_to_position_id: d.reports_to_position_id || null,
      seat_count: d.seat_count,
    })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .select("id");
  if (error) {
    if (error.code === "23505") {
      return actionFail("A position with this title already exists", fd);
    }
    return actionFail(error.message, fd);
  }
  if (!data || data.length === 0) {
    return actionFail("Nothing was saved. The position may be gone, or your role may not allow edits.", fd);
  }
  revalidatePath("/legend/hub/organization");
  revalidatePath(`/legend/hub/organization/${id}`);
  redirect(`/legend/hub/organization/${id}`);
}

const AssignHolderSchema = z.object({
  party_id: z.string().uuid("Pick a person"),
  starts_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
    .optional()
    .or(z.literal("")),
});

export async function assignHolderAction(positionId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can assign people to positions" };
  const parsed = AssignHolderSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;

  // The party must be a live person in THIS org — party_id crosses the client
  // boundary, and both id spaces are bare uuids (the DB org-consistency
  // trigger is the backstop; this check makes the failure a form error).
  const { data: party } = await db
    .from("parties")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("id", d.party_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!party) return actionFail("That person was not found in this organization", fd);

  const { data, error } = await db
    .from("position_assignments")
    .insert({
      org_id: session.orgId,
      position_id: positionId,
      party_id: d.party_id,
      starts_on: d.starts_on || null,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      return actionFail("This person already holds this position", fd);
    }
    return actionFail(error.message, fd);
  }
  if (!data?.id) return actionFail("The assignment was not created. Your role may not allow this.", fd);
  revalidatePath("/legend/hub/organization");
  revalidatePath(`/legend/hub/organization/${positionId}`);
  redirect(`/legend/hub/organization/${positionId}`);
}

export async function endAssignmentAction(assignmentId: string, positionId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can end assignments");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data: row } = await db
    .from("position_assignments")
    .select("id, starts_on")
    .eq("org_id", session.orgId)
    .eq("id", assignmentId)
    .eq("assignment_state", "active")
    .maybeSingle();
  if (!row) throw new Error("The assignment is gone or already ended");
  // ends_on must satisfy the date-order CHECK even for a future-dated start.
  const today = new Date().toISOString().slice(0, 10);
  const startsOn = (row as { starts_on: string | null }).starts_on;
  const endsOn = startsOn && startsOn > today ? startsOn : today;
  const { data, error } = await db
    .from("position_assignments")
    .update({ assignment_state: "ended", ends_on: endsOn })
    .eq("id", assignmentId)
    .eq("org_id", session.orgId)
    .select("id");
  if (error) throw new Error(`Could not end the assignment: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("Nothing was updated. The assignment may be gone, or your role may not allow this.");
  }
  revalidatePath("/legend/hub/organization");
  revalidatePath(`/legend/hub/organization/${positionId}`);
}

export async function setPositionActiveAction(id: string, active: boolean): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can archive or restore positions");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("positions")
    .update({ active })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .select("id");
  if (error) throw new Error(`Could not update position: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("Nothing was updated. The position may be gone, or your role may not allow this.");
  }
  revalidatePath("/legend/hub/organization");
  revalidatePath(`/legend/hub/organization/${id}`);
  revalidatePath("/legend/hub");
}
