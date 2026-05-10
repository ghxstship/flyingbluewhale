import { type NextRequest } from "next/server";
import { apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/v1/locations?q=<search>
 *
 * Lightweight typeahead lookup over the org's `locations` table. Used by
 * the picker page (and any combobox that wants to surface saved
 * locations). Returns up to 25 matches.
 */
// PostgREST `.or()` filter expressions are parsed at the URL layer:
// `,` separates clauses, `.` separates field/operator/value, `()` wraps
// nested groups. Raw user input interpolated into one of these strings
// can inject extra OR clauses or break out of the value position. We
// sanitize `q` to alphanumerics + spaces + a handful of obvious-typeable
// punctuation; anything else is dropped. With 25 chars of safe input
// the typeahead remains useful and the filter contract is preserved.
function sanitizeSearch(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9 \-_'&]/g, "").slice(0, 60);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = sanitizeSearch((url.searchParams.get("q") ?? "").trim().toLowerCase());
  return withAuth(async (session) => {
    const supabase = await createClient();
    let query = supabase
      .from("locations")
      .select("id, name, address, city, region")
      .eq("org_id", session.orgId)
      .order("name", { ascending: true })
      .limit(25);
    if (q) {
      // Postgres ilike search across name + address + city.
      query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%,city.ilike.%${q}%`);
    }
    const { data } = await query;
    return apiOk({
      locations: (data ?? []).map((l) => ({
        id: l.id,
        name: l.name,
        secondary: [l.address, l.city, l.region].filter(Boolean).join(", "),
      })),
    });
  });
}
