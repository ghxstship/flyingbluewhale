import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * COMPVSS switcher hydration — the org list + project catalog that fill the
 * `MobileSwitcherSheet` (workspace/project drawer).
 *
 * This work used to run in the `(mobile)` layout on EVERY navigation: newest 50
 * projects + every referenced client + venue + the user's memberships, purely
 * to populate a sheet that stays closed almost always. It's now DEFERRED — the
 * sheet fetches this endpoint the first time it opens, so a normal nav pays only
 * for the two live count badges + the one active-project read. Same reads, just
 * lazy.
 *
 * Org-scoped by the session (RLS enforces membership); no query params.
 */

type SwitcherOrg = { id: string; name: string; sub: string };
type SwitcherProject = {
  id: string;
  name: string;
  client: string;
  venue: string;
  location: string;
  status: "Live" | "Planning" | "Closed";
  sub: string;
};

export async function GET() {
  return withAuth(async (session) => {
    const supabase = await createClient();

    // The kit's project row reads `name / client · venue / location · sub`, so
    // client and venue are resolved in a second pass rather than an embed: the
    // FK-hinted embed form overflows PostgREST's generic inference (TS2589), and
    // two indexed reads are cheaper to reason about than a cast that hides the
    // shape.
    const [{ data: projectRows, error: projErr }, { data: memberRows }] = await Promise.all([
      supabase
        .from("projects")
        .select("id, name, project_state, start_date, client_id, primary_venue_id")
        .eq("org_id", session.orgId)
        .is("deleted_at", null)
        .order("start_date", { ascending: false, nullsFirst: false })
        .limit(50),
      supabase
        .from("memberships")
        .select("org_id, orgs(name, tier)")
        .eq("user_id", session.userId)
        .is("deleted_at", null),
    ]);
    if (projErr) return apiError("internal", projErr.message);

    let orgs: SwitcherOrg[] = [{ id: session.orgId, name: "Workspace", sub: "Organization" }];
    const orgList = ((memberRows ?? []) as unknown as { org_id: string; orgs: { name?: string; tier?: string } | null }[])
      .filter((m) => m.orgs?.name)
      .map((m) => ({ id: m.org_id, name: m.orgs!.name!, sub: m.orgs?.tier ? `${m.orgs.tier} plan` : "Organization" }));
    if (orgList.length) orgs = orgList;

    const projRows = projectRows ?? [];
    const clientIds = Array.from(new Set(projRows.map((p) => p.client_id).filter(Boolean))) as string[];
    const venueIds = Array.from(new Set(projRows.map((p) => p.primary_venue_id).filter(Boolean))) as string[];
    const [{ data: clientRows }, { data: venueRows }] = await Promise.all([
      clientIds.length
        ? supabase.from("clients").select("id, name").in("id", clientIds).is("deleted_at", null)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      venueIds.length
        ? supabase.from("locations").select("id, name, city, country").in("id", venueIds)
        : Promise.resolve({ data: [] as { id: string; name: string; city: string | null; country: string | null }[] }),
    ]);
    const clientById = new Map((clientRows ?? []).map((c) => [c.id, c.name]));
    const venueById = new Map((venueRows ?? []).map((v) => [v.id, v]));

    const projects: SwitcherProject[] = projRows.map((p) => {
      // Kit chips are exactly Live / Planning / Closed — map project_state onto
      // those three rather than inventing a fourth the filter can't reach.
      const status: SwitcherProject["status"] =
        p.project_state === "active"
          ? "Live"
          : p.project_state === "draft" || p.project_state === "paused"
            ? "Planning"
            : "Closed";
      const venue = p.primary_venue_id ? venueById.get(p.primary_venue_id) : null;
      const place = [venue?.city, venue?.country].filter(Boolean).join(", ");
      return {
        id: p.id,
        name: p.name,
        client: (p.client_id ? clientById.get(p.client_id) : null) ?? "—",
        venue: venue?.name ?? "—",
        location: place || "—",
        status,
        sub: status === "Live" ? "Live Now" : (p.start_date ?? status),
      };
    });

    return apiOk({ orgs, projects, currentOrgId: session.orgId });
  });
}
