import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { MEAL_CATEGORIES, MEAL_CATEGORY_LABELS } from "@/lib/open-shifts";
import { getRequestT } from "@/lib/i18n/request";
import { redeemMealTicketAction } from "./actions";

export const dynamic = "force-dynamic";

type TicketRow = {
  id: string;
  holder_name: string;
  meal_category: string;
  meal_date: string;
  is_redeemed: boolean;
  redeemed_at: string | null;
  notes: string | null;
};

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [projectResp, ticketsResp] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("meal_tickets")
      .select("id, holder_id, meal_category, meal_date, is_redeemed, redeemed_at, notes")
      .eq("project_id", projectId)
      .eq("org_id", session.orgId)
      .order("meal_date", { ascending: true })
      .order("meal_category")
      .limit(2000),
  ]);

  if (!projectResp.data) return notFound();
  const project = projectResp.data as { id: string; name: string };

  const rawTickets = (ticketsResp.data ?? []) as Array<{
    id: string; holder_id: string; meal_category: string;
    meal_date: string; is_redeemed: boolean; redeemed_at: string | null; notes: string | null;
  }>;

  const holderIds = Array.from(new Set(rawTickets.map((t) => t.holder_id)));
  const { data: users } = holderIds.length
    ? await supabase.from("users").select("id, name, email").in("id", holderIds)
    : { data: [] };

  const userMap = new Map(
    ((users ?? []) as Array<{ id: string; name: string | null; email: string }>)
      .map((u) => [u.id, u.name ?? u.email]),
  );

  const rows: TicketRow[] = rawTickets.map((t) => ({
    id: t.id,
    holder_name: userMap.get(t.holder_id) ?? "Unknown",
    meal_category: t.meal_category,
    meal_date: t.meal_date,
    is_redeemed: t.is_redeemed,
    redeemed_at: t.redeemed_at,
    notes: t.notes,
  }));

  const totalTickets = rows.length;
  const redeemed = rows.filter((r) => r.is_redeemed).length;
  const outstanding = totalTickets - redeemed;

  // Kitchen summary — counts by category
  const categorySummary = MEAL_CATEGORIES.map((cat) => {
    const catRows = rows.filter((r) => r.meal_category === cat);
    return { cat, total: catRows.length, redeemed: catRows.filter((r) => r.is_redeemed).length };
  }).filter((s) => s.total > 0);

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={t("console.projects.advancing.catering.title", undefined, "Catering Report")}
        subtitle={t(
          "console.projects.advancing.catering.subtitle",
          { outstanding, redeemed, total: totalTickets },
          `${outstanding} Outstanding · ${redeemed} Redeemed · ${totalTickets} Total`,
        )}
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project.name, href: `/console/projects/${projectId}` },
          { label: "Advancing", href: `/console/projects/${projectId}/advancing` },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.projects.advancing.catering.metric.outstanding", undefined, "Outstanding")}
            value={String(outstanding)}
            accent={outstanding > 0}
          />
          <MetricCard
            label={t("console.projects.advancing.catering.metric.redeemed", undefined, "Redeemed")}
            value={String(redeemed)}
          />
          <MetricCard
            label={t("console.projects.advancing.catering.metric.total", undefined, "Total Issued")}
            value={String(totalTickets)}
          />
        </div>

        {/* Kitchen summary grid */}
        {categorySummary.length > 0 && (
          <div className="surface p-4">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
              {t("console.projects.advancing.catering.kitchenSummary", undefined, "Kitchen Summary")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categorySummary.map(({ cat, total, redeemed: r }) => (
                <div key={cat} className="surface-raised rounded-lg p-3">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">
                    {MEAL_CATEGORY_LABELS[cat as keyof typeof MEAL_CATEGORY_LABELS]}
                  </p>
                  <p className="mt-1 text-xl font-semibold">{r} / {total}</p>
                  <p className="text-xs text-[var(--text-muted)]">redeemed / issued</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <DataTable<TicketRow>
          tableId="advancing.meal_tickets"
          rows={rows}
          emptyLabel={t("console.projects.advancing.catering.empty.label", undefined, "No meal tickets issued")}
          emptyDescription={t(
            "console.projects.advancing.catering.empty.desc",
            undefined,
            "Issue meal tickets from the assignments view or via advancing.",
          )}
          columns={[
            {
              key: "holder",
              header: t("console.projects.advancing.catering.column.holder", undefined, "Crew Member"),
              render: (r) => r.holder_name,
              accessor: (r) => r.holder_name,
              filterable: true,
            },
            {
              key: "category",
              header: t("console.projects.advancing.catering.column.category", undefined, "Meal"),
              render: (r) => MEAL_CATEGORY_LABELS[r.meal_category as keyof typeof MEAL_CATEGORY_LABELS] ?? r.meal_category,
              accessor: (r) => r.meal_category,
              filterable: true,
              groupable: true,
            },
            {
              key: "date",
              header: t("console.projects.advancing.catering.column.date", undefined, "Date"),
              render: (r) => r.meal_date,
              accessor: (r) => r.meal_date,
              filterable: true,
              groupable: true,
            },
            {
              key: "status",
              header: t("console.projects.advancing.catering.column.status", undefined, "Status"),
              render: (r) => (
                <Badge variant={r.is_redeemed ? "success" : "info"}>
                  {r.is_redeemed
                    ? t("console.projects.advancing.catering.redeemed", undefined, "Redeemed")
                    : t("console.projects.advancing.catering.outstanding", undefined, "Outstanding")}
                </Badge>
              ),
              accessor: (r) => r.is_redeemed ? "redeemed" : "outstanding",
              filterable: true,
              groupable: true,
            },
            {
              key: "action",
              header: t("console.projects.advancing.catering.column.action", undefined, "Action"),
              render: (r) =>
                !r.is_redeemed ? (
                  <form action={redeemMealTicketAction}>
                    <input type="hidden" name="ticket_id" value={r.id} />
                    <input type="hidden" name="project_id" value={projectId} />
                    <button type="submit" className="btn btn-primary btn-xs">
                      {t("console.projects.advancing.catering.action.redeem", undefined, "Redeem")}
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">
                    {r.redeemed_at ? new Date(r.redeemed_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </span>
                ),
              accessor: () => null,
            },
          ]}
        />
      </div>
    </>
  );
}
