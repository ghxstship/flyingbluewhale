import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { listMyAssignments } from "@/lib/db/assignments";
import type { GuideConfig } from "@/lib/guides/types";
import { KIcon } from "@/components/mobile/kit";
import { CrisisPanel, type ActiveCrisis } from "./CrisisPanel";
import { CRISIS_ACTIVE_WINDOW_MS } from "./crisis";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Emergency Card — the field crew's manning-list emergency station,
 * like a cruise ship's muster card. The manning card is wired to the viewer's
 * REAL deployment: their active `assignments` row (position + manning id) and
 * the project's crew `event_guides` evacuation section (assembly point + muster
 * routes). When the holder has no active assignment, the card renders an honest
 * "awaiting assignment" state rather than a placeholder station.
 *
 * The emergency CODES below are the standard universal venue code set (industry
 * reference, not project data) — correctly static, like the OSHA list. The kit
 * authors per-code hex chips; we map each code to a `--p-*` semantic token (no
 * literal colors per the kit token rule) keeping the same code → trigger pairing.
 */

const NA = "—";

/** Code → semantic token tint + dark-ink flag, mapped off the kit colorway. */
const CODES: { code: string; trigger: string; tint: string; ink?: "dark" }[] = [
  { code: "Red", trigger: "Fire, Lightning Strike, High Winds or Weather", tint: "danger" },
  { code: "Orange", trigger: "Crowd Surge", tint: "warning" },
  { code: "Yellow", trigger: "Structural Damage or Severe Equipment Failure", tint: "warning", ink: "dark" },
  { code: "Green", trigger: "Burglary or Theft", tint: "success" },
  { code: "Blue", trigger: "Medical Emergency", tint: "info" },
  { code: "Purple", trigger: "Cultural Sensitivity Issue", tint: "accent" },
  { code: "Pink", trigger: "Drug or Illegal Substance Trafficking", tint: "danger", ink: "dark" },
  { code: "Indigo", trigger: "Missing Talent", tint: "info" },
  { code: "White", trigger: "ICE Raid or Government Agency Intervention", tint: "neutral", ink: "dark" },
  { code: "Black", trigger: "Acts of Terror, Active Shooter or Bomb Threat", tint: "text-1" },
];

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
        .in("channel", ["muster_ack", "self_safe"]);
      for (const r of receipts ?? []) {
        if (r.channel === "muster_ack") musterAckAt = r.acknowledged_at;
        if (r.channel === "self_safe") safeAt = r.acknowledged_at;
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

  const chipBg = (tint: string) =>
    tint === "text-1"
      ? "var(--p-text-1)"
      : tint === "neutral"
        ? "var(--p-surface)"
        : `var(--p-${tint})`;
  const chipFg = (tint: string, ink?: "dark") =>
    tint === "neutral" ? "var(--p-text-1)" : ink ? "var(--p-bg)" : "var(--p-accent-contrast, #fff)";

  return (
    <div className="screen screen-anim">
      <Link href="/m" className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {t("m.emergency.back", undefined, "Home")}
      </Link>
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
        <CrisisPanel alert={crisis} initialMusterAckAt={musterAckAt} initialSafeAt={safeAt} />
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

      {/* Quick-jump tiles — deep-link into the guide's semantic section
          anchors (GuideView stamps `#guide-<type>` on the first section of
          each type; a missing section degrades to the guide top). */}
      <div className="qa" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 6 }}>
        <Link href="/m/guide#guide-fire_safety" style={{ textDecoration: "none" }}>
          <span
            className="qi"
            style={{ background: "color-mix(in oklab, var(--p-warning) 16%, transparent)", color: "var(--p-warning)" }}
          >
            <KIcon name="Flame" size={18} />
          </span>
          <span className="ql">{t("m.emergency.fire", undefined, "Fire Safety")}</span>
        </Link>
        <Link href="/m/guide#guide-evacuation" style={{ textDecoration: "none" }}>
          <span
            className="qi"
            style={{ background: "color-mix(in oklab, var(--p-info) 14%, transparent)", color: "var(--p-info)" }}
          >
            <KIcon name="LogOut" size={18} />
          </span>
          <span className="ql">{t("m.emergency.evac", undefined, "Evacuate")}</span>
        </Link>
        <Link href="/m/guide#guide-sops" style={{ textDecoration: "none" }}>
          <span
            className="qi"
            style={{ background: "color-mix(in oklab, var(--p-success) 14%, transparent)", color: "var(--p-success)" }}
          >
            <KIcon name="Shield" size={18} />
          </span>
          <span className="ql">{t("m.emergency.shelter", undefined, "Shelter")}</span>
        </Link>
      </div>

      {/* Emergency codes list (static reference data). */}
      <div className="sech">
        <h2>{t("m.emergency.codes", undefined, "Emergency Codes")}</h2>
      </div>
      <div className="emerg-list">
        {CODES.map((e) => (
          <div className="emerg-row" key={e.code}>
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
          </div>
        ))}
      </div>
    </div>
  );
}
