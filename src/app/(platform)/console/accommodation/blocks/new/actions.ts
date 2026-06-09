"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateRangeRefine } from "@/lib/zod/dateRange";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z
  .object({
    name: z.string().min(1).max(120),
    property: z.string().min(1).max(160),
    city: z.string().max(120).optional(),
    stakeholder_group: z.string().max(80).optional(),
    rooms_reserved: z.coerce.number().int().min(0).max(100000).default(0),
    starts_on: z.string().optional(),
    ends_on: z.string().optional(),
  })
  // Sea Trial R2 FINDING-018: when both supplied, end must follow start.
  .refine(...dateRangeRefine("starts_on", "ends_on"));

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createAccommodationBlock(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accommodation_blocks")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      property: parsed.data.property,
      city: parsed.data.city || null,
      stakeholder_group: parsed.data.stakeholder_group || null,
      rooms_reserved: parsed.data.rooms_reserved,
      starts_on: parsed.data.starts_on || null,
      ends_on: parsed.data.ends_on || null,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/accommodation/blocks");
  redirect(`/console/accommodation/blocks/${data.id}`);
}
