import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getOrgScoped, listOrgScoped } from "@/lib/db/resource";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestT } from "@/lib/i18n/request";
import { addJournalLine } from "./actions";

export const dynamic = "force-dynamic";

type Entry = {
  id: string;
  entry_number: string;
  description: string;
  period_id: string;
  posted_at: string | null;
};

type Line = {
  id: string;
  line_number: number;
  account_id: string;
  debit_minor: number | null;
  credit_minor: number | null;
  description: string | null;
};

type Account = { id: string; account_code: string; account_name: string };
type Period = { id: string; period_label: string };

function minorToUSD(minor: number): string {
  return (minor / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function JournalEntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="page-content">
        {t("console.finance.ledger.detail.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const { id } = await params;
  const session = await requireSession();
  const entry = (await getOrgScoped("journal_entries", session.orgId, id)) as Entry | null;
  if (!entry) notFound();

  const supabase = await createClient();
  const { data: lineData } = await (supabase as unknown as LooseSupabase)
    .from("journal_entry_lines")
    .select("id, line_number, account_id, debit_minor, credit_minor, description")
    .eq("journal_entry_id", entry.id)
    .order("line_number", { ascending: true });
  const lines = (lineData ?? []) as Line[];

  const accounts = (await listOrgScoped("chart_of_accounts", session.orgId, {
    orderBy: "account_code",
    ascending: true,
    limit: 1000,
  })) as Account[];
  const accountLabel = new Map(accounts.map((a) => [a.id, `${a.account_code} · ${a.account_name}`]));

  const periods = (await listOrgScoped("accounting_periods", session.orgId, { limit: 1000 })) as Period[];
  const periodLabel = periods.find((p) => p.id === entry.period_id)?.period_label ?? "—";

  const totalDebit = lines.reduce((s, l) => s + (l.debit_minor ?? 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit_minor ?? 0), 0);
  const diff = totalDebit - totalCredit;
  const balanced = diff === 0 && lines.length > 0;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.ledger.detail.eyebrow", undefined, "General Ledger")}
        title={entry.entry_number}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{entry.description}</span>
            <Badge variant="muted">{periodLabel}</Badge>
            <span className="font-mono text-xs">
              {entry.posted_at ? new Date(entry.posted_at).toLocaleDateString() : "—"}
            </span>
          </span>
        }
      />
      <div className="page-content space-y-4">
        <section className="surface flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">
                {t("console.finance.ledger.detail.totalDebits", undefined, "Total debits")}
              </div>
              <div className="mt-1 font-mono">{minorToUSD(totalDebit)}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">
                {t("console.finance.ledger.detail.totalCredits", undefined, "Total credits")}
              </div>
              <div className="mt-1 font-mono">{minorToUSD(totalCredit)}</div>
            </div>
          </div>
          {balanced ? (
            <span className="font-semibold text-[var(--p-success)]">
              {t("console.finance.ledger.detail.balanced", undefined, "Balanced ✓")}
            </span>
          ) : (
            <span className="font-mono font-semibold text-[var(--p-danger)]">
              {t(
                "console.finance.ledger.detail.outOfBalance",
                { diff: minorToUSD(Math.abs(diff)) },
                `Out of balance by ${minorToUSD(Math.abs(diff))}`,
              )}
            </span>
          )}
        </section>

        {lines.length === 0 ? (
          <EmptyState
            size="compact"
            title={t("console.finance.ledger.detail.noLines.label", undefined, "No lines yet")}
            description={t(
              "console.finance.ledger.detail.noLines.description",
              undefined,
              "Add debit and credit lines below until the entry balances.",
            )}
          />
        ) : (
          <div className="data-table surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--p-border)] text-left text-xs text-[var(--p-text-2)]">
                  <th className="px-4 py-2.5 font-medium">
                    {t("console.finance.ledger.detail.cols.line", undefined, "#")}
                  </th>
                  <th className="px-4 py-2.5 font-medium">
                    {t("console.finance.ledger.detail.cols.account", undefined, "Account")}
                  </th>
                  <th className="px-4 py-2.5 font-medium">
                    {t("console.finance.ledger.detail.cols.memo", undefined, "Memo")}
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    {t("console.finance.ledger.detail.cols.debit", undefined, "Debit")}
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    {t("console.finance.ledger.detail.cols.credit", undefined, "Credit")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} className="border-b border-[var(--p-border)] last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs">{l.line_number}</td>
                    <td className="px-4 py-2.5">{accountLabel.get(l.account_id) ?? l.account_id}</td>
                    <td className="px-4 py-2.5 text-xs text-[var(--p-text-2)]">{l.description ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {l.debit_minor ? minorToUSD(l.debit_minor) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {l.credit_minor ? minorToUSD(l.credit_minor) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <section className="max-w-2xl">
          <h2 className="mb-2 text-sm font-semibold text-[var(--p-text-1)]">
            {t("console.finance.ledger.detail.addLine", undefined, "Add line")}
          </h2>
          {accounts.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.finance.ledger.detail.noAccounts.label", undefined, "No accounts")}
              description={t(
                "console.finance.ledger.detail.noAccounts.description",
                undefined,
                "Create chart-of-accounts entries before adding journal lines.",
              )}
            />
          ) : (
            <FormShell action={addJournalLine} submitLabel={t("common.add", undefined, "Add line")}>
              <input type="hidden" name="journal_entry_id" value={entry.id} />
              <div>
                <label className="text-xs font-medium text-[var(--p-text-2)]">
                  {t("console.finance.ledger.detail.form.account", undefined, "Account")}
                </label>
                <select name="account_id" required className="ps-input mt-1.5 w-full" defaultValue={accounts[0]?.id}>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_code} · {a.account_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--p-text-2)]">
                  {t("console.finance.ledger.detail.form.side", undefined, "Side")}
                </label>
                <select name="side" required className="ps-input mt-1.5 w-full" defaultValue="debit">
                  <option value="debit">{t("console.finance.ledger.detail.form.debit", undefined, "Debit")}</option>
                  <option value="credit">
                    {t("console.finance.ledger.detail.form.credit", undefined, "Credit")}
                  </option>
                </select>
              </div>
              <Input
                label={t("console.finance.ledger.detail.form.amount", undefined, "Amount — USD")}
                name="amount_usd"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="100.00"
              />
              <Input
                label={t("console.finance.ledger.detail.form.memo", undefined, "Memo")}
                name="description"
                maxLength={300}
              />
            </FormShell>
          )}
        </section>
      </div>
    </>
  );
}
