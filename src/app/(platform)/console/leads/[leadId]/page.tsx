import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import { timeAgo } from "@/lib/format";
import { LeadStageMover } from "./LeadStageMover";
import { deleteLead } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function LeadDetail({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const lead = await getOrgScoped("leads", session.orgId, leadId);
  if (!lead) notFound();
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.leads.detail.eyebrow", undefined, "Lead")}
        title={lead.name}
        subtitle={lead.email ?? t("console.leads.detail.noEmail", undefined, "No email")}
        action={
          <div className="flex items-center gap-2">
            <LeadStageMover leadId={lead.id} stage={lead.stage} />
            <Button href={`/console/leads/${leadId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteLead.bind(null, leadId)}
              confirm={t(
                "console.leads.detail.deleteConfirm",
                { name: lead.name },
                `Delete lead "${lead.name}"? This cannot be undone.`,
              )}
            />
          </div>
        }
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label={t("console.leads.detail.fields.stage", undefined, "Stage")}>
            <StatusBadge status={lead.stage} />
          </Field>
          <Field label={t("console.leads.detail.fields.value", undefined, "Value")}>
            {formatMoney(lead.estimated_value_cents)}
          </Field>
          <Field label={t("console.leads.detail.fields.source", undefined, "Source")}>{lead.source ?? "—"}</Field>
          <Field label={t("console.leads.detail.fields.updated", undefined, "Updated")}>
            {timeAgo(lead.updated_at)}
          </Field>
        </div>
        {lead.notes && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">{t("console.leads.detail.notesHeading", undefined, "Notes")}</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--text-secondary)]">{lead.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
