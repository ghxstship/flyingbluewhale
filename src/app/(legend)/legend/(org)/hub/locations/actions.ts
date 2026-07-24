"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { assertLegendWrite } from "@/lib/legend_access";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

/**
 * Location create (canonical home, decision 6 rider). Moved verbatim from
 * /studio/locations/actions.ts — the hub is now the space registry's only
 * write surface; the console URLs redirect here.
 */

const Schema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  postcode: z.string().optional(),
  notes: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createLocationAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const denied = assertLegendWrite(session);
  if (denied) return denied;
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase.from("locations").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    address: parsed.data.address || null,
    city: parsed.data.city || null,
    region: parsed.data.region || null,
    country: parsed.data.country || null,
    postcode: parsed.data.postcode || null,
    notes: parsed.data.notes || null,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/legend/hub/locations");
  revalidatePath("/legend/hub");
  redirect("/legend/hub/locations");
}
