import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateLead, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ leadId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("leads", session.orgId, p.leadId);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updateLead.bind(null, p.leadId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.leads.edit.eyebrow", undefined, "Lead")}
        title={t("console.leads.edit.title", { name: row.name }, `Edit ${row.name}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/leads/${p.leadId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.leads.edit.fields.name", undefined, "Name")}
            name="name"
            defaultValue={row.name}
            required
            maxLength={200}
          />
          <Input
            label={t("console.leads.edit.fields.email", undefined, "Email")}
            name="email"
            type="email"
            defaultValue={row.email ?? ""}
          />
          <Input
            label={t("console.leads.edit.fields.phone", undefined, "Phone")}
            name="phone"
            defaultValue={row.phone ?? ""}
            maxLength={40}
          />
          <Input
            label={t("console.leads.edit.fields.source", undefined, "Source")}
            name="source"
            defaultValue={row.source ?? ""}
            maxLength={120}
          />
          <Input
            label={t("console.leads.edit.fields.estimatedValueCents", undefined, "Estimated Value (Cents)")}
            name="estimated_value_cents"
            type="number"
            defaultValue={row.estimated_value_cents != null ? String(row.estimated_value_cents) : ""}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.leads.edit.fields.notes", undefined, "Notes")}
            </span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              maxLength={4000}
              rows={5}
              className="input-base focus-ring w-full"
            />
          </label>
          <p className="text-xs text-[var(--text-muted)]">
            {t("console.leads.edit.stageHint", undefined, "Stage transitions are managed from the lead detail.")}
          </p>
        </FormShell>
      </div>
    </>
  );
}
