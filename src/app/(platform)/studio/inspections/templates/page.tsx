import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  active: boolean;
  created_at: string;
  items: { count: number }[] | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  const CATEGORY_LABEL: Record<string, string> = {
    rigging: t("console.inspections.templates.category.rigging", undefined, "Rigging"),
    fire: t("console.inspections.templates.category.fire", undefined, "Fire"),
    electrical: t("console.inspections.templates.category.electrical", undefined, "Electrical"),
    ada: t("console.inspections.templates.category.ada", undefined, "ADA"),
    food_safety: t("console.inspections.templates.category.foodSafety", undefined, "Food Safety"),
    security: t("console.inspections.templates.category.security", undefined, "Security"),
    foh: t("console.inspections.templates.category.foh", undefined, "FOH"),
    medical: t("console.inspections.templates.category.medical", undefined, "Medical"),
    sustainability: t("console.inspections.templates.category.sustainability", undefined, "Sustainability"),
    custom: t("console.inspections.templates.category.custom", undefined, "Custom"),
  };
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.inspections.templates.eyebrow", undefined, "Safety")}
          title={t("console.inspections.templates.title", undefined, "Inspection Templates")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.inspections.templates.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("inspection_templates")
    .select("id, code, name, category, description, active, created_at, items:inspection_template_items(count)")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.inspections.templates.eyebrow", undefined, "Safety")}
        title={t("console.inspections.templates.title", undefined, "Inspection Templates")}
        subtitle={
          rows.length === 1
            ? t("console.inspections.templates.subtitleOne", { count: rows.length }, `${rows.length} template`)
            : t("console.inspections.templates.subtitleOther", { count: rows.length }, `${rows.length} templates`)
        }
        breadcrumbs={[
          { label: t("console.inspections.breadcrumb", undefined, "Inspections"), href: "/studio/inspections" },
          { label: t("console.inspections.templates.breadcrumb", undefined, "Templates") },
        ]}
        action={
          <Button href="/studio/inspections/templates/new" size="sm">
            {t("console.inspections.templates.newTemplate", undefined, "+ New Template")}
          </Button>
        }
      />
      <div className="page-content space-y-4">
        {rows.length === 0 ? (
          <div className="surface">
            <EmptyState
              size="compact"
              title={t("console.inspections.templates.empty.title", undefined, "No templates yet")}
              description={t(
                "console.inspections.templates.empty.description",
                undefined,
                "Templates define reusable checklists. Create one to schedule inspections from it.",
              )}
              action={
                <Button href="/studio/inspections/templates/new" size="sm">
                  {t("console.inspections.templates.empty.action", undefined, "+ Create first template")}
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => {
              const itemCount = row.items?.[0]?.count ?? 0;
              return (
                <li key={row.id} className="surface hover-lift p-4">
                  <Link href={`/studio/inspections/templates`} className="block">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] tracking-wider text-[var(--p-text-2)] uppercase">
                          {row.code}
                        </div>
                        <div className="mt-1 truncate text-sm font-semibold">{row.name}</div>
                      </div>
                      {!row.active && (
                        <Badge variant="muted">
                          {t("console.inspections.templates.inactive", undefined, "Inactive")}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[11px]">
                      <Badge variant="info">{CATEGORY_LABEL[row.category] ?? row.category}</Badge>
                      <span className="text-[var(--p-text-2)]">
                        {itemCount === 1
                          ? t("console.inspections.templates.itemCountOne", { count: itemCount }, `${itemCount} item`)
                          : t(
                              "console.inspections.templates.itemCountOther",
                              { count: itemCount },
                              `${itemCount} items`,
                            )}
                      </span>
                    </div>
                    {row.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-[var(--p-text-2)]">{row.description}</p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
