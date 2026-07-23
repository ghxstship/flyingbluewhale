"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { dateRangeRefine } from "@/lib/zod/dateRange";
import { formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z
  .object({
    name: z.string().min(1).max(200),
    property: z.string().min(1).max(200),
    city: z.string().max(120).optional().or(z.literal("")),
    stakeholder_group: z.string().max(120).optional().or(z.literal("")),
    rooms_reserved: z.string().optional(),
    rooms_confirmed: z.string().optional(),
    starts_on: z.string().optional().or(z.literal("")),
    ends_on: z.string().optional().or(z.literal("")),
  })
  // Sea Trial R2 FINDING-018: when both supplied, end must follow start.
  .refine(...dateRangeRefine("starts_on", "ends_on"));

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateBlock(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("accommodation_blocks", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    property: parsed.data.property,
    city: parsed.data.city || null,
    stakeholder_group: parsed.data.stakeholder_group || null,
    rooms_reserved: parsed.data.rooms_reserved ? Math.max(0, parseInt(parsed.data.rooms_reserved, 10)) : 0,
    rooms_confirmed: parsed.data.rooms_confirmed ? Math.max(0, parseInt(parsed.data.rooms_confirmed, 10)) : 0,
    starts_on: parsed.data.starts_on || null,
    ends_on: parsed.data.ends_on || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : actionErrorMessage("not-found.block", "Block not found.") };
  }
  revalidatePath(`/studio/accommodation/blocks/${id}`);
  revalidatePath("/studio/accommodation/blocks");
  redirect(`/studio/accommodation/blocks/${id}`);
}

export async function deleteBlock(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("accommodation_blocks").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete accommodation block: ${error.message}`);
  revalidatePath("/studio/accommodation/blocks");
  redirect("/studio/accommodation/blocks");
}
