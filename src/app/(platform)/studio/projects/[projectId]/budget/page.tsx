export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { money } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const [{ data: project }, { data: budgets }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("budgets")
      .select("id, name, category, amount_cents, spent_cents")
      .eq("project_id", projectId)
      .order("category"),
  ]);
  const total = (budgets ?? []).reduce((s, b) => s + (b.amount_cents ?? 0), 0);
  const spent = (budgets ?? []).reduce((s, b) => s + (b.spent_cents ?? 0), 0);
  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? t("console.projects.budget.eyebrowFallback", undefined, "Project")}
        title={t("console.projects.budget.title", undefined, "Budget")}
        subtitle={
          total
            ? t(
                "console.projects.budget.subtitle",
                { spent: money(spent), total: money(total) },
                `${money(spent)} of ${money(total)} spent`,
              )
            : undefined
        }
        breadcrumbs={[
          { label: t("console.projects.breadcrumbs.projects", undefined, "Projects"), href: "/studio/projects" },
          {
            label: project?.name ?? t("console.projects.budget.eyebrowFallback", undefined, "Project"),
            href: `/studio/projects/${projectId}`,
          },
          { label: t("console.projects.budget.title", undefined, "Budget") },
        ]}
      />
      <div className="page-content max-w-5xl space-y-3">
        {!budgets || budgets.length === 0 ? (
          <EmptyState
            title={t("console.projects.budget.empty.title", undefined, "No Budgets Yet")}
            description={t(
              "console.projects.budget.empty.description",
              undefined,
              "Create a budget from the Finance module.",
            )}
            action={
              <Link className="text-sm text-[var(--p-accent)]" href="/studio/finance/budgets/new">
                {t("console.projects.budget.empty.action", undefined, "New budget →")}
              </Link>
            }
          />
        ) : (
          budgets.map((b) => {
            const pct = b.amount_cents ? Math.min(100, Math.round((b.spent_cents / b.amount_cents) * 100)) : 0;
            return (
              <Link key={b.id} href={`/studio/finance/budgets/${b.id}`} className="surface hover-lift block p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{b.name}</div>
                    {b.category && (
                      <div className="text-[10px] tracking-[0.2em] text-[var(--p-text-2)] uppercase">{b.category}</div>
                    )}
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-mono">
                      {money(b.spent_cents)} / {money(b.amount_cents)}
                    </div>
                    <div className="text-[var(--p-text-2)]">{pct}%</div>
                  </div>
                </div>
                <div className="mt-2">
                  <ProgressBar value={pct} />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
