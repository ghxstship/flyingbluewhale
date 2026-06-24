import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listOrgScoped } from "@/lib/db/resource";
import { getRequestT } from "@/lib/i18n/request";
import { createAccount } from "./actions";

export const dynamic = "force-dynamic";

type AccountOption = { id: string; account_code: string; account_name: string };

export default async function NewAccountPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="page-content">
        {t("console.finance.accounts.new.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const parents = (await listOrgScoped("chart_of_accounts", session.orgId, {
    orderBy: "account_code",
    ascending: true,
    limit: 1000,
  })) as AccountOption[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.accounts.new.eyebrow", undefined, "Chart of Accounts")}
        title={t("console.finance.accounts.new.title", undefined, "New account")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createAccount}
          cancelHref="/studio/finance/accounts"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <Input
            label={t("console.finance.accounts.new.codeLabel", undefined, "Account code")}
            name="account_code"
            required
            maxLength={64}
            placeholder="1000"
          />
          <Input
            label={t("console.finance.accounts.new.nameLabel", undefined, "Account name")}
            name="account_name"
            required
            maxLength={200}
            placeholder="Cash — operating"
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.finance.accounts.new.typeLabel", undefined, "Account type")}
            </label>
            <select name="account_type" required className="ps-input mt-1.5 w-full" defaultValue="asset">
              <option value="asset">{t("console.finance.accounts.type.asset", undefined, "Asset")}</option>
              <option value="liability">
                {t("console.finance.accounts.type.liability", undefined, "Liability")}
              </option>
              <option value="equity">{t("console.finance.accounts.type.equity", undefined, "Equity")}</option>
              <option value="revenue">{t("console.finance.accounts.type.revenue", undefined, "Revenue")}</option>
              <option value="expense">{t("console.finance.accounts.type.expense", undefined, "Expense")}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.finance.accounts.new.normalLabel", undefined, "Normal balance")}
            </label>
            <select name="normal_balance" required className="ps-input mt-1.5 w-full" defaultValue="debit">
              <option value="debit">{t("console.finance.accounts.normal.debit", undefined, "Debit")}</option>
              <option value="credit">{t("console.finance.accounts.normal.credit", undefined, "Credit")}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.finance.accounts.new.parentLabel", undefined, "Parent account")}
            </label>
            <select name="parent_account_id" className="ps-input mt-1.5 w-full" defaultValue="">
              <option value="">
                {t("console.finance.accounts.new.parentNone", undefined, "— None (top level) —")}
              </option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.account_code} · {p.account_name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_postable" defaultChecked className="h-4 w-4" />
            {t("console.finance.accounts.new.postableLabel", undefined, "Postable (entries can post directly)")}
          </label>
        </FormShell>
      </div>
    </>
  );
}
