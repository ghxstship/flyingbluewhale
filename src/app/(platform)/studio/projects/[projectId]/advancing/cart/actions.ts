"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MEAL_PERIODS, type CatalogKind } from "@/lib/db/assignments";

/**
 * Review & Submit — the ONE server action behind the Advance Cart. The cart
 * itself is client state only; this writes the batch as ordinary
 * `assignments` rows (fulfillment_state 'submitted' — the "Requested" leg of
 * the mini-track; catalog_kind is denormalized from the catalog row by the
 * assignments_sync_catalog_kind trigger) plus a catering_assignment_details
 * sibling row for each catering line. No cart table exists, deliberately.
 */

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const LineSchema = z.object({
  catalog_item_id: z.string().uuid(),
  starts_on: z.string().regex(DATE).nullable(),
  ends_on: z.string().regex(DATE).nullable(),
  meal_periods: z.array(z.enum(MEAL_PERIODS)).max(3).default([]),
  every_contract_day: z.boolean().default(true),
});

const PayloadSchema = z.object({
  crew_member_id: z.string().uuid(),
  lines: z.array(LineSchema).min(1).max(50),
});

export type CartSubmitState = { error?: string } | null;

export async function submitAdvanceCart(projectId: string, _prev: CartSubmitState, fd: FormData): Promise<CartSubmitState> {
  const session = await requireSession();
  if (!can(session, "advance:request")) {
    return { error: "Submitting An Advance Requires advance:request" };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get("payload") ?? ""));
  } catch {
    return { error: "Invalid Cart Payload" };
  }
  const parsed = PayloadSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid Cart Payload" };

  for (const line of parsed.data.lines) {
    if (line.starts_on && line.ends_on && line.ends_on < line.starts_on) {
      return { error: "A Line's End Date Precedes Its Start Date" };
    }
  }

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: "Project Not Found" };

  const { data: crew } = await supabase
    .from("crew_members")
    .select("id, name")
    .eq("id", parsed.data.crew_member_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!crew) return { error: "Person Not Found In Your Organization" };

  const itemIds = [...new Set(parsed.data.lines.map((l) => l.catalog_item_id))];
  const { data: catalogRows } = await supabase
    .from("master_catalog_items")
    .select("id, kind, name")
    .in("id", itemIds)
    .eq("org_id", session.orgId)
    .eq("active", true)
    .is("deleted_at", null);
  const itemById = new Map(
    ((catalogRows ?? []) as Array<{ id: string; kind: CatalogKind; name: string }>).map((c) => [c.id, c]),
  );
  if (itemById.size !== itemIds.length) return { error: "A Catalog Item Is No Longer Available" };

  // Sequential inserts: each catering line needs its assignment id for the
  // sibling detail row, and a cart tops out at 50 lines.
  for (const line of parsed.data.lines) {
    const item = itemById.get(line.catalog_item_id)!;
    // soft-delete-exempt: insert-returning chain — never reads existing rows.
    const { data: created, error: insertErr } = await supabase
      .from("assignments")
      .insert({
        org_id: session.orgId,
        project_id: projectId,
        catalog_item_id: line.catalog_item_id,
        catalog_kind: item.kind,
        party_kind: "crew_member",
        party_crew_id: parsed.data.crew_member_id,
        fulfillment_state: "submitted",
        title: item.name,
        // Per-kind extras ride the sanctioned jsonb column — the advance
        // window every queue/field surface renders for this line.
        data: { starts_on: line.starts_on, ends_on: line.ends_on },
        deadline: line.ends_on,
        created_by: session.userId,
      })
      .select("id")
      .single();
    if (insertErr || !created) {
      return { error: `Could Not Submit ${item.name}: ${insertErr?.message ?? "Unknown Error"}` };
    }

    if (item.kind === "catering") {
      const { error: detailErr } = await supabase.from("catering_assignment_details").insert({
        assignment_id: (created as { id: string }).id,
        meal_periods: line.meal_periods,
        starts_on: line.starts_on,
        ends_on: line.ends_on,
        every_contract_day: line.every_contract_day,
        excluded_dates: [],
      });
      if (detailErr) {
        return { error: `Could Not Save Catering Details: ${detailErr.message}` };
      }
    }
  }

  revalidatePath(`/studio/projects/${projectId}/advancing/assignments`);
  revalidatePath(`/studio/projects/${projectId}/advancing/fulfillment`);
  redirect(`/studio/projects/${projectId}/advancing/fulfillment`);
}
