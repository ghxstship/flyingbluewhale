import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * Asset-tag lookup + check-in/out toggle. Mirrors `/api/v1/scan`
 * for equipment. Given an `assetTag`, fetches the equipment row, toggles
 * its `status` between `available` and `checked_out`.
 */

const ScanInput = z.object({
  assetTag: z.string().min(1).max(200),
  action: z.enum(["check_in", "check_out", "toggle"]).default("toggle"),
});

export async function POST(req: NextRequest) {
  // Field-scan bucket — 120/min. Same envelope as ticket scans; bounds
  // the equipment-toggle endpoint against accidental burst (a stuck
  // scanner) or malicious enumeration of asset_tags.
  const rl = await ratelimit({
    key: keyFromRequest(req, "equipment:scan"),
    ...RATE_BUDGETS.scan,
  });
  if (!rl.ok) return apiError("rate_limited", "Equipment scan rate limit reached");

  const input = await parseJson(req, ScanInput);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const supabase = await createClient();
    const { data: row } = await supabase
      .from("equipment")
      .select("id, name, asset_tag, equipment_state")
      .eq("org_id", session.orgId)
      .eq("asset_tag", input.assetTag)
      .is("deleted_at", null)
      .maybeSingle();
    if (!row) {
      return apiOk({ result: "not_found" as const, assetTag: input.assetTag });
    }
    // equipment_status enum: available | reserved | in_use | maintenance | retired.
    // Check-out maps to `in_use`; check-in to `available`.
    let nextStatus: "available" | "reserved" | "in_use" | "maintenance" | "retired" = row.equipment_state;
    if (input.action === "check_in") nextStatus = "available";
    else if (input.action === "check_out") nextStatus = "in_use";
    else nextStatus = row.equipment_state === "in_use" ? "available" : "in_use";

    // Conditional update on .eq("equipment_state", row.equipment_state) closes the TOCTOU
    // between the SELECT above and this write — concurrent scans on the
    // same asset would otherwise overwrite each other's transitions.
    // The org_id filter is defense in depth alongside RLS.
    const { data: updated, error } = await supabase
      .from("equipment")
      .update({ equipment_state: nextStatus })
      .eq("id", row.id)
      .eq("org_id", session.orgId)
      .eq("equipment_state", row.equipment_state)
      .select("id");
    if (error) return apiError("internal", error.message);
    if (!updated || updated.length === 0) {
      return apiError("conflict", "Equipment status changed concurrently — re-scan to confirm current state");
    }
    return apiOk({
      result: "ok" as const,
      equipmentId: row.id,
      name: row.name,
      assetTag: row.asset_tag,
      previousStatus: row.equipment_state,
      equipment_state: nextStatus,
    });
  });
}
