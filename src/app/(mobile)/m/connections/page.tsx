import { fmtPosition } from "@/lib/mobile/fmt-position";
import { ChevronLeft } from "lucide-react";
import { Fab } from "@/components/mobile/kit";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { ConnectionsView, type ConnectionRow, type Suggestion } from "./ConnectionsView";

export const dynamic = "force-dynamic";

/**
 * /m/connections — My ATLVS Network. Backed by the real `connections` graph
 * (cross-org, user-owned). Three sections: My Network (connected, either side),
 * Pending (incoming requests I can Accept/Decline), and Suggestions (org crew
 * with a user_id I'm not already linked to). Names hydrate from `users` /
 * `user_profiles`. Inserts/updates flow through `connections/actions.ts` where
 * the owner column is set to the session user so RLS WITH CHECK passes.
 */
export default async function ConnectionsPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase();

  // 1. All connection rows where I'm either party.
  const { data: conns } = await supabase
    .from("connections")
    .select(
      "id, requester_user_id, addressee_user_id, connection_state, requested_at, responded_at",
    )
    .or(`requester_user_id.eq.${session.userId},addressee_user_id.eq.${session.userId}`)
    .order("requested_at", { ascending: false })
    .limit(200);

  const rows = conns ?? [];

  // The "other" user id for each row (the person who isn't me).
  const counterpartIds = new Set<string>();
  for (const r of rows) {
    const other = r.requester_user_id === session.userId ? r.addressee_user_id : r.requester_user_id;
    counterpartIds.add(other);
  }

  // 2. Hydrate names for everyone involved in a connection row.
  const nameById = new Map<string, { name: string; role: string }>();
  if (counterpartIds.size > 0) {
    const ids = [...counterpartIds];
    const [{ data: users }, { data: profiles }] = await Promise.all([
      supabase.from("users").select("id, name, email").in("id", ids),
      supabase.from("user_profiles").select("user_id, display_name, role_title").in("user_id", ids),
    ]);
    const profById = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    for (const u of users ?? []) {
      const prof = profById.get(u.id);
      nameById.set(u.id, {
        name: prof?.display_name || u.name || u.email || t("m.connections.unnamed", undefined, "Member"),
        role: fmtPosition(prof?.role_title) || t("m.connections.crew", undefined, "Crew"),
      });
    }
  }

  const toRow = (id: string, other: string, state: string): ConnectionRow => {
    const meta = nameById.get(other) ?? {
      name: t("m.connections.unnamed", undefined, "Member"),
      role: t("m.connections.crew", undefined, "Crew"),
    };
    return { id, userId: other, name: meta.name, av: initials(meta.name), role: meta.role, state };
  };

  const network: ConnectionRow[] = rows
    .filter((r) => r.connection_state === "connected")
    .map((r) =>
      toRow(
        r.id,
        r.requester_user_id === session.userId ? r.addressee_user_id : r.requester_user_id,
        r.connection_state,
      ),
    );

  const pending: ConnectionRow[] = rows
    .filter((r) => r.connection_state === "pending" && r.addressee_user_id === session.userId)
    .map((r) => toRow(r.id, r.requester_user_id, r.connection_state));

  // Any user id already in a connection row (any state) is excluded from suggestions.
  const linkedIds = new Set<string>(counterpartIds);

  // 3. Suggestions: org crew who have a platform user_id I'm not linked to.
  // (crew_members absorbed the old workforce table per ADR-0015, so one read.)
  const { data: crew } = await supabase
    .from("crew_members")
    .select("user_id, name, role, certifications")
    .eq("org_id", session.orgId)
    .not("user_id", "is", null)
    .limit(80);

  const suggestionMap = new Map<string, Suggestion>();
  for (const c of crew ?? []) {
    const uid = c.user_id as string | null;
    if (!uid || uid === session.userId || linkedIds.has(uid) || suggestionMap.has(uid)) continue;
    const certs = Array.isArray(c.certifications) ? (c.certifications as string[]) : [];
    suggestionMap.set(uid, {
      userId: uid,
      name: c.name ?? t("m.connections.unnamed", undefined, "Member"),
      av: initials(c.name ?? "?"),
      role: c.role ?? t("m.connections.crew", undefined, "Crew"),
      tags: certs.slice(0, 4),
    });
  }
  const suggestions = [...suggestionMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="screen screen-anim">
      <a className="backbtn" href="/m/more">
        <ChevronLeft size={17} /> {t("m.more.title", undefined, "More")}
      </a>
      <div className="scr-eye">
        {t("m.connections.count", { n: network.length }, `${network.length} Connected`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.connections.title", undefined, "Connections")}
      </h1>
      <ConnectionsView
        network={network}
        pending={pending}
        suggestions={suggestions}
        labels={{
          search: t("m.connections.search", undefined, "Search By Name, Trade, Skill, Cert…"),
          sectionNetwork: t("m.connections.network", undefined, "My Network"),
          sectionPending: t("m.connections.pendingSection", undefined, "Pending Requests"),
          sectionSuggestions: t("m.connections.suggestions", undefined, "Suggestions"),
          emptyTitle: t("m.connections.empty", undefined, "No People"),
          emptyBody: t(
            "m.connections.emptyBody",
            undefined,
            "No other crew in this org yet. Connections appear here as your network grows.",
          ),
          connect: t("m.connections.connect", undefined, "Connect"),
          accept: t("m.connections.accept", undefined, "Accept"),
          decline: t("m.connections.decline", undefined, "Decline"),
          remove: t("m.connections.remove", undefined, "Remove"),
          requestSent: t("m.connections.requestSent", undefined, "Request Sent"),
          connected: t("m.connections.connected", undefined, "Connected"),
        }}
      />
      {/* Kit FAB: Add Connection — the kit routes it to the invite form, which
          is the referrals surface here (invite by link / email). */}
      <Fab href="/m/referrals" label={t("m.connections.add", undefined, "Add Connection")} />
    </div>
  );
}
