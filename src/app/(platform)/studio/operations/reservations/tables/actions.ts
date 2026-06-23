"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { VENUE_TABLE_STATES } from "@/lib/reservations";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const CreateTableSchema = z.object({
  table_no: z.string().min(1).max(40),
  seats: z.coerce.number().int().min(1).max(100),
  zone: z.string().max(80).optional(),
  x: z.coerce.number().min(0).max(100).optional(),
  y: z.coerce.number().min(0).max(100).optional(),
  table_state: z.enum(VENUE_TABLE_STATES).optional(),
  notes: z.string().max(2000).optional(),
});

export async function createVenueTable(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create tables" };
  const parsed = CreateTableSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { error } = await supabase.from("venue_tables").insert({
    org_id: session.orgId,
    table_no: parsed.data.table_no,
    seats: parsed.data.seats,
    zone: parsed.data.zone || null,
    x: parsed.data.x ?? 0,
    y: parsed.data.y ?? 0,
    table_state: parsed.data.table_state ?? "available",
    notes: parsed.data.notes || null,
    created_by: session.userId,
  });
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/operations/reservations");
  redirect("/studio/operations/reservations");
}
