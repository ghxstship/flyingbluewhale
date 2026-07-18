import Link from "next/link";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { listMyAssignments } from "@/lib/db/assignments";
import type { GuideConfig } from "@/lib/guides/types";
import { Crumbs, KIcon } from "@/components/mobile/kit";
import { CrisisPanel, type ActiveCrisis } from "./CrisisPanel";
import { CRISIS_ACTIVE_WINDOW_MS } from "./crisis";
import { EMERGENCY_CODES, chipBg, chipFg } from "./data";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Emergency Card — the field crew's manning-list emergency station,
 * like a cruise ship's muster card. The manning card is wired to the viewer's
 * REAL deployment: their active `assignments` row (position + manning id) and
 * the project's crew `event_guides` evacuation section (assembly point + muster
 * routes). When the holder has no active assignment, the card renders an honest
 * "awaiting assignment" state rather than a placeholder station.
 *
 * Kit 31 (live-test resolution #9): the emergency quick actions are PAGES,
 * not modals — this hub links the four dedicated reference surfaces
 * (/m/emergency/{codes,fire,evacuation,shelter}), each with breadcrumbs and
 * the Home tab highlight. The code set (reference data + per-code plans)
 * lives in ./data.ts, shared with the Codes page.
 */

const NA = "—";

export default async function EmergencyPage() {
  const session = await requireSession();
  const { t } = await getRequestT();

  // Real manning context: the holder's active assignment + the project's crew
  // evacuation guide. No fabricated station — honest "—" when unassigned.
  const station = {
    manningId: NA,
    position: t("m.emergency.unassigned", undefined, "Awaiting Assignment"),
    team: NA,
    assembly: NA,
    reportTo: NA,
  };
  // Active declared crisis (crisis.respond) — the console's `crisis_alerts`
  // row, org-scoped by RLS, plus the caller's own response receipts so a
  // reload doesn't re-arm buttons they already pressed.
  let crisis: ActiveCrisis | null = null;
  let musterAckAt: string | null = null;
  let safeAt: string | null = null;
  let needHelpAt: string | null = null;
  // Kit 32 E1 — the ops-side muster count (manager band only): safe / help /
  // unresponsive tallies computed from the alert's REAL receipt rows.
  let muster: { safe: number; help: number; unresponsive: number } | null = null;

  if (hasSupabase) {
    const supabase = await createClient();

    const since = new Date(Date.now() - CRISIS_ACTIVE_WINDOW_MS).toISOString();
    const { data: alerts } = await supabase
      .from("crisis_alerts")
      .select("id, title, body, severity, created_at")
      .eq("org_id", session.orgId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1);
    const alert = alerts?.[0];
    if (alert) {
      crisis = {
        id: alert.id,
        title: alert.title,
        body: alert.body,
        severity: alert.severity,
        createdAt: alert.created_at,
      };
      const { data: receipts } = await supabase
        .from("crisis_alert_receipts")
        .select("channel, acknowledged_at")
        .eq("alert_id", alert.id)
        .eq("user_id", session.userId)
        .in("channel", ["muster_ack", "self_safe", "need_help"]);
      for (const r of receipts ?? []) {
        if (r.channel === "muster_ack") musterAckAt = r.acknowledged_at;
        if (r.channel === "self_safe") safeAt = r.acknowledged_at;
        if (r.channel === "need_help") needHelpAt = r.acknowledged_at;
      }

      // Ops muster count (kit 32 E1). Manager band only — a crew member's
      // job during a code is their own check-in, not the tally. Receipts are
      // org-readable by RLS; membership count is the honest denominator.
      if (isManagerPlus(session)) {
        const [{ data: allReceipts }, { count: memberCount }] = await Promise.all([
          supabase
            .from("crisis_alert_receipts")
            .select("user_id, channel, acknowledged_at")
            .eq("alert_id", alert.id)
            .in("channel", ["self_safe", "need_help"]),
          supabase
            .from("memberships")
            .select("user_id", { count: "exact", head: true })
            .eq("org_id", session.orgId)
            .is("deleted_at", null),
        ]);
        // Latest-wins per user between safe and help — the newer receipt is
        // that person's current answer.
        const latest = new Map<string, { channel: string; at: string }>();
        for (const r of (allReceipts ?? []) as Array<{ user_id: string; channel: string; acknowledged_at: string | null }>) {
          const at = r.acknowledged_at ?? "";
          const cur = latest.get(r.user_id);
          if (!cur || at >= cur.at) latest.set(r.user_id, { channel: r.channel, at });
        }
        let safe = 0;
        let help = 0;
        for (const v of latest.values()) {
          if (v.channel === "need_help") help += 1;
          else safe += 1;
        }
        muster = {
          safe,
          help,
          unresponsive: Math.max(0, (memberCount ?? 0) - latest.size),
        };
      }
    }

    const assignments = await listMyAssignments(session.orgId, session.userId);
    const dead = new Set(["voided", "expired", "returned", "rejected"]);
    const active = assignments.find((a) => !dead.has(a.fulfillment_state)) ?? assignments[0];
    if (active) {
      station.manningId = active.id.slice(0, 5).toUpperCase();
      station.position = active.title ?? station.position;
      const [{ data: proj }, { data: guides }] = await Promise.all([
        supabase.from("projects").select("name").eq("id", active.project_id).maybeSingle(),
        supabase.from("event_guides").select("config").eq("project_id", active.project_id).limit(4),
      ]);
      station.team = (proj as { name: string } | null)?.name ?? NA;
      for (const g of (guides ?? []) as Array<{ config: unknown }>) {
        const cfg = g.config as GuideConfig | null;
        const evac = cfg?.sections?.find((s) => s.type === "evacuation");
        if (evac && evac.type === "evacuation") {
          if (evac.assemblyPoint) station.assembly = evac.assemblyPoint;
          const primary = evac.routes?.[0];
          if (primary && station.reportTo === NA) {
            station.reportTo = t("m.emergency.musterTo", { to: primary.to }, `Muster: ${primary.to}`);
          }
          break;
        }
      }
    }
  }

  return (
    <div className="screen screen-anim">
      <Crumbs
        items={[
          { label: t("m.emergency.back", undefined, "Home"), href: "/m" },
          { label: t("m.emergency.title", undefined, "Emergency Card") },
        ]}
      />
      <div className="scr-eye">
        {t("m.emergency.eyebrow", undefined, "Position")} {station.manningId}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.emergency.title", undefined, "Emergency Card")}
      </h1>

      {/* Crisis first: on the day this page matters, the declared code and
          the response buttons outrank everything below them. All-clear is
          stated, not implied — an empty space reads as "not wired", not
          "nothing happening". */}
      {crisis ? (
        <>
          <CrisisPanel
            alert={crisis}
            initialMusterAckAt={musterAckAt}
            initialSafeAt={safeAt}
            initialNeedHelpAt={needHelpAt}
          />
          {muster && (
            <>
              <div className="sech">
                <h2>{t("m.muster.title", undefined, "Muster Count")}</h2>
              </div>
              <div className="rec-grid" style={{ marginBottom: 12 }}>
                <div className="rec-cell">
                  <div className="rec-k">{t("m.muster.safe", undefined, "Safe")}</div>
                  <div className="rec-v" style={{ color: "var(--p-success)" }}>{muster.safe}</div>
                </div>
                <div className="rec-cell">
                  <div className="rec-k">{t("m.muster.help", undefined, "Need Help")}</div>
                  <div className="rec-v" style={{ color: muster.help > 0 ? "var(--p-danger)" : undefined }}>
                    {muster.help}
                  </div>
                </div>
                <div className="rec-cell">
                  <div className="rec-k">{t("m.muster.unresponsive", undefined, "Unresponsive")}</div>
                  <div className="rec-v" style={{ color: muster.unresponsive > 0 ? "var(--p-warning)" : undefined }}>
                    {muster.unresponsive}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="item">
          <span className="bar" style={{ background: "var(--p-success)" }} />
          <div>
            <div className="t">{t("m.emergency.allClear", undefined, "No Active Crisis")}</div>
            <div className="s">
              {t("m.emergency.allClearBody", undefined, "If a code is declared, it appears here with your response actions.")}
            </div>
          </div>
        </div>
      )}

      {/* Station / manning card — wired to the holder's real deployment. */}
      <div className="emerg-station">
        <div className="es-grid">
          <div>
            <div className="es-k">{t("m.emergency.assembly", undefined, "Assembly Point")}</div>
            <div className="es-v">{station.assembly}</div>
          </div>
          <div>
            <div className="es-k">{t("m.emergency.position", undefined, "Position")}</div>
            <div className="es-v">{station.position}</div>
          </div>
          <div>
            <div className="es-k">{t("m.emergency.project", undefined, "Project")}</div>
            <div className="es-v">{station.team}</div>
          </div>
          <div>
            <div className="es-k">{t("m.emergency.musterLabel", undefined, "Muster")}</div>
            <div className="es-v">{station.reportTo}</div>
          </div>
        </div>
      </div>

      {/* Quick-jump tiles — the dedicated emergency reference PAGES (kit 31
          resolution #9; formerly guide-anchor deep links). */}
      <div className="qa" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 6 }}>
        <Link href="/m/emergency/fire" style={{ textDecoration: "none" }}>
          <span
            className="qi"
            style={{ background: "color-mix(in oklab, var(--p-warning) 16%, transparent)", color: "var(--p-warning)" }}
          >
            <KIcon name="Flame" size={18} />
          </span>
          <span className="ql">{t("m.emergency.fire", undefined, "Fire Safety")}</span>
        </Link>
        <Link href="/m/emergency/evacuation" style={{ textDecoration: "none" }}>
          <span
            className="qi"
            style={{ background: "color-mix(in oklab, var(--p-info) 14%, transparent)", color: "var(--p-info)" }}
          >
            <KIcon name="LogOut" size={18} />
          </span>
          <span className="ql">{t("m.emergency.evac", undefined, "Evacuate")}</span>
        </Link>
        <Link href="/m/emergency/shelter" style={{ textDecoration: "none" }}>
          <span
            className="qi"
            style={{ background: "color-mix(in oklab, var(--p-success) 14%, transparent)", color: "var(--p-success)" }}
          >
            <KIcon name="Shield" size={18} />
          </span>
          <span className="ql">{t("m.emergency.shelter", undefined, "Shelter")}</span>
        </Link>
      </div>

      {/* Emergency codes list (static reference data) — rows open the Codes
          page, where each code carries its department/team/individual plan. */}
      <div className="sech">
        <h2>{t("m.emergency.codes", undefined, "Emergency Codes")}</h2>
        <Link href="/m/emergency/codes" style={{ fontSize: 12, fontWeight: 700, color: "var(--p-accent-text)" }}>
          {t("m.emergency.openCodes", undefined, "Open Page")}
        </Link>
      </div>
      <div className="emerg-list">
        {EMERGENCY_CODES.map((e) => (
          <Link
            className="emerg-row"
            key={e.code}
            href={`/m/emergency/codes#code-${e.code.toLowerCase()}`}
            style={{ textDecoration: "none" }}
          >
            <span
              className="emerg-chip"
              style={{
                background: chipBg(e.tint),
                color: chipFg(e.tint, e.ink),
                border: e.tint === "neutral" ? "1px solid var(--p-border)" : "none",
              }}
            >
              {e.code}
            </span>
            <span className="emerg-trig">{e.trigger}</span>
            <KIcon name="ChevronRight" size={15} style={{ color: "var(--p-text-3)", flex: "none" }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
