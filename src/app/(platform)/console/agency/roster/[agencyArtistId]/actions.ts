"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  agency_artist_id: z.string().uuid(),
  commission_bps: z.string().optional().or(z.literal("")),
  exclusive: z.string().optional(),
  signed_at: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateAgencyArtistAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const bps = parsed.data.commission_bps
    ? Math.min(5000, Math.max(0, Math.round(Number(parsed.data.commission_bps))))
    : null;
  const { error } = await supabase
    .from("agency_artists")
    .update({
      commission_bps: bps,
      exclusive: parsed.data.exclusive === "on",
      signed_at: parsed.data.signed_at || null,
    })
    .eq("id", parsed.data.agency_artist_id)
    .eq("org_id", session.orgId);
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/agency/roster");
  return { ok: true };
}

export async function endAgencyArtistAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const id = String(fd.get("agency_artist_id") ?? "");
  if (!id) return { error: "Missing roster entry" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("agency_artists")
    .update({ ended_at: new Date().toISOString().slice(0, 10) })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath("/console/agency/roster");
  redirect("/console/agency/roster");
}
