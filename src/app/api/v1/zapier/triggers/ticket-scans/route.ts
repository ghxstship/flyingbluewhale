import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { toZapierTicketScan } from "@/lib/integrations/zapier/payloads";
import { createClient } from "@/lib/supabase/server";

/**
 * Polling trigger — most recent ticket scans across the org. ticket_scans
 * has no `org_id` column directly, so we join through `tickets` via the
 * inner-select shape Supabase uses for relational filters. RLS would also
 * block cross-org leakage, but the explicit eq is the belt to RLS's
 * suspenders.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const supabase = await createClient();

    // Resolve ticket IDs for this org first, then fetch scans referencing
    // them. Two round-trips beats a join we'd have to type-assert through.
    const { data: tickets, error: ticketErr } = await supabase
      .from("tickets")
      .select("id")
      .eq("org_id", session.orgId)
      .limit(100_000);
    if (ticketErr) return apiError("internal", ticketErr.message);
    const ticketIds = (tickets ?? []).map((t) => t.id);
    if (ticketIds.length === 0) return apiOk([]);

    const { data, error } = await supabase
      .from("ticket_scans")
      .select("id, ticket_id, scanner_id, scanned_at, location, result")
      .in("ticket_id", ticketIds)
      .order("scanned_at", { ascending: false })
      .limit(50);
    if (error) return apiError("internal", error.message);
    return apiOk((data ?? []).map(toZapierTicketScan));
  });
}
