import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api";

/**
 * OSHA 300/300A/301 CSV export — combines core incident metadata with the
 * OSHA classification columns. Includes only osha_recordable=true rows for
 * the requested calendar year. Header row first, then one CSV row per
 * incident. Header is OSHA-form aligned; downstream payroll/safety
 * software typically wants this layout.
 */
export async function GET(req: Request) {
  return withAuth(async (session) => {
    const url = new URL(req.url);
    const year = Number(url.searchParams.get("year") ?? new Date().getFullYear());
    if (!Number.isFinite(year) || year < 2000 || year > 2100) {
      return apiError("bad_request", "year must be between 2000 and 2100");
    }
    const start = new Date(`${year}-01-01T00:00:00Z`).toISOString();
    const end = new Date(`${year + 1}-01-01T00:00:00Z`).toISOString();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("incidents")
      .select(
        "id, occurred_at, location, summary, osha_classification, osha_recordable, days_away, days_restricted, body_part, injury_type, injury_source",
      )
      .eq("org_id", session.orgId)
      .gte("occurred_at", start)
      .lt("occurred_at", end)
      .eq("osha_recordable", true)
      .order("occurred_at", { ascending: true });
    if (error) return apiError("internal", error.message);

    const headers = [
      "Case Number",
      "Date of Injury",
      "Employee Description",
      "Job Title",
      "Location",
      "Injury or Illness Description",
      "Body Part",
      "Injury Type",
      "Injury Source",
      "Classification",
      "Days Away",
      "Days on Job Transfer/Restriction",
    ];
    const lines = [headers.join(",")];
    let caseNum = 1;
    for (const r of data ?? []) {
      const cells = [
        String(caseNum++),
        new Date(r.occurred_at).toISOString().slice(0, 10),
        "", // employee — sourced from your HR module if linked
        "",
        r.location ?? "",
        r.summary ?? "",
        r.body_part ?? "",
        r.injury_type ?? "",
        r.injury_source ?? "",
        r.osha_classification ?? "",
        String(r.days_away ?? 0),
        String(r.days_restricted ?? 0),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(cells.join(","));
    }

    const body = lines.join("\n");
    return new Response(body, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="osha-300-${year}.csv"`,
        "cache-control": "no-store",
      },
    });
  });
}
