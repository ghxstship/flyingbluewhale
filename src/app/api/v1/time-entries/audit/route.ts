import { apiError } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

// Timesheet audit-log export. Returns CSV of all time entries in the date
// range with full detail: who clocked what, when, where (geofence + zone),
// and any shift linkage. Managers can run this for compliance reviews.
// Competes with Connecteam's audit log export and Deputy's compliance features.

function isoOrNull(s: string | null | undefined): string {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells
    .map((c) => {
      const v = c == null ? "" : String(c);
      return v.includes(",") || v.includes('"') || v.includes("\n") ? `"${v.replace(/"/g, '""')}"` : v;
    })
    .join(",");
}

export async function GET(req: Request) {
  if (!hasSupabase) return apiError("service_unavailable", "Supabase is not configured");

  return withAuth(async (session) => {
    // Only managers+ can pull audit exports — controller/owner/admin.
    const denial = assertCapability(session, "time_entries:read");
    if (denial) return denial;

    const url = new URL(req.url);
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = toParam ? new Date(toParam) : new Date();

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return apiError("bad_request", "Invalid from/to date — use ISO 8601 format");
    }
    if (to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) {
      return apiError("bad_request", "Date range cannot exceed 366 days");
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("time_entries")
      .select(
        `id, user_id, project_id, description, started_at, ended_at, duration_minutes,
         billable, activity_category, geofence_state, punch_lat, punch_lng,
         created_at, updated_at, shift_id, zone_id,
         projects(name),
         users:user_id(email)`,
      )
      .eq("org_id", session.orgId)
      .gte("started_at", from.toISOString())
      .lte("started_at", to.toISOString())
      .order("started_at", { ascending: true })
      .limit(10_000);

    if (error) return apiError("internal", error.message);

    const rows = (data ?? []) as Array<{
      id: string;
      user_id: string;
      project_id: string | null;
      description: string | null;
      started_at: string;
      ended_at: string | null;
      duration_minutes: number | null;
      billable: boolean;
      activity_category: string;
      geofence_state: string | null;
      punch_lat: number | null;
      punch_lng: number | null;
      created_at: string;
      updated_at: string;
      shift_id: string | null;
      zone_id: string | null;
      projects: { name: string } | null;
      users: { email: string } | null;
    }>;

    const header = csvRow([
      "entry_id",
      "user_email",
      "user_id",
      "project_name",
      "project_id",
      "description",
      "activity_category",
      "started_at",
      "ended_at",
      "duration_minutes",
      "billable",
      "geofence_state",
      "punch_lat",
      "punch_lng",
      "zone_id",
      "shift_id",
      "created_at",
      "updated_at",
    ]);

    const lines = rows.map((r) =>
      csvRow([
        r.id,
        r.users?.email ?? "",
        r.user_id,
        r.projects?.name ?? "",
        r.project_id ?? "",
        r.description ?? "",
        r.activity_category,
        isoOrNull(r.started_at),
        isoOrNull(r.ended_at),
        r.duration_minutes,
        r.billable ? "true" : "false",
        r.geofence_state ?? "",
        r.punch_lat,
        r.punch_lng,
        r.zone_id ?? "",
        r.shift_id ?? "",
        isoOrNull(r.created_at),
        isoOrNull(r.updated_at),
      ]),
    );

    const csv = [header, ...lines].join("\n");
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);

    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="timesheets-audit-${fromStr}-to-${toStr}.csv"`,
        "cache-control": "no-store",
      },
    });
  });
}
