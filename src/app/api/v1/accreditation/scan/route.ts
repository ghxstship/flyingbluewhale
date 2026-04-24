import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";


/** /api/v1/accreditation/scan — COMPVSS gate decisioning (WF-053). */

const PostSchema = z.object({
  barcode: z.string().min(4).max(200),
  venueId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  gateCode: z.string().max(40).optional(),
  deviceId: z.string().max(80).optional(),
});

type ZoneRow = { id: string; code: string; allowed_categories: string[] | null };

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const supabase = await createClient();

    const { data: accred, error: aerr } = await supabase
      .from("accreditations")
      .select("id, state, valid_from, valid_to, category_id, person_name, accreditation_categories!inner(code)")
      .eq("org_id", session.orgId)
      .eq("card_barcode", input.barcode)
      .maybeSingle();

    if (aerr) return apiError("internal", aerr.message);
    if (!accred) {
      return recordScan(supabase, session.orgId, null, input, "deny", "unknown_card", session.userId);
    }

    const now = new Date();
    const fromOk = !accred.valid_from || new Date(accred.valid_from) <= now;
    const toOk = !accred.valid_to || new Date(accred.valid_to) >= now;

    if (accred.state !== "issued") {
      return recordScan(supabase, session.orgId, accred.id, input, "deny", `state:${accred.state}`, session.userId);
    }
    if (!fromOk || !toOk) {
      return recordScan(supabase, session.orgId, accred.id, input, "deny", "out_of_window", session.userId);
    }

    let zoneAllowed = true;
    if (input.zoneId) {
      const { data: zone } = (await supabase
        .from("venue_zones")
        .select("id, code, allowed_categories")
        .eq("id", input.zoneId)
        .maybeSingle()) as { data: ZoneRow | null };
      const categoryCode = (accred as unknown as { accreditation_categories: { code: string } }).accreditation_categories?.code;
      if (zone && Array.isArray(zone.allowed_categories) && zone.allowed_categories.length > 0) {
        zoneAllowed = Boolean(categoryCode && zone.allowed_categories.includes(categoryCode));
      }
    }

    const result = zoneAllowed ? "allow" : "deny";
    const reason = zoneAllowed ? null : "zone_not_permitted";
    return recordScan(supabase, session.orgId, accred.id, input, result, reason, session.userId);
  });
}

async function recordScan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  accreditationId: string | null,
  input: z.infer<typeof PostSchema>,
  result: "allow" | "deny" | "warn",
  reason: string | null,
  scannedBy: string,
) {
  const { data, error } = await supabase
    .from("access_scans")
    .insert({
      org_id: orgId,
      accreditation_id: accreditationId,
      venue_id: input.venueId ?? null,
      zone_id: input.zoneId ?? null,
      gate_code: input.gateCode ?? null,
      device_id: input.deviceId ?? null,
      result,
      reason,
      scanned_by: scannedBy,
    })
    .select("id, result, reason, scanned_at")
    .single();
  if (error) return apiError("internal", error.message);
  return apiCreated({ scan: data });
}
