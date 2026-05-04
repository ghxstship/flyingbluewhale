import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusChip, type StatusTone } from "@/components/ui/StatusChip";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteIncident } from "./edit/actions";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const SEVERITY_TONE: Record<string, StatusTone> = {
  near_miss: "warning",
  minor: "info",
  major: "warning",
  critical: "danger",
};

export default async function Page({ params }: { params: Promise<{ incidentId: string }> }) {
  const p = await params;
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Incident" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("incidents", session.orgId, p.incidentId);
  const fmt = await getRequestFormatters();
  if (!row) notFound();
  const fields = row as Record<string, unknown>;
  const summary = (fields["summary"] as string | undefined) ?? p.incidentId;
  const severity = (fields["severity"] as string | undefined) ?? "minor";
  return (
    <>
      <ModuleHeader
        eyebrow="Operations · Incident"
        title={summary}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/operations/incidents" variant="ghost" size="sm">
              Back
            </Button>
            <Button href={`/console/operations/incidents/${p.incidentId}/edit`} size="sm">
              Edit
            </Button>
            <DeleteForm
              action={deleteIncident.bind(null, p.incidentId)}
              confirm={`Delete incident "${summary}"? This cannot be undone.`}
            />
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        <div className="surface p-5">
          <div className="flex items-center gap-3">
            <StatusChip tone={SEVERITY_TONE[severity] ?? "neutral"}>{severity}</StatusChip>
            <span className="text-xs text-[var(--text-muted)]">
              {fields["occurred_at"] ? fmt.dateTime(String(fields["occurred_at"])) : "—"}
            </span>
          </div>
        </div>
        <dl className="surface grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          {Object.entries(fields).map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="text-xs tracking-wide text-[var(--text-muted)] uppercase">{k.replace(/_/g, " ")}</dt>
              <dd className="font-mono text-xs break-all">
                {v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
