import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";
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

      <div className="sech">
        <h2>{t("m.incident.triage", undefined, "Triage")}</h2>
      </div>
      <TriageRow id={row.id as string} current={state} allowed={INCIDENT_TRANSITIONS[state] ?? []} />

      <a href="/m/incidents" className="ps-btn ps-btn--tertiary ps-btn--lg" style={{ width: "100%", justifyContent: "center", marginTop: 16, textDecoration: "none" }}>
        <KIcon name="ChevronLeft" size={15} /> {t("m.incident.back", undefined, "All Incidents")}
      </a>
    </div>
  );
}
