import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EventGuide, GuidePersona } from "@/lib/supabase/types";

export async function listGuides(orgId: string, projectId: string): Promise<EventGuide[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_guides")
    .select("*")
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .order("tier", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventGuide[];
}

export async function getGuideByPersona(projectId: string, persona: GuidePersona): Promise<EventGuide | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_guides")
    .select("*")
    .eq("project_id", projectId)
    .eq("persona", persona)
    .maybeSingle();
  return (data ?? null) as EventGuide | null;
}

export const PERSONA_TIERS: Record<GuidePersona, { tier: number; classification: string }> = {
  staff:    { tier: 1, classification: "INTERNAL — STAFF ONLY" },
  crew:     { tier: 2, classification: "INTERNAL — PRODUCTION CREW ONLY" },
  vendor:   { tier: 3, classification: "VENDOR USE" },
  artist:   { tier: 4, classification: "CONFIDENTIAL — ARTIST & INDUSTRY ACCESS" },
  client:   { tier: 4, classification: "CLIENT USE" },
  sponsor:  { tier: 4, classification: "SPONSOR USE" },
  guest:    { tier: 5, classification: "PUBLIC — GUEST COPY" },
  custom:   { tier: 5, classification: "CUSTOM" },
};
