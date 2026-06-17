import { apiError, apiOk } from "@/lib/api";
import { withAuth, assertScope } from "@/lib/auth";
import { toZapierAssignmentScan } from "@/lib/integrations/zapier/payloads";
import { createClient } from "@/lib/supabase/server";

/**
 * Polling trigger — most recent assignment scan events across the org.
 * assignment_events carries org_id directly so this is a single query.
 * Replaces the prior /ticket-scans trigger; same Zap-side dedupe via id.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return withAuth(async (session) => {
    const denied = assertScope(session, "assignments:read");
    if (denied) return denied;
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("assignment_events")
      .select("id, assignment_id, scan_code_id, actor_user_id, result, at, location, assignments!inner(catalog_kind)")
      .eq("org_id", session.orgId)
      .eq("event_kind", "scan")
      .order("at", { ascending: false })
      .limit(50);
    if (error) return apiError("internal", error.message);
    type Row = {
      id: string;
      assignment_id: string;
      scan_code_id: string | null;
      actor_user_id: string | null;
      result: string | null;
      at: string;
      location: unknown;
      assignments: { catalog_kind: string } | null;
    };
    const flat = (data ?? []).map((r) => {
      const row = r as Row;
      return {
        id: row.id,
        assignment_id: row.assignment_id,
        scan_code_id: row.scan_code_id,
        actor_user_id: row.actor_user_id,
        result: row.result,
        at: row.at,
        location: row.location,
        catalog_kind: row.assignments?.catalog_kind ?? "unknown",
      };
    });
    return apiOk(flat.map(toZapierAssignmentScan));
  });
}
