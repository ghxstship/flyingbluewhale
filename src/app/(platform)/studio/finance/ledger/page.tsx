import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listOrgScoped } from "@/lib/db/resource";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Entry = {
  id: string;
  entry_number: string;
  description: string;
  period_id: string;
  posted_at: string | null;
};

type Period = { id: string; period_label: string };

type LineRow = { journal_entry_id: string; debit_minor: number | null };

/** bigint minor units → a USD display string. */
function minorToUSD(minor: number): string {
  return (minor / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function LedgerPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
          title={t("console.finance.ledger.title", undefined, "General Ledger")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.ledger.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();

  // journal_entries has NO created_at — order by posted_at desc, nulls last.
  const entries = (await listOrgScoped("journal_entries", session.orgId, {
    orderBy: "posted_at",
    ascending: false,
    limit: 500,
  })) as Entry[];

  // Period labels for the join.
  const periods = (await listOrgScoped("accounting_periods", session.orgId, {
    limit: 1000,
  })) as Period[];
  const periodLabel = new Map(periods.map((p) => [p.id, p.period_label]));

  // Lines carry no org_id → fetch by journal_entry_id via LooseSupabase, then reduce.
  const totalByEntry = new Map<string, number>();
  const ids = entries.map((e) => e.id);
  if (ids.length > 0) {
    const supabase = await createClient();
    const { data: lines } = await (supabase as unknown as LooseSupabase)
      .from("journal_entry_lines")
      .select("journal_entry_id, debit_minor")
      .in("journal_entry_id", ids);
    for (const line of (lines ?? []) as LineRow[]) {
      const prev = totalByEntry.get(line.journal_entry_id) ?? 0;
      totalByEntry.set(line.journal_entry_id, prev + (line.debit_minor ?? 0));
    }
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
        title={t("console.finance.ledger.title", undefined, "General Ledger")}
        subtitle={t(
          "console.finance.ledger.subtitle",
          { count: entries.length },
          `${entries.length} journal entries`,
        )}
        action={
          <Button href="/studio/finance/ledger/new" size="sm">
            {t("console.finance.ledger.newCta", undefined, "+ New entry")}
          </Button>
        }
      />
      <div className="page-content">
        {entries.length === 0 ? (
          <EmptyState
            title={t("console.finance.ledger.empty.label", undefined, "No journal entries yet")}
            description={t(
              "console.finance.ledger.empty.description",
              undefined,
              "Post a journal entry to record debits and credits against the chart of accounts.",
            )}
            action={
              <Button href="/studio/finance/ledger/new" size="sm">
                {t("console.finance.ledger.newCta", undefined, "+ New entry")}
              </Button>
            }
          />
        ) : (
          <div className="data-table surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--p-border)] text-left text-xs text-[var(--p-text-2)]">
                  <th className="px-4 py-2.5 font-medium">
                    {t("console.finance.ledger.cols.number", undefined, "Entry #")}
                  </th>
                  <th className="px-4 py-2.5 font-medium">
                    {t("console.finance.ledger.cols.description", undefined, "Description")}
                  </th>
                  <th className="px-4 py-2.5 font-medium">
                    {t("console.finance.ledger.cols.period", undefined, "Period")}
                  </th>
                  <th className="px-4 py-2.5 font-medium">
                    {t("console.finance.ledger.cols.posted", undefined, "Posted")}
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    {t("console.finance.ledger.cols.debits", undefined, "Total debits")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-[var(--p-border)] last:border-0 hover:bg-[var(--p-surface-2)]">
                    <td className="px-4 py-2.5 font-mono text-xs">
                      <Link href={`/studio/finance/ledger/${e.id}`} className="hover:underline">
                        {e.entry_number}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/studio/finance/ledger/${e.id}`} className="hover:underline">
                        {e.description}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-xs">{periodLabel.get(e.period_id) ?? "—"}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      {e.posted_at ? new Date(e.posted_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {minorToUSD(totalByEntry.get(e.id) ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
