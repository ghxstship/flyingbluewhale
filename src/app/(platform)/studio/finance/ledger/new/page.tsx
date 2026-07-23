import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listOrgScoped } from "@/lib/db/resource";
import { getRequestT } from "@/lib/i18n/request";
import { createJournalEntry } from "./actions";

export const dynamic = "force-dynamic";

type Period = { id: string; period_label: string };

export default async function NewJournalEntryPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="page-content">
        {t("console.finance.ledger.new.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const periods = (await listOrgScoped("accounting_periods", session.orgId, {
    limit: 1000,
  })) as Period[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.ledger.new.eyebrow", undefined, "General Ledger")}
        title={t("console.finance.ledger.new.title", undefined, "New journal entry")}
      />
      <div className="page-content max-w-2xl">
        {periods.length === 0 ? (
          <EmptyState
            title={t("console.finance.ledger.new.noPeriods.label", undefined, "No accounting periods")}
            description={t(
              "console.finance.ledger.new.noPeriods.description",
              undefined,
              "Open an accounting period before posting journal entries.",
            )}
            action={
              <Button href="/studio/finance/periods/new" size="sm">
                {t("console.finance.ledger.new.noPeriods.cta", undefined, "+ New period")}
              </Button>
            }
          />
        ) : (
          <FormShell
            action={createJournalEntry}
            cancelHref="/studio/finance/ledger"
            submitLabel={t("common.create", undefined, "Create")}
          >
            <Input
              label={t("console.finance.ledger.new.numberLabel", undefined, "Entry number")}
              name="entry_number"
              required
              maxLength={64}
              placeholder="JE-0001"
            />
            <Input
              label={t("console.finance.ledger.new.descriptionLabel", undefined, "Description")}
              name="description"
              required
              maxLength={300}
              placeholder="Monthly accrual"
            />
            <div>
              <label htmlFor="period_id" className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.finance.ledger.new.periodLabel", undefined, "Accounting period")}
              </label>
              <select id="period_id" name="period_id" required className="ps-input mt-1.5 w-full" defaultValue={periods[0]?.id}>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.period_label}
                  </option>
                ))}
              </select>
            </div>
          </FormShell>
        )}
      </div>
    </>
  );
}
