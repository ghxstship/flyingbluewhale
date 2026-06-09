"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  kind: z.enum(["arrival", "departure"]),
  flight_ref: z.string().max(80).optional(),
  carrier: z.string().max(80).optional(),
  scheduled_at: z.string().optional(),
  party_size: z.coerce.number().int().min(1).max(2000).default(1),
  notes: z.string().max(2000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createAdManifest(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_manifests")
    .insert({
      org_id: session.orgId,
      kind: parsed.data.kind,
      flight_ref: parsed.data.flight_ref || null,
      carrier: parsed.data.carrier || null,
      scheduled_at: parsed.data.scheduled_at || null,
      party_size: parsed.data.party_size,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/transport/ad");
  redirect(`/console/transport/ad/${data.id}`);
}
