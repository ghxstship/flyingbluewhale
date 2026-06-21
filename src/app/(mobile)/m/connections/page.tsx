import { ChevronLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { ConnectionsView, type Connection } from "./ConnectionsView";

export const dynamic = "force-dynamic";

/**
 * /m/connections — Your ATLVS Network.
 *
 * COMPVSS kit `tab==="connections"` (design truth app.jsx 2181-2235). There is
 * NO connection-graph table in the schema, so this is honest: we surface other
 * org crew (`crew_members`, excluding the viewer) as SUGGESTED connections —
 * every one renders the "Connect" affordance. Until a `connections` table
 * exists, connect/pending are presentational. If the org has no other crew,
 * a tasteful empty state renders instead of fabricated rows.
 */
export default async function ConnectionsPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("crew_members")
    .select("id, name, role, certifications, user_id, public_handle")
    .eq("org_id", session.orgId)
    .order("name", { ascending: true })
    .limit(60);

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const connections: Connection[] = (data ?? [])
    .filter((c) => c.user_id !== session.userId)
    .map((c) => {
      const certs = Array.isArray(c.certifications) ? (c.certifications as string[]) : [];
      return {
        id: c.id as string,
        name: (c.name as string) ?? t("m.connections.unnamed", undefined, "Unnamed"),
        av: initials((c.name as string) ?? "?"),
        role: (c.role as string) ?? t("m.connections.crew", undefined, "Crew"),
        region: "",
        tags: certs.slice(0, 4),
        mutual: 0,
        // No connection graph yet — everyone is a suggestion to connect with.
        status: "connect" as const,
      };
    });

  return (
    <div className="screen screen-anim">
      <a className="backbtn" href="/m/more">
        <ChevronLeft size={17} /> {t("m.more.title", undefined, "More")}
      </a>
      <div className="scr-eye">
        {t("m.connections.count", { n: connections.length }, `${connections.length} Suggested`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.connections.title", undefined, "My Connections")}
      </h1>
      <ConnectionsView
        connections={connections}
        labels={{
          search: t("m.connections.search", undefined, "Search By Name, Trade, Skill, Cert…"),
          emptyTitle: t("m.connections.empty", undefined, "No People"),
          emptyBody: t(
            "m.connections.emptyBody",
            undefined,
            "No other crew in this org yet — suggestions appear here as your network grows.",
          ),
          connect: t("m.connections.connect", undefined, "Connect"),
          pending: t("m.connections.pending", undefined, "Pending"),
          requestSent: t("m.connections.requestSent", undefined, "Request Sent"),
        }}
      />
    </div>
  );
}
