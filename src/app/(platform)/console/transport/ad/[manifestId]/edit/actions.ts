"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  kind: z.string(),
  status: z.string(),
  flight_ref: z.string().max(80).optional().or(z.literal("")),
  carrier: z.string().max(120).optional().or(z.literal("")),
  party_size: z.string().optional(),
  scheduled_at: z.string().optional().or(z.literal("")),
  actual_at: z.string().optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateAdManifest(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("ad_manifests", session.orgId, id, expectedUpdatedAt, {
    kind: parsed.data.kind,
    status: parsed.data.status,
    flight_ref: parsed.data.flight_ref || null,
    carrier: parsed.data.carrier || null,
    party_size: parsed.data.party_size ? Number(parsed.data.party_size) : 0,
    scheduled_at: parsed.data.scheduled_at || null,
    actual_at: parsed.data.actual_at || null,
    notes: parsed.data.notes || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Ad Manifest not found." };
  }
  revalidatePath(`/console/transport/ad/${id}`);
  revalidatePath("/console/transport/ad");
  redirect(`/console/transport/ad/${id}`);
}

export async function deleteAdManifest(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("ad_manifests").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/transport/ad");
  redirect("/console/transport/ad");
}
