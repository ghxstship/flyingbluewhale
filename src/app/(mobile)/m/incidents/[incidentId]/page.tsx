import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { Crumbs, KIcon } from "@/components/mobile/kit";
import { INCIDENT_STATE_LABEL, INCIDENT_TRANSITIONS, type IncidentState } from "@/lib/db/incident-fsm";
import { TriageRow } from "./TriageRow";

export const dynamic = "force-dynamic";

const STATE_TONE: Record<string, string> = {
  open: "danger",
  investigating: "warn",
  resolved: "info",
  closed: "ok",
};

const SEVERITY_TONE: Record<string, string> = {
  critical: "danger",
  major: "danger",
  minor: "warn",
  near_miss: "neutral",
};

/**
 * COMPVSS · Incident detail.
 *
 * Mobile was file-and-forget. `fileIncident` inserted a row and that was
 * the whole relationship: no detail route existed, and the list rows
 * weren't even links — `IncidentsList` rendered a plain <div>. So the
 * person who witnessed the thing handed it to a queue and lost sight of
 * it, and whoever picked it up had to go find them to ask what happened.
 *
 * This is the other half: read the full report, see the evidence, and move
 * it along. Photos are signed on the server — `incident-photos` is a
 * private bucket, and a signed URL is the only honest way to show them.
 */
export default async function IncidentDetailPage({ params }: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: row } = await supabase
    .from("incidents")
    .select(
      "id, summary, description, severity, incident_state, location, occurred_at, photos, injury_type, report_kind, closed_at, reporter_id",
    )
    .eq("org_id", session.orgId)
    .eq("id", incidentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!row) notFound();

  const state = row.incident_state as IncidentState;
  const photos = Array.isArray(row.photos) ? (row.photos as string[]) : [];

  // Kit 32 A2 — the status chain is REAL: the filing moment plus every
  // FSM transition and follow-up the audit ledger recorded for this row
  // (`transitionIncident` / `quickFileIncident` write these events).
  // audit_log reads are org-member-scoped by RLS.
  type ChainEntry = { icon: string; txt: string; at: string | null };
  const chain: ChainEntry[] = [
    {
      icon: "TriangleAlert",
      txt: t("m.incident.chain.filed", undefined, "Report Filed"),
      at: (row.occurred_at as string) ?? null,
    },
  ];
  {
    const { data: auditRows } = await supabase
      .from("audit_log")
      .select("action, metadata, at")
      .eq("org_id", session.orgId)
      .eq("target_table", "incidents")
      .eq("target_id", incidentId)
      .in("action", ["incident.state_changed", "incident.follow_up_filed"])
      .order("at", { ascending: true })
      .limit(30);
    for (const a of (auditRows ?? []) as Array<{ action: string | null; metadata: unknown; at: string | null }>) {
      const meta = (a.metadata ?? {}) as { fromState?: string; toState?: string; summary?: string };
      if (a.action === "incident.state_changed" && meta.toState) {
        chain.push({
          icon: meta.toState === "closed" ? "CheckCheck" : "Eye",
          txt: t(
            "m.incident.chain.stateChanged",
            {
              from: INCIDENT_STATE_LABEL[meta.fromState as IncidentState] ?? meta.fromState ?? "—",
              to: INCIDENT_STATE_LABEL[meta.toState as IncidentState] ?? meta.toState,
            },
            `${INCIDENT_STATE_LABEL[meta.fromState as IncidentState] ?? meta.fromState ?? "—"} → ${INCIDENT_STATE_LABEL[meta.toState as IncidentState] ?? meta.toState}`,
          ),
          at: a.at,
        });
      } else if (a.action === "incident.follow_up_filed") {
        chain.push({
          icon: "MessageSquarePlus",
          txt: meta.summary
            ? t("m.incident.chain.followUpNamed", { summary: meta.summary }, `Follow-Up Filed · ${meta.summary}`)
            : t("m.incident.chain.followUp", undefined, "Follow-Up Filed"),
          at: a.at,
        });
      }
    }
  }

  // Private bucket — the paths are useless without a signature. Failure to
  // sign degrades to "no preview" rather than a broken image, because a
  // broken <img> reads as "the evidence is gone".
  let signed: string[] = [];
  if (photos.length && isServiceClientAvailable()) {
    const svc = createServiceClient();
    const results = await Promise.all(
      photos.map(async (p) => {
        const { data } = await svc.storage.from("incident-photos").createSignedUrl(p, 300);
        return data?.signedUrl ?? null;
      }),
    );
    signed = results.filter((u): u is string => !!u);
  }

  return (
    <div className="screen screen-anim">
      <Crumbs
        items={[
          { label: t("m.incident.crumbHome", undefined, "Home"), href: "/m" },
          { label: t("m.incident.crumbIncidents", undefined, "Incidents"), href: "/m/incidents" },
          { label: t("m.incident.crumbReport", { id: (row.id as string).slice(0, 5).toUpperCase() }, `Report · ${(row.id as string).slice(0, 5).toUpperCase()}`) },
        ]}
      />
      <div className="scr-eye">
        {row.report_kind === "lost_property"
          ? t("m.incident.eyebrowLost", undefined, "Lost & Found")
          : t("m.incident.eyebrowSafety", undefined, "Incident")}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 8 }}>
        {row.summary as string}
      </h1>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <span className={`ps-badge ps-badge--${STATE_TONE[state] ?? "neutral"}`}>{INCIDENT_STATE_LABEL[state]}</span>
        <span className={`ps-badge ps-badge--${SEVERITY_TONE[row.severity as string] ?? "neutral"}`}>
          {(row.severity as string).replace(/_/g, " ")}
        </span>
        {row.injury_type ? <span className="ps-badge ps-badge--danger">Injury reported</span> : null}
      </div>

      <div className="item" style={{ display: "block" }}>
        <div className="s">
          {[row.location as string | null, fmt.relative(row.occurred_at as string)].filter(Boolean).join(" · ")}
        </div>
        {row.description ? (
          <p className="form-intro" style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
            {row.description as string}
          </p>
        ) : null}
      </div>

      {photos.length > 0 && (
        <>
          <div className="sech">
            <h2>{t("m.incident.evidence", { n: photos.length }, `Evidence · ${photos.length}`)}</h2>
          </div>
          {signed.length === 0 ? (
            <div className="hint">
              {t("m.incident.noPreview", undefined, "Photos are attached but can't be previewed right now.")}
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {signed.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`Evidence ${i + 1}`}
                  style={{ width: 104, height: 104, objectFit: "cover", borderRadius: 8, display: "block" }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Kit 32 A2 — the status chain: filed → every FSM transition and
          follow-up the audit ledger really recorded. */}
      <div className="sech">
        <h2>{t("m.incident.chain.title", undefined, "Status Chain")}</h2>
      </div>
      <div className="tl">
        {chain.map((c, i) => (
          <div className="tl-row" key={i}>
            <span className="tdot">
              <KIcon name={c.icon} size={7} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="ttxt">{c.txt}</div>
              {c.at && <div className="ttime">{fmt.dateTime(c.at)}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="sech">
        <h2>{t("m.incident.triage", undefined, "Triage")}</h2>
      </div>
      <TriageRow id={row.id as string} current={state} allowed={INCIDENT_TRANSITIONS[state] ?? []} />

      {/* Kit 32 A2 — follow-up + related-task actions. */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Link
          href={`/m/incident/new?followUpOf=${row.id as string}`}
          className="ps-btn ps-btn--cta ps-btn--lg"
          style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
        >
          <KIcon name="MessageSquarePlus" size={15} /> {t("m.incident.addFollowUp", undefined, "Add Follow-Up")}
        </Link>
        <Link
          href="/m/tasks"
          className="ps-btn ps-btn--secondary ps-btn--lg"
          style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
        >
          <KIcon name="ListChecks" size={15} /> {t("m.incident.openTasks", undefined, "Open Tasks")}
        </Link>
      </div>

      <Link href="/m/incidents" className="ps-btn ps-btn--tertiary ps-btn--lg" style={{ width: "100%", justifyContent: "center", marginTop: 8, textDecoration: "none" }}>
        <KIcon name="ChevronLeft" size={15} /> {t("m.incident.back", undefined, "All Incidents")}
      </Link>
    </div>
  );
}
