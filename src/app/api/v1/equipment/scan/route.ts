import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Asset-tag lookup + check-in/out toggle. Mirrors `/api/v1/tickets/scan`
 * for equipment. Given an `assetTag`, fetches the equipment row, toggles
 * its `status` between `available` and `checked_out`.
 */

const ScanInput = z.object({
  assetTag: z.string().min(1).max(200),
  action: z.enum(["check_in", "check_out", "toggle"]).default("toggle"),
});

export async function POST(req: NextRequest) {
  const input = await parseJson(req, ScanInput);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const supabase = await createClient();
    const { data: row } = await supabase
      .from("equipment")
      .select("id, name, asset_tag, status")
      .eq("org_id", session.orgId)
      .eq("asset_tag", input.assetTag)
      .is("deleted_at", null)
      .maybeSingle();
    if (!row) {
      return apiOk({ result: "not_found" as const, assetTag: input.assetTag });
    }
    // equipment_status enum: available | reserved | in_use | maintenance | retired.
    // Check-out maps to `in_use`; check-in to `available`.
    let nextStatus: "available" | "reserved" | "in_use" | "maintenance" | "retired" = row.status;
    if (input.action === "check_in") nextStatus = "available";
    else if (input.action === "check_out") nextStatus = "in_use";
    else nextStatus = row.status === "in_use" ? "available" : "in_use";

    const { error } = await (supabase.from("equipment") as never as {
      update: (p: Record<string, unknown>) => ReturnType<typeof supabase.from>;
    })
      .update({ status: nextStatus })
      .eq("id", row.id);
    if (error) return apiError("internal", error.message);
    return apiOk({
      result: "ok" as const,
      equipmentId: row.id,
      name: row.name,
      assetTag: row.asset_tag,
      previousStatus: row.status,
      status: nextStatus,
    });
  });
}
