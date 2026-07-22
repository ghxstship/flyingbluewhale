import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { Crumbs, KIcon } from "@/components/mobile/kit";
import { INCIDENT_STATE_LABEL, INCIDENT_STATE_TONE, INCIDENT_SEVERITY_TONE, allowedIncidentTransitions, type IncidentState } from "@/lib/db/incident-fsm";
import { TriageRow } from "./TriageRow";

export const dynamic = "force-dynamic";

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
      "id, summary, description, severity, incident_state, location, occurred_at, photos, injury_type, report_kind, closed_at, closed_by, reporter_id",
    )
    .eq("org_id", session.orgId)
    .eq("id", incidentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!row) notFound();

  const state = row.incident_state as IncidentState;
  const photos = Array.isArray(row.photos) ? (row.photos as string[]) : [];

  // Attribution. `reporter_id` and `closed_at` were both selected and shown
  // nowhere — on a safety record, WHO filed it and WHO signed it off is the
  // part an investigator or insurer actually asks for. `closed_by` is written
  // by the shared FSM (20260722140000_incident_close_signoff).
  const reporterId = row.reporter_id as string | null;
  const closedById = row.closed_by as string | null;
  const partyIds = [...new Set([reporterId, closedById].filter(Boolean) as string[])];
  const nameById = new Map<string, string>();
  if (partyIds.length > 0) {
    // soft-delete-exempt: resolving actor names by id for an audit line — a
    // since-offboarded reporter must still be named on the record.
    const { data: people } = await supabase.from("users").select("id, name, email").in("id", partyIds);
    for (const u of (people ?? []) as { id: string; name: string | null; email: string | null }[]) {
      nameById.set(u.id, u.name || u.email || t("m.incident.someone", undefined, "A member"));
    }
  }
  const reporterName = reporterId ? (nameById.get(reporterId) ?? null) : null;
  const closedByName = closedById ? (nameById.get(closedById) ?? null) : null;

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
  // Private bucket — the paths are useless without a signature. Failure to
  // sign degrades to "no preview" rather than a broken image, because a
  // broken <img> reads as "the evidence is gone". The status chain read and
  // the photo signing are independent, so they run in one round trip.
  const svc = photos.length && isServiceClientAvailable() ? createServiceClient() : null;
  const [auditRes, signedResults] = await Promise.all([
    supabase
      .from("audit_log")
      .select("action, metadata, at")
      .eq("org_id", session.orgId)
      .eq("target_table", "incidents")
      .eq("target_id", incidentId)
      .in("action", ["incident.state_changed", "incident.follow_up_filed"])
      .order("at", { ascending: true })
      .limit(30),
    svc
      ? Promise.all(
          photos.map(async (p) => {
            const { data } = await svc.storage.from("incident-photos").createSignedUrl(p, 300);
            return data?.signedUrl ?? null;
          }),
        )
      : Promise.resolve([] as (string | null)[]),
  ]);
  {
    for (const a of (auditRes.data ?? []) as Array<{ action: string | null; metadata: unknown; at: string | null }>) {
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

  const signed: string[] = signedResults.filter((u): u is string => !!u);

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
        <span className={`ps-badge ps-badge--${INCIDENT_STATE_TONE[state] ?? "neutral"}`}>{INCIDENT_STATE_LABEL[state]}</span>
        <span className={`ps-badge ps-badge--${INCIDENT_SEVERITY_TONE[row.severity as string] ?? "neutral"}`}>
          {(row.severity as string).replace(/_/g, " ")}
        </span>
        {row.injury_type ? (
          <span className="ps-badge ps-badge--danger">{t("m.incident.injuryReported", undefined, "Injury reported")}</span>
        ) : null}
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

        {/* Who filed it, and who signed it off — the audit line a safety record
            is judged on. Both were fetched and displayed nowhere. */}
        {(reporterName || row.closed_at) && (
          <div className="hint" style={{ marginTop: 8, display: "grid", gap: 2 }}>
            {reporterName && (
              <span>{t("m.incident.reportedBy", { name: reporterName }, `Reported by ${reporterName}`)}</span>
            )}
            {row.closed_at && (
              <span>
                {closedByName
                  ? t(
                      "m.incident.closedByOn",
                      { name: closedByName, when: fmt.date(row.closed_at as string) },
                      `Closed by ${closedByName} · ${fmt.date(row.closed_at as string)}`,
                    )
                  : t(
                      "m.incident.closedOn",
                      { when: fmt.date(row.closed_at as string) },
                      `Closed ${fmt.date(row.closed_at as string)}`,
                    )}
              </span>
            )}
          </div>
        )}
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
                  alt={t("m.incident.evidenceAlt", { n: i + 1 }, `Evidence ${i + 1}`)}
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
      {/* Only the moves this caller may actually make — closing an injury or
          major/critical report is a manager sign-off, and reopening a closed
          record is manager-only, so those simply don't render for crew rather
          than being offered and then refused. */}
      <TriageRow
        id={row.id as string}
        current={state}
        allowed={allowedIncidentTransitions(state, {
          reportKind: row.report_kind as string | null,
          severity: row.severity as string | null,
          hasInjury: row.injury_type != null,
          isManager: isManagerPlus(session),
        })}
      />

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
