"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateRangeRefine } from "@/lib/zod/dateRange";

const Schema = z
  .object({
    name: z.string().min(1),
    starts_at: z.string().min(1),
    ends_at: z.string().min(1),
    location_id: z.string().uuid().optional().or(z.literal("")),
    project_id: z.string().uuid().optional().or(z.literal("")),
    description: z.string().optional(),
  })
  // Sea Trial R2 FINDING-018: ends_at must not precede starts_at.
  .refine(...dateRangeRefine("starts_at", "ends_at"));

export type State = { error?: string } | null;

export async function createEventAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();

  // Cross-tenant FK guards on location_id + project_id.
  if (parsed.data.location_id) {
    const { data: location } = await supabase
      .from("locations")
      .select("id")
      .eq("id", parsed.data.location_id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!location) return { error: "Location not found in your organization" };
  }
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

  // Sea Trial FINDING-017: stamp `created_by` so the audit panel + ROS
  // can attribute event creation. Column added in migration
  // 20260504000001_events_created_by.sql.
  const { error } = await supabase.from("events").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    starts_at: new Date(parsed.data.starts_at).toISOString(),
    ends_at: new Date(parsed.data.ends_at).toISOString(),
    location_id: parsed.data.location_id || null,
    project_id: parsed.data.project_id || null,
    description: parsed.data.description || null,
    created_by: session.userId,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/events");
  revalidatePath("/console/schedule");
  redirect("/console/events");
}
