import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { SEVERITY_TONE } from "@/lib/tones";

export const dynamic = "force-dynamic";

const CLASS_TONE: Record<string, "muted" | "info" | "warning" | "error"> = {
  none: "muted",
  near_miss: "muted",
  first_aid: "info",
  medical_treatment: "warning",
  restricted_duty: "warning",
  days_away: "error",
  fatality: "error",
};

export default async function Page({ params }: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = await params;
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.safety.incidents.detail.eyebrow", undefined, "Safety · Incident")}
          title={t("console.safety.incidents.detail.title", undefined, "Incident")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.incidents.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const row = await getOrgScoped("incidents", session.orgId, incidentId);
  if (!row) notFound();

  const fmt = await getRequestFormatters();
  const fields = row as Record<string, unknown>;

  const summary = (fields["summary"] as string | undefined) ?? incidentId;
  const description = fields["description"] as string | null;
  const severity = (fields["severity"] as string | undefined) ?? "minor";
  const incidentState = (fields["incident_state"] as string | undefined) ?? "open";
  const location = fields["location"] as string | null;
  const occurredAt = fields["occurred_at"] as string | null;
  const oshaClassification = (fields["osha_classification"] as string | undefined) ?? "none";
  const oshaRecordable = Boolean(fields["osha_recordable"]);
  const daysAway = (fields["days_away"] as number | null) ?? 0;
  const daysRestricted = (fields["days_restricted"] as number | null) ?? 0;
  const bodyPart = fields["body_part"] as string | null;
  const injuryType = fields["injury_type"] as string | null;
  const injurySource = fields["injury_source"] as string | null;
  const closedAt = fields["closed_at"] as string | null;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.incidents.detail.eyebrow", undefined, "Safety · Incident")}
        title={summary}
        subtitle={occurredAt ? fmt.dateTime(occurredAt) : undefined}
        breadcrumbs={[
          {
            label: t("console.safety.incidents.detail.breadcrumbs.safety", undefined, "Safety"),
            href: "/studio/safety/incidents",
          },
          {
            label: t("console.safety.incidents.detail.breadcrumbs.incidents", undefined, "Incidents"),
            href: "/studio/safety/incidents",
          },
          { label: summary },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/safety/incidents" variant="ghost" size="sm">
              {t("common.back", undefined, "Back")}
            </Button>
            <Button href={`/studio/operations/incidents/${incidentId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
          </div>
        }
      />
      <div className="page-content max-w-4xl space-y-6">
        <div className="metric-grid">
          <Field label={t("console.safety.incidents.detail.fields.severity", undefined, "Severity")}>
            <Badge variant={SEVERITY_TONE[severity] ?? "default"}>{toTitle(severity)}</Badge>
          </Field>
          <Field label={t("console.safety.incidents.detail.fields.status", undefined, "Status")}>
            <StatusBadge status={incidentState} />
          </Field>
          <Field label={t("console.safety.incidents.detail.fields.occurred", undefined, "Occurred")}>
            {occurredAt ? fmt.dateTime(occurredAt) : "—"}
          </Field>
          <Field label={t("console.safety.incidents.detail.fields.location", undefined, "Location")}>
            {location ?? "—"}
          </Field>
        </div>

        {description && (
          <div className="surface p-5">
            <h3 className="text-base font-semibold">
              {t("console.safety.incidents.detail.description", undefined, "Description")}
            </h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{description}</p>
          </div>
        )}

        <section className="surface p-5">
          <h3 className="text-base font-semibold">
            {t("console.safety.incidents.detail.osha", undefined, "OSHA Recordkeeping")}
          </h3>
          <div className="metric-grid mt-3">
            <Field label={t("console.safety.incidents.detail.fields.classification", undefined, "Classification")}>
              <Badge variant={CLASS_TONE[oshaClassification] ?? "muted"}>{toTitle(oshaClassification)}</Badge>
            </Field>
            <Field label={t("console.safety.incidents.detail.fields.recordable", undefined, "Recordable")}>
              <Badge variant={oshaRecordable ? "warning" : "muted"}>
                {oshaRecordable
                  ? t("common.yes", undefined, "Yes")
                  : t("common.no", undefined, "No")}
              </Badge>
            </Field>
            <Field label={t("console.safety.incidents.detail.fields.daysAway", undefined, "Days Away")} mono>
              {fmt.number(daysAway)}
            </Field>
            <Field label={t("console.safety.incidents.detail.fields.daysRestricted", undefined, "Days Restricted")} mono>
              {fmt.number(daysRestricted)}
            </Field>
          </div>
        </section>

        <section className="surface p-5">
          <h3 className="text-base font-semibold">
            {t("console.safety.incidents.detail.injury", undefined, "Injury")}
          </h3>
          <div className="metric-grid mt-3">
            <Field label={t("console.safety.incidents.detail.fields.bodyPart", undefined, "Body Part")}>
              {bodyPart ?? "—"}
            </Field>
            <Field label={t("console.safety.incidents.detail.fields.injuryType", undefined, "Injury Type")}>
              {injuryType ?? "—"}
            </Field>
            <Field label={t("console.safety.incidents.detail.fields.injurySource", undefined, "Injury Source")}>
              {injurySource ?? "—"}
            </Field>
            <Field label={t("console.safety.incidents.detail.fields.closed", undefined, "Closed")}>
              {closedAt ? fmt.dateTime(closedAt) : "—"}
            </Field>
          </div>
        </section>
      </div>
    </>
  );
}

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">{label}</div>
      <div className={`mt-1 text-sm ${mono ? "font-mono" : ""}`}>{children}</div>
    </div>
  );
}
