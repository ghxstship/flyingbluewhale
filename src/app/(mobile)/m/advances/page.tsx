import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { listMyAssignments } from "@/lib/db/assignments";
import { HubChrome } from "@/components/mobile/HubChrome";
import { AdvancesView, type AdvanceRow } from "./AdvancesView";

export const dynamic = "force-dynamic";

/**
 * /m/advances — cross-project view of everything assigned to the caller.
 * Tickets, credentials, lodging, travel, catering, radios — one list.
 * The portal version (/p/[slug]/crew/advances) is scoped to a single
 * show; this is the "across every project I'm on" view.
 *
 * Server: reads `listMyAssignments` for the user, hydrates project
 * names, then hands plain rows to the surviving client `AdvancesView`.
 */
export default async function MobileAdvancesPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.advances.eyebrow", undefined, "Field")}</div>
        <h1 className="scr-h">{t("m.advances.title", undefined, "Advances")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const assignments = await listMyAssignments(session.orgId, session.userId);

  const projectIds = Array.from(new Set(assignments.map((r) => r.project_id)));
  // The project-name hydration and the live-packet lookup both key off
  // projectIds and are independent — one round trip. The safety-section read
  // below needs the packet ids, so it stays a second round.
  const [projectsRes, packetsRes] = projectIds.length
    ? await Promise.all([
        supabase.from("projects").select("id, name").in("id", projectIds),
        supabase
          .from("advance_packets")
          .select("id, project_id")
          .eq("org_id", session.orgId)
          .eq("packet_state", "live")
          .in("project_id", projectIds)
          .is("deleted_at", null)
          .limit(50),
      ])
    : [null, null];
  const projectMap = new Map<string, string>();
  for (const p of (projectsRes?.data ?? []) as Array<{ id: string; name: string }>) {
    projectMap.set(p.id, p.name);
  }

  const rows: AdvanceRow[] = assignments.map((r) => ({
    id: r.id,
    title: r.title,
    catalogKind: r.catalog_kind,
    fulfillmentState: r.fulfillment_state,
    deadline: r.deadline,
    project: projectMap.get(r.project_id) ?? null,
  }));

  // Kit 27 — the field view of the advance packet: a card per live packet
  // on the caller's projects with the PPE gate (safety section) and their
  // credential status, derived from the same assignment rows below.
  type PacketCard = { projectId: string; packetId: string; ppe: string | null };
  const packetCards: PacketCard[] = [];
  if (projectIds.length) {
    const packetRows = (packetsRes?.data ?? []) as Array<{ id: string; project_id: string }>;
    if (packetRows.length) {
      const { data: safetySections } = await supabase
        .from("advance_packet_sections")
        .select("packet_id, body")
        .in(
          "packet_id",
          packetRows.map((p) => p.id),
        )
        .eq("section_key", "safety")
        .is("deleted_at", null)
        .limit(50);
      const ppeByPacket = new Map<string, string | null>();
      for (const s of (safetySections ?? []) as Array<{ packet_id: string; body: { text?: string } | null }>) {
        ppeByPacket.set(s.packet_id, s.body?.text ?? null);
      }
      for (const p of packetRows) {
        packetCards.push({ projectId: p.project_id, packetId: p.id, ppe: ppeByPacket.get(p.id) ?? null });
      }
    }
  }
  const credentialSummary = (projectId: string): string => {
    const creds = assignments.filter((a) => a.project_id === projectId && a.catalog_kind === "credential");
    if (creds.length === 0) return t("m.advances.packet.noCredentials", undefined, "No credentials assigned yet");
    const issued = creds.filter((a) => ["issued", "transferred", "redeemed"].includes(a.fulfillment_state)).length;
    return t(
      "m.advances.packet.credentialSummary",
      { issued, total: creds.length },
      `${issued} of ${creds.length} credentials issued`,
    );
  };

  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="equipment" active="requests" canManage={isManagerPlus(session)} />
      {packetCards.length > 0 && (
        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          {packetCards.map((card) => (
            <div key={card.packetId} className="item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="t">
                  {projectMap.get(card.projectId) ?? t("m.advances.packet.project", undefined, "Project")}
                </span>
                <span className="ps-badge ps-badge--ok" style={{ flex: "none" }}>
                  {t("m.advances.packet.live", undefined, "Advance Live")}
                </span>
              </div>
              <div className="s">{credentialSummary(card.projectId)}</div>
              {card.ppe && (
                <div className="s">
                  {t("m.advances.packet.ppe", undefined, "PPE")} · {card.ppe}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <AdvancesView rows={rows} />
    </div>
  );
}
