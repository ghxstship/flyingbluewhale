"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  address: z.string().max(300).optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  region: z.string().max(120).optional().or(z.literal("")),
  postcode: z.string().max(40).optional().or(z.literal("")),
  country: z.string().max(120).optional().or(z.literal("")),
  lat: z.string().optional(),
  lng: z.string().optional(),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateLocation(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("locations", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    address: parsed.data.address || null,
    city: parsed.data.city || null,
    region: parsed.data.region || null,
    postcode: parsed.data.postcode || null,
    country: parsed.data.country || null,
    lat: parsed.data.lat ? Number(parsed.data.lat) : null,
    lng: parsed.data.lng ? Number(parsed.data.lng) : null,
    notes: parsed.data.notes || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Location not found." };
  }
  revalidatePath(`/studio/locations/${id}`);
  revalidatePath("/studio/locations");
  redirect(`/studio/locations/${id}`);
}

export async function deleteLocation(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("locations").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete location: ${error.message}`);
  revalidatePath("/studio/locations");
  redirect("/studio/locations");
}
