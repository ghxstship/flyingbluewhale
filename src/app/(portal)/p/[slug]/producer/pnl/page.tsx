import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";

export const dynamic = "force-dynamic";

export default async function ProducerPnL({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const project = await projectIdFromSlug(slug);

  if (!project) {
    return (
      <div className="flex min-h-screen">
        <PortalRail items={portalNav(slug, "producer")} title="Producer" />
        <div className="flex-1 p-6">
          <EmptyState title="No Project" description="P&L surfaces require a resolved project." />
        </div>
      </div>
    );
  }

  // Headline numbers from invoices (revenue), expenses (cost),
  // budgets.spent_cents (committed). Lightweight roll-up; the full
  // finance view lives on /console/finance/reports.
  const [{ data: budget }, expensesRes, invoicesRes] = await Promise.all([
    supabase.from("budgets").select("budget_cents, spent_cents, currency").eq("project_id", project.id).maybeSingle(),
    supabase.from("expenses").select("amount_cents").eq("org_id", session.orgId).eq("project_id", project.id),
    supabase.from("invoices").select("amount_cents, status").eq("org_id", session.orgId).eq("project_id", project.id),
  ]);
  const b = budget as { budget_cents: number; spent_cents: number; currency: string } | null;
  const currency = b?.currency ?? "USD";
  const expenseTotal = ((expensesRes.data ?? []) as Array<{ amount_cents: number }>).reduce(
    (s, e) => s + (e.amount_cents ?? 0),
    0,
  );
  const invoiceTotal = ((invoicesRes.data ?? []) as Array<{ amount_cents: number; status: string }>)
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.amount_cents ?? 0), 0);
  const margin = invoiceTotal - expenseTotal;
  const fmtMoney = (cents: number) => fmt.money(cents, currency);

  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "producer")} title="Producer" />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">P&amp;L</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">Headline roll-up for {project.name}.</p>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="surface p-4">
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Budget</div>
            <div className="mt-1 font-mono text-2xl font-semibold">
              {b?.budget_cents != null ? fmtMoney(b.budget_cents) : "—"}
            </div>
          </div>
          <div className="surface p-4">
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Spent</div>
            <div className="mt-1 font-mono text-2xl font-semibold">{fmtMoney(b?.spent_cents ?? expenseTotal)}</div>
          </div>
          <div className="surface p-4">
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Revenue (paid)</div>
            <div className="mt-1 font-mono text-2xl font-semibold">{fmtMoney(invoiceTotal)}</div>
          </div>
          <div className="surface p-4">
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Margin</div>
            <div
              className={`mt-1 font-mono text-2xl font-semibold ${
                margin >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
              }`}
            >
              {fmtMoney(margin)}
            </div>
          </div>
        </section>

        <p className="mt-5 text-xs text-[var(--text-muted)]">
          Last updated {fmt.date(new Date().toISOString())}. Full breakdown on{" "}
          <a className="underline" href="/console/finance/reports">
            /console/finance/reports
          </a>
          .
        </p>
      </div>
    </div>
  );
}
