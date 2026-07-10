import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function ProducerPnL({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">{t("p.producer.pnl.configureSupabase", undefined, "Configure Supabase.")}</div>
    );
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const project = await projectIdFromSlug(slug);

  if (!project) {
    return (
      <div className="flex min-h-screen">
        <PortalRail group={portalNav(slug, "producer")} />
        <div className="flex-1 p-6">
          <EmptyState
            title={t("p.producer.pnl.noProject.title", undefined, "No Project")}
            description={t(
              "p.producer.pnl.noProject.description",
              undefined,
              "P&L surfaces require a resolved project.",
            )}
          />
        </div>
      </div>
    );
  }

  // Headline numbers from invoices (revenue), expenses (cost),
  // budgets.actual_cents (XPMS canonical; falls back to legacy
  // spent_cents). Lightweight roll-up; the full finance view lives on
  // /studio/finance/reports.
  const [{ data: budget }, expensesRes, invoicesRes] = await Promise.all([
    supabase
      .from("budgets")
      .select("budget_cents, actual_cents, spent_cents, currency")
      .eq("project_id", project.id)
      .maybeSingle(),
    supabase.from("expenses").select("amount_cents").eq("org_id", session.orgId).eq("project_id", project.id),
    supabase
      .from("invoices")
      .select("amount_cents, invoice_state")
      .eq("org_id", session.orgId)
      .eq("project_id", project.id),
  ]);
  const b = budget as {
    budget_cents: number;
    actual_cents: number | null;
    spent_cents: number;
    currency: string;
  } | null;
  const currency = b?.currency ?? "USD";
  const expenseTotal = ((expensesRes.data ?? []) as Array<{ amount_cents: number }>).reduce(
    (s, e) => s + (e.amount_cents ?? 0),
    0,
  );
  const invoiceTotal = ((invoicesRes.data ?? []) as Array<{ amount_cents: number; invoice_state: string }>)
    .filter((i) => i.invoice_state === "paid")
    .reduce((s, i) => s + (i.amount_cents ?? 0), 0);
  const margin = invoiceTotal - expenseTotal;
  const fmtMoney = (cents: number) => fmt.money(cents, currency);

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "producer")} />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">{t("p.producer.pnl.title", undefined, "P&L")}</h1>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t("p.producer.pnl.subtitle", { projectName: project.name }, `Headline roll-up for ${project.name}.`)}
        </p>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="surface p-4">
            <div className="text-[11px] tracking-wider text-[var(--p-text-2)] uppercase">
              {t("p.producer.pnl.metrics.budget", undefined, "Budget")}
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold">
              {b?.budget_cents != null ? fmtMoney(b.budget_cents) : "—"}
            </div>
          </div>
          <div className="surface p-4">
            <div className="text-[11px] tracking-wider text-[var(--p-text-2)] uppercase">
              {t("p.producer.pnl.metrics.spent", undefined, "Spent")}
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold">
              {fmtMoney(b?.actual_cents ?? b?.spent_cents ?? expenseTotal)}
            </div>
          </div>
          <div className="surface p-4">
            <div className="text-[11px] tracking-wider text-[var(--p-text-2)] uppercase">
              {t("p.producer.pnl.metrics.revenuePaid", undefined, "Revenue (Paid)")}
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold">{fmtMoney(invoiceTotal)}</div>
          </div>
          <div className="surface p-4">
            <div className="text-[11px] tracking-wider text-[var(--p-text-2)] uppercase">
              {t("p.producer.pnl.metrics.margin", undefined, "Margin")}
            </div>
            <div
              className={`mt-1 font-mono text-2xl font-semibold ${
                margin >= 0 ? "text-[var(--p-success)]" : "text-[var(--p-danger)]"
              }`}
            >
              {fmtMoney(margin)}
            </div>
          </div>
        </section>

        <p className="mt-5 text-xs text-[var(--p-text-2)]">
          {t(
            "p.producer.pnl.lastUpdated",
            { date: fmt.date(new Date().toISOString()) },
            `Last updated ${fmt.date(new Date().toISOString())}.`,
          )}{" "}
          {t("p.producer.pnl.fullBreakdownOn", undefined, "Full breakdown on")}{" "}
          <a className="underline" href={urlFor("platform", "/finance/reports")}>
            /studio/finance/reports
          </a>
          .
        </p>
      </div>
    </div>
  );
}
