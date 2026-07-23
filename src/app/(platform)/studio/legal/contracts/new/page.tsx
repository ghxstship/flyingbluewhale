import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { CONTRACT_KINDS, contractKindLabel } from "@/lib/clm/queries";
import { createContract } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.legal.contracts.new.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");
  const projectList = (projects ?? []) as Array<{ id: string; name: string }>;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.contracts.new.eyebrow", undefined, "Legal")}
        title={t("console.legal.contracts.new.title", undefined, "New contract")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createContract}
          cancelHref="/studio/legal/contracts"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <Input
            label={t("console.legal.contracts.new.titleLabel", undefined, "Title")}
            name="title"
            required
            maxLength={200}
            placeholder="MMW26 Headliner Sponsorship"
          />
          <Input
            label={t("console.legal.contracts.new.numberLabel", undefined, "Number")}
            name="number"
            required
            maxLength={64}
            placeholder="CT-2026-014"
            hint={t("console.legal.contracts.new.numberHint", undefined, "Your internal contract reference.")}
          />
          <div>
            <label htmlFor="kind" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.legal.contracts.new.kindLabel", undefined, "Kind")}
            </label>
            <select id="kind" name="kind" required className="ps-input mt-1.5 w-full" defaultValue="sponsor_deal">
              {CONTRACT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {contractKindLabel(k)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="project_id" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.legal.contracts.new.projectLabel", undefined, "Project")}
            </label>
            <select id="project_id" name="project_id" required className="ps-input mt-1.5 w-full" defaultValue="">
              <option value="" disabled>
                {t("console.legal.contracts.new.projectPlaceholder", undefined, "Select a project…")}
              </option>
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t("console.legal.contracts.new.counterpartyNameLabel", undefined, "Counterparty name")}
            name="counterparty_name"
            maxLength={200}
            placeholder="Acme Beverages, Inc."
          />
          <Input
            label={t("console.legal.contracts.new.counterpartyEmailLabel", undefined, "Counterparty email")}
            name="counterparty_email"
            type="email"
            maxLength={200}
            placeholder="legal@acme.example"
          />
          <Input
            label={t("console.legal.contracts.new.totalValueLabel", undefined, "Total value (USD)")}
            name="total_value_usd"
            type="number"
            step="0.01"
            min="0"
            hint={t(
              "console.legal.contracts.new.totalValueHint",
              undefined,
              "Optional. Stored in minor units (cents).",
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.legal.contracts.new.startAtLabel", undefined, "Start date")}
              name="start_at"
              type="date"
            />
            <Input
              label={t("console.legal.contracts.new.endAtLabel", undefined, "End date")}
              name="end_at"
              type="date"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--p-text-1)]">
            <input type="checkbox" name="auto_renew" className="size-4" />
            {t("console.legal.contracts.new.autoRenewLabel", undefined, "Auto-renew at term end")}
          </label>
          <div>
            <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.legal.contracts.new.notesLabel", undefined, "Notes")}
            </label>
            <textarea id="notes" name="notes" rows={3} maxLength={2000} className="ps-input mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
