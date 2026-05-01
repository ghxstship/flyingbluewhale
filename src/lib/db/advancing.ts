import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Deliverable, DeliverableType } from "@/lib/supabase/types";

export const TALENT_TYPES: { type: DeliverableType; label: string }[] = [
  { type: "technical_rider", label: "Technical Rider" },
  { type: "hospitality_rider", label: "Hospitality Rider" },
  { type: "input_list", label: "Input List" },
  { type: "stage_plot", label: "Stage Plot" },
  { type: "crew_list", label: "Touring Crew List" },
  { type: "guest_list", label: "Guest List" },
];

export const PRODUCTION_TYPES: { type: DeliverableType; label: string }[] = [
  { type: "equipment_pull_list", label: "Equipment Pull List" },
  { type: "power_plan", label: "Power Plan" },
  { type: "rigging_plan", label: "Rigging Plan" },
  { type: "site_plan", label: "Site Plan" },
  { type: "build_schedule", label: "Build Schedule" },
  { type: "vendor_package", label: "Vendor Package" },
  { type: "safety_compliance", label: "Safety & compliance" },
  { type: "comms_plan", label: "Comms Plan" },
  { type: "signage_grid", label: "Signage Grid" },
];

export function labelForType(t: DeliverableType): string {
  const all = [...TALENT_TYPES, ...PRODUCTION_TYPES];
  return all.find((x) => x.type === t)?.label ?? t.replace(/_/g, " ");
}

export async function listDeliverables(projectId: string, types?: DeliverableType[]): Promise<Deliverable[]> {
  const supabase = await createClient();
  let q = supabase.from("deliverables").select("*").eq("project_id", projectId);
  if (types && types.length > 0) q = q.in("type", types);
  // Cap at 1000 deliverables per project view; the advancing UI paginates
  // beyond that anyway and unbounded scans risk Supabase's 60s timeout
  // on long-running projects with vendor revisions.
  const { data, error } = await q.order("created_at", { ascending: false }).limit(1000);
  if (error) throw error;
  return (data ?? []) as Deliverable[];
}

export async function projectIdFromSlug(slug: string): Promise<{ id: string; name: string; org_id: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("id,name,org_id").eq("slug", slug).maybeSingle();
  return data as { id: string; name: string; org_id: string } | null;
}

export async function getDeliverable(id: string): Promise<Deliverable | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("deliverables").select("*").eq("id", id).maybeSingle();
  return (data ?? null) as Deliverable | null;
}
