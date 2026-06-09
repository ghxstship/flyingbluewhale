"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(1).max(120),
  project_id: z.string().uuid().optional().or(z.literal("")),
  center_lat: z.string().refine((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= -90 && n <= 90;
  }, "Latitude must be -90..90"),
  center_lng: z.string().refine((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= -180 && n <= 180;
  }, "Longitude must be -180..180"),
  radius_m: z.string().refine((v) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 25 && n <= 5000;
  }, "Radius must be 25..5000 meters"),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createZoneAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Time-clock zones are an operations-trust surface — manager+ only.
  if (!isManagerPlus(session)) return { error: "Only manager+ can manage time-clock zones" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guard on project_id.
  if (parsed.data.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", parsed.data.project_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization" };
  }

  const { data, error } = await supabase
    .from("time_clock_zones")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id || null,
      name: parsed.data.name,
      center_lat: Number(parsed.data.center_lat),
      center_lng: Number(parsed.data.center_lng),
      radius_m: Number(parsed.data.radius_m),
      lifecycle_state: "active",
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/console/settings/time-clock-zones");
  redirect(`/console/settings/time-clock-zones/${data.id}`);
}
